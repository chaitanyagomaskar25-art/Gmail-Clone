import React from "react";
import {
  Inbox,
  Send,
  Users,
  Pen,
  Star,
  FileText,
  Trash2,
  Clock,
  Tag,
  AlertOctagon,
  ChevronDown,
  Plus,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export const Sidebar = ({
  activeTab,
  setActiveTab,
  stats,
  onOpenCompose,
  onOpenContacts,
  isOpen = true,
  onClose,
  starredCount = 0,
}) => {
  const { user } = useAuth();

  const handleItemClick = (id) => {
    setActiveTab(id);
    if (onClose && typeof window !== "undefined" && window.innerWidth < 768) {
      onClose();
    }
  };

  const handleComposeClick = () => {
    onOpenCompose();
    if (onClose && typeof window !== "undefined" && window.innerWidth < 768) {
      onClose();
    }
  };

  const handleContactsClick = () => {
    onOpenContacts();
    if (onClose && typeof window !== "undefined" && window.innerWidth < 768) {
      onClose();
    }
  };

  const mainNavItems = [
    {
      id: "inbox",
      label: "Inbox",
      icon: Inbox,
      count: stats?.unreadCount > 0 ? stats.unreadCount : null,
      boldCount: true,
    },
    {
      id: "starred",
      label: "Starred",
      icon: Star,
      count: starredCount > 0 ? starredCount : null,
      boldCount: false,
    },
    {
      id: "sent",
      label: "Sent",
      icon: Send,
      count: stats?.sentTotal > 0 ? stats.sentTotal : null,
      boldCount: false,
    },
    {
      id: "drafts",
      label: "Drafts",
      icon: FileText,
      count: stats?.draftsTotal > 0 ? stats.draftsTotal : null,
      boldCount: false,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 md:hidden animate-fade-in"
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed md:relative inset-y-0 left-0 z-50 md:z-0
          ${isOpen ? "translate-x-0 w-72 md:w-60 xl:w-64" : "-translate-x-full md:translate-x-0 w-72 md:w-18"}
          bg-[#f6f8fc] dark:bg-[#111318] flex flex-col h-full md:h-[calc(100vh-64px)]
          pt-2 pb-4 px-2 sm:px-3 flex-shrink-0 transition-all duration-200 select-none
          overflow-y-auto overflow-x-hidden shadow-2xl md:shadow-none
        `}
      >
        {/* Authentic Google Compose Button */}
        <div className="mb-4 pt-1 px-1">
          <button
            onClick={handleComposeClick}
            title="Compose new email"
            className={`flex items-center gap-3.5 bg-[#c2e7ff] hover:bg-[#b3dbf5] text-[#001d35] dark:bg-[#c2e7ff] dark:text-[#001d35] font-medium rounded-2xl shadow-compose hover:shadow-lg transition-all duration-200 active:scale-[0.98] group ${
              isOpen
                ? "px-5 py-3.5 min-w-[136px] w-full md:w-auto"
                : "w-12 h-12 justify-center mx-auto rounded-2xl p-0"
            }`}
          >
            <Pen className="w-5 h-5 text-[#001d35] group-hover:rotate-6 transition-transform flex-shrink-0" />
            {isOpen && (
              <span className="text-[14px] font-medium tracking-normal font-sans">
                Compose
              </span>
            )}
          </button>
        </div>

        {/* Main Mailboxes Nav */}
        <nav className="flex-1 space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                title={item.label}
                className={`w-full flex items-center justify-between rounded-full transition-colors duration-150 cursor-pointer ${
                  isOpen ? "px-5 py-2.5" : "w-12 h-11 justify-center mx-auto p-0"
                } ${
                  isActive
                    ? "bg-[#d3e3fd] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] font-bold"
                    : "text-[#444746] dark:text-[#c4c7c5] hover:bg-[#eaebef] dark:hover:bg-[#202124] font-medium"
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${
                      isActive
                        ? "text-[#001d35] dark:text-[#c2e7ff]"
                        : "text-[#444746] dark:text-[#c4c7c5]"
                    } ${item.id === "starred" && isActive ? "fill-current" : ""}`}
                  />
                  {isOpen && (
                    <span className="text-[14px] truncate leading-tight font-sans">
                      {item.label}
                    </span>
                  )}
                </div>

                {isOpen && item.count !== null && item.count !== undefined && (
                  <span
                    className={`text-[12px] ml-2 ${
                      item.boldCount
                        ? "font-bold text-[#1f1f1f] dark:text-white"
                        : "font-normal text-[#444746] dark:text-[#c4c7c5]"
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}

          {/* Divider */}
          {isOpen && (
            <div className="pt-4 pb-1 px-5 flex items-center justify-between text-[11px] font-bold text-[#444746] dark:text-[#8e918f] uppercase tracking-wider">
              <span>Workspace</span>
            </div>
          )}

          {/* User Directory */}
          <button
            onClick={handleContactsClick}
            title="User Directory"
            className={`w-full flex items-center rounded-full text-[#444746] dark:text-[#c4c7c5] hover:bg-[#eaebef] dark:hover:bg-[#202124] font-medium transition-colors cursor-pointer ${
              isOpen ? "px-5 py-2.5 gap-4" : "w-12 h-11 justify-center mx-auto p-0"
            }`}
          >
            <Users className="w-5 h-5 flex-shrink-0 text-[#444746] dark:text-[#c4c7c5]" />
            {isOpen && <span className="text-[14px] font-sans">User Directory</span>}
          </button>

          {/* Labels / Categories preview */}
          {isOpen && (
            <div className="pt-4 space-y-1">
              <div className="px-5 pb-1 text-[11px] font-bold text-[#444746] dark:text-[#8e918f] uppercase tracking-wider flex items-center justify-between">
                <span>Categories</span>
              </div>
              <div
                onClick={() => handleItemClick("inbox")}
                className="px-5 py-2 flex items-center gap-3 text-xs text-[#5f6368] dark:text-[#9aa0a6] rounded-full hover:bg-[#eaebef] dark:hover:bg-[#202124] cursor-pointer"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />
                <span>Primary</span>
              </div>
              <div
                onClick={() => handleItemClick("inbox")}
                className="px-5 py-2 flex items-center gap-3 text-xs text-[#5f6368] dark:text-[#9aa0a6] rounded-full hover:bg-[#eaebef] dark:hover:bg-[#202124] cursor-pointer"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                <span>Updates</span>
              </div>
              <div
                onClick={() => handleItemClick("inbox")}
                className="px-5 py-2 flex items-center gap-3 text-xs text-[#5f6368] dark:text-[#9aa0a6] rounded-full hover:bg-[#eaebef] dark:hover:bg-[#202124] cursor-pointer"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
                <span>Promotions</span>
              </div>
            </div>
          )}
        </nav>

        {/* Gmail Workspace Storage Footer */}
        {isOpen && (
          <div className="pt-3 pb-1 border-t border-[#e0e2e7] dark:border-[#2d3139] mt-auto">
            <div className="px-4 py-2">
              <div className="flex items-center justify-between text-[11px] text-[#444746] dark:text-[#8e918f] mb-1.5 font-medium">
                <span>SMTP Workspace</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              </div>
              <div className="w-full bg-[#e0e2e7] dark:bg-[#30343f] h-1 rounded-full overflow-hidden">
                <div className="bg-[#0b57d0] dark:bg-[#a8c7fa] h-full rounded-full w-[28%]" />
              </div>
              <div className="mt-1.5 text-[10px] text-[#5f6368] dark:text-[#8e918f] truncate">
                Signed in as {user?.email}
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
