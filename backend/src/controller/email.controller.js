import { Email } from "../model/Email.js";
import { User } from "../model/User.js";
import { sendMailViaNodemailer } from "../service/sendEmail.js";
import { notifyNewEmail, notifyUnreadCount } from "../socket/socketHandler.js";
import mongoose from "mongoose";

// ======================================
// SEND EMAIL VIA NODEMAILER
// POST /api/email
// ======================================
export const sendEmails = async (req, res) => {
  try {
    const { to, subject, message, draftId } = req.body;
    const userId = req.user?.userId;

    if (!to || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Recipient (to), subject, and message are required",
      });
    }

    if (
      typeof to !== "string" ||
      typeof subject !== "string" ||
      typeof message !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid input types",
      });
    }

    // Step 1: Find sender in database
    const sender = await User.findById(userId);
    if (!sender) {
      return res.status(404).json({
        success: false,
        message: "Sender user account not found",
      });
    }

    const normalizedTo = to.trim().toLowerCase();

    // Step 2: Check if recipient is a registered app user
    const recipientUser = await User.findOne({
      email: normalizedTo,
    });

    // Step 3: Send email using Nodemailer via SMTP
    let mailResult = null;
    let smtpError = null;
    try {
      mailResult = await sendMailViaNodemailer({
        to: normalizedTo,
        subject: subject.trim(),
        message: message.trim(),
      });
    } catch (mailError) {
      console.warn("Nodemailer SMTP notice:", mailError.message);
      smtpError = mailError.message;
      // If the recipient is not a registered user AND SMTP delivery failed, return error
      if (!recipientUser) {
        return res.status(502).json({
          success: false,
          message: `Failed to send email via Nodemailer: ${mailError.message}`,
          error: mailError.message,
        });
      }
    }

    // Step 4: Save email record in database
    const newEmail = await Email.create({
      from: sender._id,
      fromEmail: sender.email,
      toEmail: normalizedTo,
      toUser: recipientUser ? recipientUser._id : null,
      subject: subject.trim(),
      message: message.trim(),
      messageId: mailResult?.messageId || `mail-${Date.now()}`,
      isRead: false,
      isDraft: false,
    });

    // If sent from a draft, delete that draft
    if (draftId && mongoose.Types.ObjectId.isValid(draftId)) {
      await Email.findOneAndDelete({ _id: draftId, from: userId, isDraft: true });
    }

    const emailData = await Email.findById(newEmail._id)
      .populate("from", "name email")
      .populate("toUser", "name email");

    // Step 5: Real-time Socket.IO notification to recipient if registered
    if (recipientUser) {
      try {
        const unreadCount = await Email.countDocuments({
          $or: [
            { toUser: recipientUser._id },
            { toEmail: recipientUser.email.toLowerCase() },
          ],
          isRead: false,
          isDraft: { $ne: true },
          deletedBy: { $ne: recipientUser._id },
        });

        notifyNewEmail(emailData, recipientUser._id.toString(), unreadCount);
      } catch (socketErr) {
        console.error("Socket notification error:", socketErr);
      }
    }

    return res.status(201).json({
      success: true,
      message: mailResult?.messageId
        ? "Email sent successfully via Nodemailer!"
        : "Email delivered to recipient inbox in SmartMail!",
      email: emailData,
      messageId: mailResult?.messageId || newEmail.messageId,
      smtpNotice: smtpError || null,
    });

  } catch (error) {
    console.error("Send email controller error:", error);

    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred while sending the email",
      error: error.message,
    });
  }
};

