import React, { useState } from "react";
import {
  ArrowLeft,
  Trash2,
  CheckCircle2,
  Circle,
  Mail,
  Volume2,
  Pause,
  Play,
  Square,
  Reply,
  Star,
  Printer,
  MoreVertical,
  CornerUpLeft,
  Send,
  Sparkles,
  Paperclip,
  Check,
  Forward,
} from "lucide-react";
import { useVoice } from "../context/VoiceContext.jsx";

export const EmailDetail = ({
  email,
  onClose,
  onReply,
  onDelete,
  onToggleRead,
  activeTab,
  isStarred,
  onToggleStar,
  onSendReply,
}) => {
  const {
    isSpeaking,
    isPaused,
    readingEmail,
    readCompleteEmail,
    pause,
    resume,
    stop,
    speechRate,
    updateSpeechRate,
  } = useVoice();

  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

  if (!email) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-16 text-[#5f6368] dark:text-[#9aa0a6] text-center gap-3 bg-white dark:bg-[#1e1f20]">
        <div className="w-20 h-20 rounded-full bg-[#f6f8fc] dark:bg-[#282a2d] flex items-center justify-center text-[#5f6368] dark:text-[#8e918f]">
          <Mail className="w-10 h-10" />
        </div>
        <div>
          <h3 className="text-base font-medium text-[#1f1f1f] dark:text-[#e3e3e3]">
            Select an email to view
          </h3>
          <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] max-w-sm mt-1">
            Choose any conversation to read its full message, listen aloud, or send a reply.
          </p>
        </div>
      </div>
    );
  }

  const formatFullDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (nameOrEmail) => {
    if (!nameOrEmail) return "?";
    return nameOrEmail
      .split(/[\s@._]+/)
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 1);
  };

  // Avatar background colors based on name string
  const getAvatarColor = (str = "") => {
    const colors = [
      "from-blue-600 to-indigo-600",
      "from-emerald-600 to-teal-600",
      "from-purple-600 to-violet-600",
      "from-rose-600 to-pink-600",
      "from-amber-600 to-orange-600",
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const fromDisplay = email.from?.name || email.fromEmail;
  const toDisplay = email.toUser?.name || email.toEmail;
  const isCurrentReading = readingEmail?._id === email._id;

  const handleReadClick = () => {
    if (isCurrentReading) {
      if (isPaused) {
        resume();
      } else if (isSpeaking) {
        pause();
      } else {
        readCompleteEmail(email);
      }
    } else {
      readCompleteEmail(email);
    }
  };

  const handleInlineReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    if (onSendReply) {
      setIsSendingReply(true);
      try {
        await onSendReply({
          to: activeTab === "inbox" ? (email.fromEmail || email.from?.email) : email.toEmail,
          subject: email.subject.startsWith("Re:") ? email.subject : `Re: ${email.subject}`,
          message: replyText.trim(),
        });
        setReplyText("");
        setShowReplyBox(false);
      } finally {
        setIsSendingReply(false);
      }
    } else {
      onReply(email);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#1e1f20] overflow-hidden select-none">
      {/* Top Action Toolbar (Gmail Style) */}
      <div className="h-12 px-3 sm:px-4 border-b border-[#e7e9ed] dark:border-[#30343f] flex items-center justify-between text-[#444746] dark:text-[#c4c7c5] flex-shrink-0">
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Back to list arrow */}
          <button
            onClick={onClose}
            title="Back to inbox"
            className="p-2 rounded-full hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="h-4 w-[1px] bg-gray-300 dark:bg-gray-700 mx-1.5" />

          {/* Delete */}
          <button
            onClick={() => onDelete(email._id)}
            title="Delete message"
            className="p-2 rounded-full hover:bg-black/[0.06] dark:hover:bg-white/[0.08] hover:text-[#b3261e] transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>



          {/* Star button */}
          <button
            onClick={(e) => onToggleStar && onToggleStar(e, email._id)}
            title={isStarred ? "Starred" : "Star message"}
            className={`p-2 rounded-full hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors ${
              isStarred ? "text-[#f4b400]" : "text-[#444746] dark:text-[#c4c7c5]"
            }`}
          >
            <Star className={`w-5 h-5 ${isStarred ? "fill-[#f4b400]" : ""}`} />
          </button>

          {/* Voice Assistant Read Aloud Button */}
          <button
            onClick={handleReadClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ml-2 transition-all ${
              isCurrentReading
                ? "bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] shadow-sm"
                : "hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-[#444746] dark:text-[#c4c7c5]"
            }`}
            title="Read email aloud with Voice Assistant"
          >
            {isCurrentReading && isSpeaking && !isPaused ? (
              <>
                <Pause className="w-4 h-4 text-[#0b57d0] dark:text-[#a8c7fa]" />
                <span>Pause</span>
              </>
            ) : isCurrentReading && isPaused ? (
              <>
                <Play className="w-4 h-4 fill-current text-[#0b57d0] dark:text-[#a8c7fa]" />
                <span>Resume</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-[#0b57d0] dark:text-[#a8c7fa]" />
                <span>Read Aloud</span>
              </>
            )}
          </button>

          {/* Stop voice button when active */}
          {isCurrentReading && (
            <button
              onClick={stop}
              title="Stop reading"
              className="p-1.5 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => window.print()}
            title="Print email"
            className="p-2 rounded-full hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors"
          >
            <Printer className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Voice Assistant Speaking Banner (Animated soundwave) */}
      {isCurrentReading && (
        <div className="px-6 py-2.5 bg-blue-50/80 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/50 flex items-center justify-between text-xs animate-slide-up">
          <div className="flex items-center gap-3">
            {/* Live animated equalizer bars */}
            <div className="flex items-end gap-1 h-5 w-6">
              <span className={`w-1 bg-blue-600 dark:bg-blue-400 rounded-full ${!isPaused ? "animate-sound-wave-1" : "h-2"}`} />
              <span className={`w-1 bg-blue-600 dark:bg-blue-400 rounded-full ${!isPaused ? "animate-sound-wave-2" : "h-3"}`} />
              <span className={`w-1 bg-blue-600 dark:bg-blue-400 rounded-full ${!isPaused ? "animate-sound-wave-3" : "h-1.5"}`} />
              <span className={`w-1 bg-blue-600 dark:bg-blue-400 rounded-full ${!isPaused ? "animate-sound-wave-4" : "h-2.5"}`} />
            </div>
            <span className="font-semibold text-blue-900 dark:text-blue-200">
              {isPaused ? "Voice Assistant Paused" : "Voice Assistant Reading Aloud..."}
            </span>
          </div>

          {/* Voice rate controls */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Speed:</span>
            {[1.0, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                onClick={() => updateSpeechRate(rate)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  speechRate === rate
                    ? "bg-blue-600 text-white"
                    : "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 hover:bg-blue-200"
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Email Content Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-10 py-4 sm:py-6 select-text">
        {/* Subject Header */}
        <div className="flex items-start justify-between gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <h1 className="text-lg sm:text-2xl font-normal text-[#1f1f1f] dark:text-[#e3e3e3] font-sans break-words">
              {email.subject || "(no subject)"}
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              {activeTab === "inbox" ? "Inbox" : "Sent"}
            </span>
          </div>
        </div>

        {/* Sender Details Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 pb-4 sm:pb-6 mb-6 border-b border-[#f0f2f5] dark:border-[#2b2d30]">
          <div className="flex items-start gap-3 min-w-0">
            {/* Avatar with colorful gradient */}
            <div
              className={`w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-gradient-to-tr ${getAvatarColor(
                fromDisplay
              )} text-white font-medium text-sm sm:text-base flex items-center justify-center flex-shrink-0 shadow-sm`}
            >
              {getInitials(fromDisplay)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-[14px] font-bold text-[#1f1f1f] dark:text-white">
                  {fromDisplay}
                </span>
                <span className="text-[11px] sm:text-xs text-[#5f6368] dark:text-[#9aa0a6] truncate font-mono">
                  &lt;{email.fromEmail || email.from?.email}&gt;
                </span>
              </div>
              <div className="text-[11px] sm:text-xs text-[#5f6368] dark:text-[#9aa0a6] mt-0.5 flex items-center gap-1">
                <span>to</span>
                <span className="font-medium text-[#444746] dark:text-[#c4c7c5] truncate">
                  {toDisplay} &lt;{email.toEmail}&gt;
                </span>
              </div>
            </div>
          </div>

          {/* Date & Quick Reply Icon */}
          <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 pl-12 sm:pl-0">
            <span className="text-[11px] sm:text-xs text-[#5f6368] dark:text-[#9aa0a6]">
              {formatFullDate(email.createdAt)}
            </span>
            <button
              onClick={() => onReply(email)}
              title="Reply to message"
              className="p-1.5 rounded-full hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-[#444746] dark:text-[#c4c7c5] transition-colors"
            >
              <CornerUpLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Email Body */}
        <div className="text-[14.5px] leading-relaxed text-[#1f1f1f] dark:text-[#e3e3e3] whitespace-pre-wrap font-sans min-h-[160px]">
          {email.message}
        </div>

        {/* Bottom Reply / Forward Section */}
        <div className="mt-12 pt-6 border-t border-[#f0f2f5] dark:border-[#2b2d30]">
          {!showReplyBox ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowReplyBox(true)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-[#747775] dark:border-[#8e918f] text-[#444746] dark:text-[#c4c7c5] hover:bg-[#eaebef]/50 dark:hover:bg-[#282a2d] text-xs font-semibold transition-colors"
              >
                <CornerUpLeft className="w-4 h-4" />
                <span>Reply</span>
              </button>

              <button
                onClick={() => onReply(email)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-[#747775] dark:border-[#8e918f] text-[#444746] dark:text-[#c4c7c5] hover:bg-[#eaebef]/50 dark:hover:bg-[#282a2d] text-xs font-semibold transition-colors"
              >
                <Forward className="w-4 h-4" />
                <span>Forward</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleInlineReplySubmit} className="border border-gray-200 dark:border-gray-700 rounded-2xl p-4 bg-gray-50/50 dark:bg-gray-900/50 shadow-sm animate-slide-up">
              <div className="flex items-center gap-2 mb-3 text-xs text-gray-500 dark:text-gray-400">
                <CornerUpLeft className="w-4 h-4 text-gray-400" />
                <span>Replying to <strong className="text-gray-800 dark:text-gray-200">{fromDisplay}</strong></span>
              </div>
              <textarea
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your reply here..."
                autoFocus
                className="w-full bg-white dark:bg-[#1e1f20] border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm text-[#1f1f1f] dark:text-[#e3e3e3] outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              <div className="flex items-center justify-between mt-3">
                <button
                  type="submit"
                  disabled={isSendingReply || !replyText.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingReply ? "Sending..." : "Send"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowReplyBox(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
