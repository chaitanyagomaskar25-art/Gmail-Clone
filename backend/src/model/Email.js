import mongoose from "mongoose";

const emailSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    fromEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    toEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },

    // Optional link if recipient is a registered app user
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    subject: {
      type: String,
      trim: true,
      default: "(no subject)",
    },

    message: {
      type: String,
      default: "",
    },

    messageId: {
      type: String,
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    isDraft: {
      type: Boolean,
      default: false,
    },

    starredBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    deletedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

export const Email = mongoose.model("Email", emailSchema);