// ======================================
// SAVE OR UPDATE DRAFT
// POST /api/email/draft
// ======================================
export const saveDraft = async (req, res) => {
  try {
    const { to, subject, message, draftId } = req.body;
    const userId = req.user.userId;

    const sender = await User.findById(userId);
    if (!sender) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const normalizedTo = typeof to === "string" ? to.trim().toLowerCase() : "";
    const cleanSubject = typeof subject === "string" ? subject.trim() : "";
    const cleanMessage = typeof message === "string" ? message : "";

    // Ignore completely blank draft requests
    if (!normalizedTo && !cleanSubject && !cleanMessage) {
      return res.status(200).json({ success: true, message: "Empty draft ignored" });
    }

    let draft = null;
    if (draftId && mongoose.Types.ObjectId.isValid(draftId)) {
      draft = await Email.findOneAndUpdate(
        { _id: draftId, from: userId, isDraft: true },
        {
          $set: {
            toEmail: normalizedTo,
            subject: cleanSubject || "(no subject)",
            message: cleanMessage,
            updatedAt: new Date(),
          },
        },
        { returnDocument: "after" }
      );
    }

    if (!draft) {
      draft = await Email.create({
        from: sender._id,
        fromEmail: sender.email,
        toEmail: normalizedTo,
        subject: cleanSubject || "(no subject)",
        message: cleanMessage,
        isDraft: true,
      });
    }

    const draftsTotal = await Email.countDocuments({
      from: userId,
      isDraft: true,
      deletedBy: { $ne: userId },
    });

    return res.status(200).json({
      success: true,
      message: "Draft saved",
      draft,
      draftsTotal,
    });
  } catch (error) {
    console.error("Save draft error:", error);
    return res.status(500).json({ success: false, message: "Failed to save draft" });
  }
};

