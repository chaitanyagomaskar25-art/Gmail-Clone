import React, { useState, useMemo } from "react";
import {
  Mail,
  Trash2,
  CheckCircle2,
  Circle,
  Star,
  Square,
  CheckSquare,
  Volume2,
  Inbox,
  Users,
  Tag,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  RefreshCw,
  Columns,
  Maximize2,
  Check,
  Bell,
  Archive,
  FileText,
  Send,
  ArrowLeft,
} from "lucide-react";
import { useVoice } from "../context/VoiceContext.jsx";

export const EmailList = ({
  emails,
  selectedEmail,
  onSelectEmail,
  onToggleRead,
  onDeleteEmail,
  activeTab,
  loading,
  onRefresh,
  starredIds,
  onToggleStar,
  isSplitView,
  onToggleSplitView,
}) => {
  const { readCompleteEmail } = useVoice();
  const [categoryTab, setCategoryTab] = useState("primary"); // 'primary' | 'promotions' | 'social' | 'updates'
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [showSelectMenu, setShowSelectMenu] = useState(false);

  // Checkbox selection helpers
  const handleSelectAll = () => {
    if (selectedIds.size === emails.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(emails.map((e) => e._id)));
    }
    setShowSelectMenu(false);
  };

  const handleSelectRead = () => {
    setSelectedIds(new Set(emails.filter((e) => e.isRead).map((e) => e._id)));
    setShowSelectMenu(false);
  };

  const handleSelectUnread = () => {
    setSelectedIds(new Set(emails.filter((e) => !e.isRead).map((e) => e._id)));
    setShowSelectMenu(false);
  };

  const handleSelectStarred = () => {
    setSelectedIds(new Set(emails.filter((e) => starredIds.has(e._id)).map((e) => e._id)));
    setShowSelectMenu(false);
  };

  const toggleSelectRow = (e, emailId) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(emailId)) next.delete(emailId);
      else next.add(emailId);
      return next;
    });
  };

  // Batch actions
  const handleBatchMarkRead = (markRead) => {
    selectedIds.forEach((id) => onToggleRead(id, markRead));
    setSelectedIds(new Set());
  };

  const handleBatchDelete = () => {
    selectedIds.forEach((id) => onDeleteEmail(id));
    setSelectedIds(new Set());
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
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

  // Calculate counts for categories in inbox
  const categoryCounts = useMemo(() => {
    if (activeTab !== "inbox") return { primary: 0, promotions: 0, social: 0, updates: 0 };
    let primary = 0;
    let promotions = 0;
    let social = 0;
    let updates = 0;
    emails.forEach((email) => {
      const text = `${email.subject || ""} ${email.message || ""}`.toLowerCase();
      const isPromo = /promo|discount|deal|sale|offer|coupon|newsletter|marketing|shop/i.test(text);
      const isSocial = /social|facebook|twitter|instagram|linkedin|community|invite|friend/i.test(text);
      const isUpdates = /update|alert|notification|security|verify|code|confirm|receipt|invoice|bill/i.test(text);
      if (isPromo) promotions++;
      else if (isSocial) social++;
      else if (isUpdates) updates++;
      else primary++;
    });
    return { primary, promotions, social, updates };
  }, [emails, activeTab]);

  // Filter emails based on category or starred tab
  const filteredEmails = emails.filter((email) => {
    if (activeTab === "starred") {
      return (starredIds && starredIds.has(email._id)) || Boolean(email.isStarred);
    }
    if (activeTab === "inbox") {
      const text = `${email.subject || ""} ${email.message || ""}`.toLowerCase();
      const isPromo = /promo|discount|deal|sale|offer|coupon|newsletter|marketing|shop/i.test(text);
      const isSocial = /social|facebook|twitter|instagram|linkedin|community|invite|friend/i.test(text);
      const isUpdates = /update|alert|notification|security|verify|code|confirm|receipt|invoice|bill/i.test(text);

      if (categoryTab === "promotions") return isPromo;
      if (categoryTab === "social") return isSocial;
      if (categoryTab === "updates") return isUpdates;

      // primary: show emails that are NOT promo, social, or updates
      return !isPromo && !isSocial && !isUpdates;
    }
    return true;
  });

  if (loading && (!emails || emails.length === 0)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-16 text-[#5f6368] dark:text-[#9aa0a6] gap-3">
        <div className="w-8 h-8 border-3 border-[#c2e7ff] border-t-[#0b57d0] rounded-full animate-spin" />
        <p className="text-sm font-medium font-sans">Loading conversations...</p>
      </div>
    );
  }

  const isAllSelected = filteredEmails.length > 0 && selectedIds.size === filteredEmails.length;
  const isPartiallySelected = selectedIds.size > 0 && selectedIds.size < filteredEmails.length;

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#1e1f20] overflow-hidden select-none">
      {/* Gmail Top Action Toolbar */}
      <div className="h-12 px-3 sm:px-4 border-b border-[#e7e9ed] dark:border-[#30343f] flex items-center justify-between text-[#444746] dark:text-[#c4c7c5] flex-shrink-0">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Select all checkbox & menu */}
          <div className="relative flex items-center">
            <button
              onClick={handleSelectAll}
              title="Select all"
              className="p-1.5 rounded hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors"
            >
              {isAllSelected ? (
                <CheckSquare className="w-4 h-4 text-[#0b57d0] dark:text-[#a8c7fa]" />
              ) : isPartiallySelected ? (
                <div className="w-4 h-4 rounded border-2 border-[#0b57d0] bg-[#0b57d0] flex items-center justify-center">
                  <div className="w-2 h-0.5 bg-white" />
                </div>
              ) : (
                <Square className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              )}
            </button>
          </div>

          {selectedIds.size > 0 ? (
            /* Selected Batch Operations */
            <div className="flex items-center gap-1 pl-2 border-l border-gray-200 dark:border-gray-700 animate-fade-in">
              <span className="text-xs font-semibold mr-1 text-[#1f1f1f] dark:text-white">
                {selectedIds.size} selected
              </span>
              <button
                onClick={() => handleBatchMarkRead(true)}
                title="Mark as read"
                className="p-1.5 rounded hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
              >
                <CheckCircle2 className="w-4 h-4 text-[#0b57d0]" />
              </button>
              <button
                onClick={handleBatchDelete}
                title="Delete selected"
                className="p-1.5 rounded hover:bg-black/[0.06] dark:hover:bg-white/[0.08] hover:text-[#b3261e]"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Standard Operations */
            <>
              <button
                onClick={onRefresh}
                title="Refresh"
                className="p-1.5 rounded hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#0b57d0]" : ""}`} />
              </button>
              <button
                title="More options"
                className="p-1.5 rounded hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Right toolbar: Pagination & Split view mode toggle */}
        <div className="flex items-center gap-3 text-xs text-[#5f6368] dark:text-[#9aa0a6]">
          <span>
            {filteredEmails.length === 0 ? "0 of 0" : `1–${filteredEmails.length} of ${filteredEmails.length}`}
          </span>
          <div className="flex items-center">
            <button
              disabled
              title="Newer"
              className="p-1.5 rounded text-gray-300 dark:text-gray-600 cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled
              title="Older"
              className="p-1.5 rounded text-gray-300 dark:text-gray-600 cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Toggle Split Pane Mode */}
          {onToggleSplitView && (
            <button
              onClick={onToggleSplitView}
              title={isSplitView ? "Switch to Full Screen View" : "Switch to Split Pane View"}
              className={`p-1.5 rounded hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors ${
                isSplitView ? "text-[#0b57d0] dark:text-[#a8c7fa]" : "text-[#5f6368] dark:text-[#9aa0a6]"
              }`}
            >
              <Columns className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Gmail Category Tabs (Primary, Promotions, Social, Updates) */}
      {activeTab === "inbox" && (
        <div className="flex border-b border-[#e7e9ed] dark:border-[#30343f] bg-white dark:bg-[#1e1f20] text-xs font-medium overflow-x-auto no-scrollbar scroll-smooth">
          <button
            onClick={() => setCategoryTab("primary")}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 border-b-[3px] transition-colors cursor-pointer flex-shrink-0 whitespace-nowrap ${
              categoryTab === "primary"
                ? "border-[#0b57d0] text-[#0b57d0] dark:text-[#a8c7fa] font-bold bg-blue-50/20 dark:bg-blue-950/20"
                : "border-transparent text-[#444746] dark:text-[#c4c7c5] hover:bg-[#f6f8fc] dark:hover:bg-[#282a2d]"
            }`}
          >
            <Inbox className="w-4 h-4 flex-shrink-0" />
            <span>Primary</span>
            {categoryCounts.primary > 0 && (
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${
                  categoryTab === "primary"
                    ? "bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff]"
                    : "text-[#5f6368] dark:text-[#9aa0a6] bg-black/[0.05] dark:bg-white/[0.06]"
                }`}
              >
                {categoryCounts.primary}
              </span>
            )}
          </button>

          <button
            onClick={() => setCategoryTab("promotions")}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 border-b-[3px] transition-colors cursor-pointer flex-shrink-0 whitespace-nowrap ${
              categoryTab === "promotions"
                ? "border-[#0b57d0] text-[#0b57d0] dark:text-[#a8c7fa] font-bold bg-blue-50/20 dark:bg-blue-950/20"
                : "border-transparent text-[#444746] dark:text-[#c4c7c5] hover:bg-[#f6f8fc] dark:hover:bg-[#282a2d]"
            }`}
          >
            <Tag className="w-4 h-4 flex-shrink-0" />
            <span>Promotions</span>
            {categoryCounts.promotions > 0 && (
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${
                  categoryTab === "promotions"
                    ? "bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff]"
                    : "text-[#5f6368] dark:text-[#9aa0a6] bg-black/[0.05] dark:bg-white/[0.06]"
                }`}
              >
                {categoryCounts.promotions}
              </span>
            )}
          </button>

          <button
            onClick={() => setCategoryTab("social")}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 border-b-[3px] transition-colors cursor-pointer flex-shrink-0 whitespace-nowrap ${
              categoryTab === "social"
                ? "border-[#0b57d0] text-[#0b57d0] dark:text-[#a8c7fa] font-bold bg-blue-50/20 dark:bg-blue-950/20"
                : "border-transparent text-[#444746] dark:text-[#c4c7c5] hover:bg-[#f6f8fc] dark:hover:bg-[#282a2d]"
            }`}
          >
            <Users className="w-4 h-4 flex-shrink-0" />
            <span>Social</span>
            {categoryCounts.social > 0 && (
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${
                  categoryTab === "social"
                    ? "bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff]"
                    : "text-[#5f6368] dark:text-[#9aa0a6] bg-black/[0.05] dark:bg-white/[0.06]"
                }`}
              >
                {categoryCounts.social}
              </span>
            )}
          </button>

          <button
            onClick={() => setCategoryTab("updates")}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 border-b-[3px] transition-colors cursor-pointer flex-shrink-0 whitespace-nowrap ${
              categoryTab === "updates"
                ? "border-[#0b57d0] text-[#0b57d0] dark:text-[#a8c7fa] font-bold bg-blue-50/20 dark:bg-blue-950/20"
                : "border-transparent text-[#444746] dark:text-[#c4c7c5] hover:bg-[#f6f8fc] dark:hover:bg-[#282a2d]"
            }`}
          >
            <Bell className="w-4 h-4 flex-shrink-0" />
            <span>Updates</span>
            {categoryCounts.updates > 0 && (
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${
                  categoryTab === "updates"
                    ? "bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff]"
                    : "text-[#5f6368] dark:text-[#9aa0a6] bg-black/[0.05] dark:bg-white/[0.06]"
                }`}
              >
                {categoryCounts.updates}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Email Rows List (Pure Gmail Table Design) */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#f2f2f2] dark:divide-[#2b2d30] flex flex-col">
        {filteredEmails.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-[#5f6368] dark:text-[#9aa0a6] text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#f6f8fc] dark:bg-[#282a2d] flex items-center justify-center text-[#5f6368] dark:text-[#8e918f] shadow-inner">
              {activeTab === "starred" ? (
                <Star className="w-8 h-8 text-[#f4b400]" />
              ) : activeTab === "drafts" ? (
                <FileText className="w-8 h-8 text-[#0b57d0] dark:text-[#a8c7fa]" />
              ) : activeTab === "sent" ? (
                <Send className="w-8 h-8 text-[#0b57d0] dark:text-[#a8c7fa]" />
              ) : categoryTab === "promotions" ? (
                <Tag className="w-8 h-8 text-[#0b57d0] dark:text-[#a8c7fa]" />
              ) : categoryTab === "social" ? (
                <Users className="w-8 h-8 text-[#0b57d0] dark:text-[#a8c7fa]" />
              ) : categoryTab === "updates" ? (
                <Bell className="w-8 h-8 text-[#0b57d0] dark:text-[#a8c7fa]" />
              ) : (
                <Inbox className="w-8 h-8 text-[#0b57d0] dark:text-[#a8c7fa]" />
              )}
            </div>
            <div className="max-w-md">
              <h3 className="text-base font-semibold text-[#1f1f1f] dark:text-[#e3e3e3]">
                {activeTab === "starred"
                  ? "No starred messages"
                  : activeTab === "drafts"
                  ? "No saved drafts"
                  : activeTab === "sent"
                  ? "No sent messages"
                  : categoryTab === "promotions"
                  ? "Your Promotions tab is empty"
                  : categoryTab === "social"
                  ? "Your Social tab is empty"
                  : categoryTab === "updates"
                  ? "Your Updates tab is empty"
                  : "Your Primary tab is clear"}
              </h3>
              <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mt-1.5 leading-relaxed">
                {activeTab === "starred"
                  ? "Star important messages to easily find them here later."
                  : activeTab === "drafts"
                  ? "Messages saved as drafts will appear here. Click any draft to resume editing."
                  : activeTab === "sent"
                  ? "Messages you send will be stored here."
                  : categoryTab === "promotions"
                  ? "Promotional messages, deals, discounts, and offers will appear here."
                  : categoryTab === "social"
                  ? "Messages from social networks, communities, and team invites will appear here."
                  : categoryTab === "updates"
                  ? "Confirmations, bills, receipts, and system alerts will appear here."
                  : "Personal conversations and messages that do not appear in other tabs will be shown here."}
              </p>
              {activeTab === "inbox" && categoryTab !== "primary" && (
                <button
                  onClick={() => setCategoryTab("primary")}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-[#0b57d0] dark:text-[#a8c7fa] bg-[#f0f4f9] dark:bg-[#004a77]/30 hover:bg-[#e0e7f1] dark:hover:bg-[#004a77]/50 rounded-full transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Primary</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          filteredEmails.map((email) => {
          const isSelected = selectedEmail?._id === email._id;
          const isChecked = selectedIds.has(email._id);
          const isUnread = !email.isRead && activeTab === "inbox";
          const isStarred =
            (starredIds && starredIds.has(email._id)) || Boolean(email.isStarred);

          const contactName =
            activeTab === "sent"
              ? email.toUser?.name || email.toEmail
              : email.from?.name || email.fromEmail;

          return (
            <div
              key={email._id}
              onClick={() => onSelectEmail(email)}
              className={`group relative cursor-pointer transition-colors duration-100 ${
                isChecked
                  ? "bg-[#c2e7ff] dark:bg-[#004a77]/60"
                  : isSelected
                  ? "bg-[#d3e3fd]/70 dark:bg-[#004a77]/40"
                  : isUnread
                  ? "bg-white dark:bg-[#1e1f20] hover:bg-[#f6f8fc] dark:hover:bg-[#282a2d] text-[#1f1f1f] dark:text-[#e3e3e3]"
                  : "bg-[#f2f6fc]/50 dark:bg-[#16181d]/60 hover:bg-[#f6f8fc] dark:hover:bg-[#282a2d] text-[#444746] dark:text-[#c4c7c5]"
              }`}
            >
              {/* Desktop Row (md:flex, hidden on mobile) */}
              <div className="hidden md:flex items-center h-11 px-3 sm:px-4">
                {/* Row Left Controls: Checkbox & Star */}
                <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0 mr-3">
                  <button
                    onClick={(e) => toggleSelectRow(e, email._id)}
                    title={isChecked ? "Deselect" : "Select"}
                    className="p-1 rounded text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400 transition-colors cursor-pointer"
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-[#0b57d0] dark:text-[#a8c7fa]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={(e) => onToggleStar(e, email._id)}
                    title={isStarred ? "Starred" : "Not starred"}
                    className={`p-1 rounded transition-colors cursor-pointer ${
                      isStarred
                        ? "text-[#f4b400] fill-[#f4b400]"
                        : "text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400"
                    }`}
                  >
                    <Star className={`w-4 h-4 ${isStarred ? "fill-[#f4b400]" : ""}`} />
                  </button>
                </div>

                {/* Sender Name */}
                <div className="w-36 sm:w-48 flex-shrink-0 truncate pr-2">
                  <span
                    className={`text-[13.5px] sm:text-[14px] truncate block ${
                      isUnread
                        ? "font-bold text-[#1f1f1f] dark:text-white"
                        : "font-normal text-[#1f1f1f] dark:text-[#c4c7c5]"
                    }`}
                  >
                    {activeTab === "drafts" ? (
                      <span className="text-[#d93025] dark:text-[#f28b82] font-medium">Draft</span>
                    ) : activeTab === "sent" ? (
                      `To: ${contactName}`
                    ) : (
                      contactName
                    )}
                  </span>
                </div>

                {/* Subject & Message Snippet */}
                <div className="flex-1 min-w-0 flex items-baseline gap-1 text-[13.5px] sm:text-[14px] truncate pr-4">
                  {activeTab === "drafts" && email.toEmail && (
                    <span className="text-[#5f6368] dark:text-[#9aa0a6] text-[13px] font-normal mr-1 truncate flex-shrink-0">
                      to: {email.toEmail} —
                    </span>
                  )}
                  <span
                    className={`truncate flex-shrink-0 max-w-[50%] ${
                      isUnread
                        ? "font-bold text-[#1f1f1f] dark:text-white"
                        : "font-normal text-[#1f1f1f] dark:text-[#c4c7c5]"
                    }`}
                  >
                    {email.subject || "(no subject)"}
                  </span>
                  <span className="text-[#5f6368] dark:text-[#8e918f] truncate font-normal text-[13px]">
                    {email.message ? ` — ${email.message}` : ""}
                  </span>
                </div>

                {/* Right: Date / Quick Action Icons */}
                <div className="flex-shrink-0 w-24 sm:w-28 text-right">
                  <span
                    className={`text-[12px] group-hover:hidden ${
                      isUnread
                        ? "font-bold text-[#1f1f1f] dark:text-white"
                        : "font-normal text-[#5f6368] dark:text-[#8e918f]"
                    }`}
                  >
                    {formatDate(email.createdAt)}
                  </span>

                  <div className="hidden group-hover:flex items-center justify-end gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        readCompleteEmail(email);
                      }}
                      title="Read Aloud (Voice Assistant)"
                      className="p-1 text-[#444746] dark:text-[#c4c7c5] hover:text-[#0b57d0] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] rounded-full transition-colors cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteEmail(email._id);
                      }}
                      title="Delete message"
                      className="p-1 text-[#444746] dark:text-[#c4c7c5] hover:text-[#b3261e] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] rounded-full transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile Card Row (flex md:hidden) */}
              <div className="flex md:hidden items-start gap-3 px-3 py-2.5 border-b border-[#f2f2f2] dark:border-[#2b2d30]">
                {/* Left: Avatar or Checkbox */}
                <div
                  onClick={(e) => toggleSelectRow(e, email._id)}
                  className="flex-shrink-0 cursor-pointer pt-0.5"
                >
                  {isChecked ? (
                    <CheckSquare className="w-6 h-6 text-[#0b57d0] dark:text-[#a8c7fa]" />
                  ) : (
                    <div
                      className={`w-9 h-9 rounded-full bg-gradient-to-tr ${getAvatarColor(
                        contactName
                      )} text-white font-medium text-xs flex items-center justify-center shadow-sm`}
                    >
                      {getInitials(contactName)}
                    </div>
                  )}
                </div>

                {/* Middle: Sender + Subject + Snippet */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span
                      className={`text-[13.5px] truncate block ${
                        isUnread
                          ? "font-bold text-[#1f1f1f] dark:text-white"
                          : "font-semibold text-[#444746] dark:text-[#c4c7c5]"
                      }`}
                    >
                      {activeTab === "drafts" ? (
                        <span className="text-[#d93025] dark:text-[#f28b82] font-semibold mr-1">Draft</span>
                      ) : null}
                      {contactName}
                    </span>
                    <span
                      className={`text-[11px] flex-shrink-0 ${
                        isUnread
                          ? "font-bold text-[#0b57d0] dark:text-[#a8c7fa]"
                          : "font-normal text-[#5f6368] dark:text-[#8e918f]"
                      }`}
                    >
                      {formatDate(email.createdAt)}
                    </span>
                  </div>

                  <div
                    className={`text-[13px] truncate ${
                      isUnread
                        ? "font-semibold text-[#1f1f1f] dark:text-white"
                        : "font-normal text-[#3c4043] dark:text-[#c4c7c5]"
                    }`}
                  >
                    {email.subject || "(no subject)"}
                  </div>

                  <div className="text-[12px] text-[#5f6368] dark:text-[#8e918f] truncate mt-0.5 leading-normal">
                    {email.message}
                  </div>
                </div>

                {/* Right: Star & Voice Action */}
                <div className="flex flex-col items-center justify-between self-stretch flex-shrink-0 pt-0.5 gap-2">
                  <button
                    onClick={(e) => onToggleStar(e, email._id)}
                    title={isStarred ? "Starred" : "Not starred"}
                    className="p-1 text-gray-300 hover:text-gray-500 dark:text-gray-600 cursor-pointer"
                  >
                    <Star className={`w-4 h-4 ${isStarred ? "fill-[#f4b400] text-[#f4b400]" : ""}`} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      readCompleteEmail(email);
                    }}
                    title="Read Aloud"
                    className="p-1 text-[#5f6368] dark:text-[#8e918f] hover:text-[#0b57d0] cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        }))}
      </div>
    </div>
  );
};
