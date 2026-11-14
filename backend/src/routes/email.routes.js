import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";

import {
  sendEmails,
  saveDraft,
  getDraftEmails,
  getInboxEmails,
  getSentEmails,
  getStarredEmails,
  getEmailStats,
  getEmailDetails,
  markEmailAsRead,
  toggleStarEmail,
  deleteEmail,
} from "../controller/email.controller.js";

const router = express.Router();

// All email routes require authentication
router.use(authenticate);

// Send email
router.post("/", sendEmails);

// Save / update draft
router.post("/draft", saveDraft);

// Get drafts (MUST be before /:id)
router.get("/drafts", getDraftEmails);

// Get inbox emails (both / and /inbox supported)
router.get("/", getInboxEmails);
router.get("/inbox", getInboxEmails);

// Get sent emails
router.get("/sent", getSentEmails);

// Get starred emails (MUST be before /:id)
router.get("/starred", getStarredEmails);

// Get counts/stats for badges
router.get("/stats", getEmailStats);

// Get email details
router.get("/:id", getEmailDetails);

// Mark email as read / unread
router.patch("/:id/read", markEmailAsRead);

// Toggle star on email
router.patch("/:id/star", toggleStarEmail);

// Delete email
router.delete("/:id", deleteEmail);

export default router;