// ======================================
// GET DRAFTS
// GET /api/email/drafts
// ======================================
export const getDraftEmails = async (req, res) => {
  try {
    const userId = req.user.userId;

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {
      from: userId,
      isDraft: true,
      deletedBy: { $ne: userId },
    };

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), "i");
      filter.$or = [
        { subject: searchRegex },
        { message: searchRegex },
        { toEmail: searchRegex },
      ];
    }

    const [emails, totalEmails] = await Promise.all([
      Email.find(filter)
        .populate("from", "name email")
        .select("-deletedBy")
        .sort({ updatedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Email.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Drafts fetched successfully",
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalEmails / limit) || 1,
        totalEmails,
        limit,
      },
      emails,
    });
  } catch (error) {
    console.error("Get drafts error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ======================================
// GET INBOX EMAILS (RECEIVE MAIL)
// GET /api/email/inbox or GET /api/email
// ======================================
export const getInboxEmails = async (req, res) => {
  try {
    const userId = req.user.userId;

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const filter = {
      $or: [
        { toUser: userId },
        { toEmail: user.email.toLowerCase() },
      ],
      isDraft: { $ne: true },
      deletedBy: { $ne: userId },
    };

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), "i");
      filter.$and = [
        {
          $or: [
            { subject: searchRegex },
            { message: searchRegex },
            { fromEmail: searchRegex },
          ],
        },
      ];
    }

    const [emails, totalEmails] = await Promise.all([
      Email.find(filter)
        .populate("from", "name email")
        .populate("toUser", "name email")
        .select("-deletedBy")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Email.countDocuments(filter),
    ]);

    const formattedEmails = emails.map((e) => {
      const obj = e.toObject();
      obj.isStarred = Array.isArray(obj.starredBy) && obj.starredBy.some((uid) => uid.toString() === userId.toString());
      return obj;
    });

    return res.status(200).json({
      success: true,
      message: "Inbox emails fetched successfully",
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalEmails / limit) || 1,
        totalEmails,
        limit,
      },
      emails: formattedEmails,
    });

  } catch (error) {
    console.error("Get inbox emails error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ======================================
// GET SENT EMAILS
// GET /api/email/sent
// ======================================
export const getSentEmails = async (req, res) => {
  try {
    const userId = req.user.userId;

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {
      from: userId,
      isDraft: { $ne: true },
      deletedBy: { $ne: userId },
    };

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), "i");
      filter.$or = [
        { subject: searchRegex },
        { message: searchRegex },
        { toEmail: searchRegex },
      ];
    }

    const [emails, totalEmails] = await Promise.all([
      Email.find(filter)
        .populate("from", "name email")
        .populate("toUser", "name email")
        .select("-deletedBy")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Email.countDocuments(filter),
    ]);

    const formattedEmails = emails.map((e) => {
      const obj = e.toObject();
      obj.isStarred = Array.isArray(obj.starredBy) && obj.starredBy.some((uid) => uid.toString() === userId.toString());
      return obj;
    });

    return res.status(200).json({
      success: true,
      message: "Sent emails fetched successfully",
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalEmails / limit) || 1,
        totalEmails,
        limit,
      },
      emails: formattedEmails,
    });

  } catch (error) {
    console.error("Get sent emails error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ======================================
// GET STARRED EMAILS
// GET /api/email/starred
// ======================================
export const getStarredEmails = async (req, res) => {
  try {
    const userId = req.user.userId;

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {
      starredBy: userId,
      isDraft: { $ne: true },
      deletedBy: { $ne: userId },
    };

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), "i");
      filter.$or = [
        { subject: searchRegex },
        { message: searchRegex },
        { fromEmail: searchRegex },
        { toEmail: searchRegex },
      ];
    }

    const [emails, totalEmails] = await Promise.all([
      Email.find(filter)
        .populate("from", "name email")
        .populate("toUser", "name email")
        .select("-deletedBy")
        .sort({ updatedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Email.countDocuments(filter),
    ]);

    const formattedEmails = emails.map((e) => {
      const obj = e.toObject();
      obj.isStarred = true;
      return obj;
    });

    return res.status(200).json({
      success: true,
      message: "Starred emails fetched successfully",
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalEmails / limit) || 1,
        totalEmails,
        limit,
      },
      emails: formattedEmails,
    });
  } catch (error) {
    console.error("Get starred emails error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ======================================
// GET EMAIL COUNTS / STATS
// GET /api/email/stats
// ======================================
export const getEmailStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const inboxFilter = {
      $or: [
        { toUser: userId },
        { toEmail: user.email.toLowerCase() },
      ],
      isDraft: { $ne: true },
      deletedBy: { $ne: userId },
    };

    const [inboxTotal, unreadCount, sentTotal, starredTotal, draftsTotal] = await Promise.all([
      Email.countDocuments(inboxFilter),
      Email.countDocuments({
        ...inboxFilter,
        isRead: false,
      }),
      Email.countDocuments({
        from: userId,
        isDraft: { $ne: true },
        deletedBy: { $ne: userId },
      }),
      Email.countDocuments({
        starredBy: userId,
        isDraft: { $ne: true },
        deletedBy: { $ne: userId },
      }),
      Email.countDocuments({
        from: userId,
        isDraft: true,
        deletedBy: { $ne: userId },
      }),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        inboxTotal,
        unreadCount,
        sentTotal,
        starredTotal,
        draftsTotal,
      },
    });
  } catch (error) {
    console.error("Get email stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ======================================
// GET EMAIL DETAILS
// GET /api/email/:id
// ======================================
export const getEmailDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email ID",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const email = await Email.findOne({
      _id: id,
      $or: [
        { from: userId },
        { toUser: userId },
        { toEmail: user.email.toLowerCase() },
      ],
      deletedBy: { $ne: userId },
    })
      .populate("from", "name email")
      .populate("toUser", "name email")
      .select("-deletedBy");

    if (!email) {
      return res.status(404).json({
        success: false,
        message: "Email not found",
      });
    }

    // Auto mark as read if recipient
    const isRecipient =
      email.toUser?._id?.toString() === userId ||
      email.toEmail?.toLowerCase() === user.email.toLowerCase();

    if (isRecipient && !email.isRead) {
      email.isRead = true;
      await Email.findByIdAndUpdate(id, { $set: { isRead: true } });
    }

    const emailObj = email.toObject();
    emailObj.isStarred = Array.isArray(email.starredBy) && email.starredBy.some((uid) => uid.toString() === userId.toString());

    return res.status(200).json({
      success: true,
      message: "Email details fetched successfully",
      email: emailObj,
    });

  } catch (error) {
    console.error("Get email details error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ======================================
// MARK EMAIL AS READ / UNREAD
// PATCH /api/email/:id/read
// ======================================
export const markEmailAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { isRead = true } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email ID",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const email = await Email.findOneAndUpdate(
      {
        _id: id,
        $or: [
          { toUser: userId },
          { toEmail: user.email.toLowerCase() },
        ],
        deletedBy: { $ne: userId },
      },
      {
        $set: { isRead: Boolean(isRead) },
      },
      {
        returnDocument: "after",
      }
    )
      .populate("from", "name email")
      .populate("toUser", "name email")
      .select("-deletedBy");

    if (!email) {
      return res.status(404).json({
        success: false,
        message: "Email not found or you are not the recipient",
      });
    }

    try {
      const unreadCount = await Email.countDocuments({
        $or: [
          { toUser: userId },
          { toEmail: user.email.toLowerCase() },
        ],
        isRead: false,
        isDraft: { $ne: true },
        deletedBy: { $ne: userId },
      });
      notifyUnreadCount(userId.toString(), unreadCount);
    } catch (e) {}

    const emailObj = email.toObject();
    emailObj.isStarred = Array.isArray(email.starredBy) && email.starredBy.some((uid) => uid.toString() === userId.toString());

    return res.status(200).json({
      success: true,
      message: `Email marked as ${email.isRead ? "read" : "unread"} successfully`,
      email: emailObj,
    });

  } catch (error) {
    console.error("Mark email as read error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ======================================
// TOGGLE STAR EMAIL
// PATCH /api/email/:id/star
// ======================================
export const toggleStarEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email ID",
      });
    }

    const email = await Email.findOne({
      _id: id,
      deletedBy: { $ne: userId },
    });

    if (!email) {
      return res.status(404).json({
        success: false,
        message: "Email not found",
      });
    }

    const hasStarred =
      Array.isArray(email.starredBy) &&
      email.starredBy.some((uid) => uid.toString() === userId.toString());

    if (hasStarred) {
      email.starredBy.pull(userId);
    } else {
      if (!Array.isArray(email.starredBy)) email.starredBy = [];
      email.starredBy.addToSet(userId);
    }

    await email.save();

    const starredTotal = await Email.countDocuments({
      starredBy: userId,
      isDraft: { $ne: true },
      deletedBy: { $ne: userId },
    });

    return res.status(200).json({
      success: true,
      isStarred: !hasStarred,
      starredTotal,
      message: !hasStarred ? "Email starred" : "Email unstarred",
    });
  } catch (error) {
    console.error("Toggle star email error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ======================================
// DELETE EMAIL (SOFT DELETE FOR USER)
// DELETE /api/email/:id
// ======================================
export const deleteEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email ID",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const email = await Email.findOneAndUpdate(
      {
        _id: id,
        $or: [
          { from: userId },
          { toUser: userId },
          { toEmail: user.email.toLowerCase() },
        ],
        deletedBy: { $ne: userId },
      },
      {
        $addToSet: {
          deletedBy: userId,
        },
      },
      {
        returnDocument: "after",
      }
    );

    if (!email) {
      return res.status(404).json({
        success: false,
        message: "Email not found",
      });
    }

    try {
      const unreadCount = await Email.countDocuments({
        $or: [
          { toUser: userId },
          { toEmail: user.email.toLowerCase() },
        ],
        isRead: false,
        isDraft: { $ne: true },
        deletedBy: { $ne: userId },
      });
      notifyUnreadCount(userId.toString(), unreadCount);
    } catch (e) {}

    return res.status(200).json({
      success: true,
      message: "Email deleted successfully",
    });

  } catch (error) {
    console.error("Delete email error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
