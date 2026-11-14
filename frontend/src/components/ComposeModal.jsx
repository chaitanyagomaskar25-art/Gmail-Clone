import React, { useState, useEffect } from "react";
import {
  X,
  Send,
  Trash2,
  Paperclip,
  Link,
  Smile,
  Image,
  Lock,
  Minus,
  Maximize2,
  Minimize2,
  AlertCircle,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  Check,
} from "lucide-react";
import { authApi, emailApi } from "../api/client.js";

export const ComposeModal = ({
  isOpen,
  onClose,
  onEmailSent,
  onDraftSaved,
  initialData,
}) => {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [draftId, setDraftId] = useState(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // Window state: normal, minimized, or maximized
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Suggestions from user directory
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTo(initialData.to || "");
      setSubject(initialData.subject || "");
      setMessage(initialData.message || "");
      setDraftId(initialData.draftId || null);
    } else {
      setTo("");
      setSubject("");
      setMessage("");
      setDraftId(null);
    }
    setError(null);
    setIsMinimized(false);
    setDraftSaved(false);
  }, [initialData, isOpen]);

  // Load user directory for autocompletion
  useEffect(() => {
    if (isOpen) {
      authApi
        .getUsers()
        .then(({ data }) => {
          if (data.success) {
            setSuggestions(data.users || []);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Auto-save draft when content changes
  useEffect(() => {
    if (!isOpen) return;
    if (!to.trim() && !subject.trim() && !message.trim()) return;

    const timer = setTimeout(async () => {
      try {
        const { data } = await emailApi.saveDraft({
          to: to.trim(),
          subject: subject.trim(),
          message: message.trim(),
          draftId,
        });

        if (data.success && data.draft?._id) {
          setDraftId(data.draft._id);
          setDraftSaved(true);
          if (onDraftSaved) onDraftSaved();
          setTimeout(() => setDraftSaved(false), 2000);
        }
      } catch (e) {
        console.warn("Auto-save draft warning:", e);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [to, subject, message, isOpen, draftId]);

  if (!isOpen) return null;

  const filteredUsers = suggestions.filter((u) => {
    const q = to.trim().toLowerCase();
    if (!q) return true;
    return (
      u.email.toLowerCase().includes(q) ||
      (u.name && u.name.toLowerCase().includes(q))
    );
  });

  const handleDiscard = async () => {
    if (draftId) {
      try {
        await emailApi.deleteEmail(draftId);
      } catch (e) {}
    }
    if (onDraftSaved) onDraftSaved();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!to.trim()) {
      setError("Please specify at least one recipient.");
      return;
    }
    if (!subject.trim()) {
      setError("Please specify a subject.");
      return;
    }
    if (!message.trim()) {
      setError("Please enter email message content.");
      return;
    }

    try {
      setSending(true);
      const { data } = await emailApi.sendEmail({
        to: to.trim(),
        subject: subject.trim(),
        message: message.trim(),
        draftId,
      });

      if (data.success) {
        onEmailSent(data.message || "Message sent successfully");
        onClose();
      } else {
        setError(data.message || "Failed to send email.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to dispatch email via Nodemailer SMTP. Please verify credentials."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className={`fixed z-50 flex flex-col bg-white dark:bg-[#202124] shadow-2xl border border-[#dadce0] dark:border-[#3c4043] rounded-t-2xl sm:rounded-t-xl transition-all duration-200 select-none ${
        isMaximized
          ? "inset-0 sm:inset-8 md:inset-12 w-full sm:w-auto h-full sm:h-auto rounded-none sm:rounded-xl"
          : isMinimized
          ? "bottom-0 right-3 sm:right-6 w-60 sm:w-72 h-11"
          : "bottom-0 inset-x-0 sm:inset-x-auto sm:right-8 w-full sm:w-[580px] sm:max-w-[calc(100vw-3rem)] h-[90vh] sm:h-[540px] max-h-[95vh]"
      }`}
    >
      {/* Gmail Compose Title Header */}
      <div
        className="h-10 px-4 bg-[#f2f6fc] dark:bg-[#2d2f31] flex items-center justify-between rounded-t-xl border-b border-[#e0e2e7] dark:border-[#3c4043] cursor-pointer"
        onClick={() => {
          if (isMinimized) setIsMinimized(false);
        }}
      >
        <div className="flex items-center gap-2 truncate pr-2">
          <span className="text-[14px] font-medium text-[#1f1f1f] dark:text-[#e3e3e3] font-sans truncate">
            {subject ? subject : "New Message"}
          </span>
          {draftSaved && (
            <span className="text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-500" />
              Saved
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          {/* Minimize Button */}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? "Restore" : "Minimize"}
            className="p-1.5 rounded text-[#444746] dark:text-[#c4c7c5] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* Full Screen Maximize Button */}
          {!isMinimized && (
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              title={isMaximized ? "Exit full screen" : "Full screen"}
              className="p-1.5 rounded text-[#444746] dark:text-[#c4c7c5] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors"
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Close Button (saves draft automatically) */}
          <button
            onClick={onClose}
            title="Save & close"
            className="p-1.5 rounded text-[#444746] dark:text-[#c4c7c5] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* When minimized, hide body */}
      {!isMinimized && (
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          {/* Error Message Alert */}
          {error && (
            <div className="px-4 py-2 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 border-b border-red-200 dark:border-red-900">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Recipient Input (To) */}
          <div className="relative border-b border-[#f0f2f5] dark:border-[#3c4043] px-4 py-2 flex items-center text-sm">
            <span className="text-[#5f6368] dark:text-[#9aa0a6] text-xs font-medium w-12 flex-shrink-0">
              To
            </span>
            <input
              type="email"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Recipient email address"
              className="flex-1 bg-transparent border-none outline-none text-[#1f1f1f] dark:text-[#e3e3e3] text-sm placeholder-[#80868b] dark:placeholder-[#8e918f]"
            />

            {/* Suggestions dropdown */}
            {showSuggestions && filteredUsers.length > 0 && (
              <div className="absolute top-full left-12 right-4 bg-white dark:bg-[#282a2d] shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 py-1.5 z-50 max-h-48 overflow-y-auto">
                <div className="px-3 py-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Suggested Contacts
                </div>
                {filteredUsers.map((u) => (
                  <button
                    key={u._id}
                    type="button"
                    onClick={() => {
                      setTo(u.email);
                      setShowSuggestions(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-gray-800 dark:text-gray-200">
                        {u.name}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 font-mono text-[11px]">
                        {u.email}
                      </div>
                    </div>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Select</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Subject Input */}
          <div className="border-b border-[#f0f2f5] dark:border-[#3c4043] px-4 py-2 flex items-center text-sm">
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="w-full bg-transparent border-none outline-none text-[#1f1f1f] dark:text-[#e3e3e3] text-sm placeholder-[#80868b] dark:placeholder-[#8e918f]"
            />
          </div>

          {/* Message Body */}
          <div className="flex-1 p-4 overflow-y-auto">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your email here..."
              className="w-full h-full bg-transparent border-none outline-none resize-none text-[#1f1f1f] dark:text-[#e3e3e3] text-sm leading-relaxed placeholder-[#80868b] dark:placeholder-[#8e918f]"
            />
          </div>

          {/* Bottom Gmail Action Toolbar */}
          <div className="h-14 px-4 border-t border-[#f0f2f5] dark:border-[#3c4043] flex items-center justify-between bg-white dark:bg-[#202124]">
            {/* Left: Send Button & Format Icons */}
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={sending}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] text-white font-medium text-xs shadow-md hover:shadow-lg disabled:opacity-50 transition-all font-sans"
              >
                {sending ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <div className="hidden sm:flex items-center gap-1 text-[#444746] dark:text-[#c4c7c5] pl-2 border-l border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  title="Formatting"
                  className="p-1.5 rounded hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Italic"
                  className="p-1.5 rounded hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Attach files"
                  className="p-1.5 rounded hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Insert emoji"
                  className="p-1.5 rounded hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
                >
                  <Smile className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right: Discard Draft Trash */}
            <button
              type="button"
              onClick={handleDiscard}
              title="Discard draft"
              className="p-2 text-[#444746] dark:text-[#c4c7c5] hover:text-[#b3261e] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] rounded-full transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
