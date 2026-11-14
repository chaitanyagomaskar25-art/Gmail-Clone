import React, { useState, useEffect } from "react";
import { X, Users, Search, Mail, Copy, Check } from "lucide-react";
import { authApi } from "../api/client.js";

export const ContactsModal = ({ isOpen, onClose, onSelectContact }) => {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadContacts();
    }
  }, [isOpen]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const { data } = await authApi.getUsers(search);
      if (data.success) {
        setContacts(data.users || []);
      }
    } catch (err) {
      console.error("Failed to load contacts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen) loadContacts();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  if (!isOpen) return null;

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 1);
  };

  const getAvatarGradient = (str = "") => {
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

  const handleCopy = (email) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-lg bg-white dark:bg-[#202124] rounded-3xl shadow-popup border border-[#dadce0] dark:border-[#3c4043] overflow-hidden flex flex-col max-h-[85vh] animate-slide-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#dadce0] dark:border-[#3c4043] flex items-center justify-between bg-[#f8fafd] dark:bg-[#282a2d]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#1f1f1f] dark:text-[#e3e3e3] font-sans">
                Google Contacts Directory
              </h3>
              <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6]">
                All registered users in this Workspace
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#444746] dark:text-[#c4c7c5] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-[#dadce0] dark:border-[#3c4043]">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-[#f1f3f4] dark:bg-[#303134] rounded-full text-xs sm:text-sm text-[#1f1f1f] dark:text-[#e3e3e3] outline-none focus:ring-2 focus:ring-blue-500/30 transition-all placeholder-[#5f6368] dark:placeholder-[#9aa0a6]"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="p-10 text-center text-xs text-gray-400 dark:text-gray-500">
              Loading contacts directory...
            </div>
          ) : contacts.length === 0 ? (
            <div className="p-10 text-center text-xs text-gray-400 dark:text-gray-500">
              No registered contacts found
            </div>
          ) : (
            contacts.map((contact) => (
              <div
                key={contact._id}
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#f6f8fc] dark:hover:bg-[#282a2d] border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all"
              >
                <div className="flex items-center gap-3.5 truncate">
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                      contact.name || contact.email
                    )} text-white font-medium text-sm flex items-center justify-center flex-shrink-0 shadow-sm`}
                  >
                    {getInitials(contact.name || contact.email)}
                  </div>
                  <div className="truncate">
                    <div className="text-sm font-semibold text-[#1f1f1f] dark:text-white truncate">
                      {contact.name || "User"}
                    </div>
                    <div className="text-xs text-[#5f6368] dark:text-[#9aa0a6] truncate font-mono">
                      {contact.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleCopy(contact.email)}
                    title="Copy email address"
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                  >
                    {copiedEmail === contact.email ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      onSelectContact(contact.email);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#c2e7ff] hover:bg-[#b3dbf5] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] text-xs font-semibold shadow-sm transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Compose</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
