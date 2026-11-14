import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  RefreshCw,
  X,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Menu,
  SlidersHorizontal,
  LogOut,
  HelpCircle,
  Settings,
  UserCheck,
  Radio,
  Sparkles,
} from "lucide-react";
import { useVoice } from "../context/VoiceContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export const Header = ({
  searchQuery,
  setSearchQuery,
  onRefresh,
  loading,
  socketConnected,
  toggleSidebar,
  isSidebarOpen,
}) => {
  const { isMuted, toggleMute, isSpeaking } = useVoice();
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [showSearchFilters, setShowSearchFilters] = useState(false);
  const profileRef = useRef(null);

  // Close profile dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 1);
  };

  return (
    <header className="h-16 px-2.5 sm:px-4 flex items-center justify-between gap-1.5 sm:gap-4 bg-[#f6f8fc] dark:bg-[#111318] flex-shrink-0 select-none border-b border-transparent transition-colors duration-200 z-30">
      {/* Left Branding & Hamburger Menu */}
      <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
        <button
          onClick={toggleSidebar}
          title={isSidebarOpen ? "Collapse main menu" : "Expand main menu"}
          aria-label="Toggle menu"
          className="p-2 sm:p-2.5 rounded-full hover:bg-black/[0.06] dark:hover:bg-white/[0.08] active:bg-black/[0.1] text-[#444746] dark:text-[#c4c7c5] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 cursor-pointer select-none">
          {/* Authentic Gmail Envelope Logo */}
          <div className="flex-shrink-0">
            <svg className="w-6 h-4.5 sm:w-8 sm:h-6" viewBox="0 0 24 24" fill="none">
              <path
                d="M1.5 5.25L12 12.75L22.5 5.25V18.75C22.5 19.5784 21.8284 20.25 21 20.25H3C2.17157 20.25 1.5 19.5784 1.5 18.75V5.25Z"
                fill="#EA4335"
              />
              <path
                d="M1.5 5.25C1.5 4.42157 2.17157 3.75 3 3.75H21C21.8284 3.75 22.5 4.42157 22.5 5.25V5.88281L12 13.3828L1.5 5.88281V5.25Z"
                fill="#FBBC04"
              />
              <path
                d="M1.5 5.25V18.75C1.5 19.5784 2.17157 20.25 3 20.25H6V8.46094L1.5 5.25Z"
                fill="#4285F4"
              />
              <path
                d="M22.5 5.25V18.75C22.5 19.5784 21.8284 20.25 21 20.25H18V8.46094L22.5 5.25Z"
                fill="#34A853"
              />
            </svg>
          </div>
          <span className="hidden sm:inline-block text-[18px] sm:text-[22px] tracking-tight font-normal text-[#444746] dark:text-[#e3e3e3] font-sans">
            Gmail
          </span>
          <span className="hidden lg:inline-block text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            Realtime
          </span>
        </div>
      </div>

      {/* Center: Gmail Pill Search Bar */}
      <div className="flex-1 max-w-[720px] relative min-w-0 mx-1 sm:mx-2">
        <div className="relative flex items-center group">
          <button
            title="Search"
            className="absolute left-3 sm:left-4 p-1 text-[#444746] dark:text-[#c4c7c5] hover:text-[#1f1f1f] dark:hover:text-white transition-colors"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <input
            type="text"
            placeholder="Search mail"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 sm:h-12 pl-8 sm:pl-12 pr-14 sm:pr-24 bg-[#eaf1fb] hover:bg-[#e4ebf5] focus:bg-white dark:bg-[#1e1f20] dark:hover:bg-[#282a2d] dark:focus:bg-[#282a2d] text-[#1f1f1f] dark:text-[#e3e3e3] text-xs sm:text-[15px] rounded-full border border-transparent focus:border-transparent focus:shadow-searchFocus dark:focus:shadow-none outline-none transition-all duration-150 placeholder-[#444746] dark:placeholder-[#8e918f]"
          />

          <div className="absolute right-2 sm:right-3 flex items-center gap-0.5 sm:gap-1">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                title="Clear search"
                className="p-1 sm:p-1.5 text-[#444746] dark:text-[#c4c7c5] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] rounded-full transition-colors"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}
            <button
              onClick={() => setShowSearchFilters(!showSearchFilters)}
              title="Search options"
              className="p-1 sm:p-1.5 text-[#444746] dark:text-[#c4c7c5] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] rounded-full transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Search Quick Filters Popover */}
        {showSearchFilters && (
          <div className="absolute top-14 left-0 w-full bg-white dark:bg-[#202124] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50 text-xs animate-slide-up">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Quick Filter By</span>
              <button
                onClick={() => setShowSearchFilters(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {["has:attachment", "is:unread", "from:Alice", "from:Bob", "subject:meeting", "is:starred"].map(
                (filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      setSearchQuery(filter);
                      setShowSearchFilters(false);
                    }}
                    className="px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-colors"
                  >
                    {filter}
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Controls: Socket Live Status, Theme, Voice, User Profile */}
      <div className="flex items-center gap-0.5 sm:gap-2 flex-shrink-0">
        {/* Real-Time Socket Badge */}
        <div
          className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium border transition-colors ${
            socketConnected
              ? "bg-[#e6f4ea] dark:bg-[#137333]/25 text-[#137333] dark:text-[#81c995] border-[#ceead6] dark:border-[#137333]/40"
              : "bg-[#fce8e6] dark:bg-[#c5221f]/25 text-[#c5221f] dark:text-[#f28b82] border-[#fad2cf] dark:border-[#c5221f]/40"
          }`}
          title={socketConnected ? "Socket.IO Live Room Connected" : "Connecting to Socket.IO..."}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              socketConnected ? "bg-[#1e8e3e] animate-pulse" : "bg-[#d93025]"
            }`}
          />
          <span className="hidden md:inline font-sans font-medium">
            {socketConnected ? "Live Sync" : "Reconnecting"}
          </span>
        </div>

        {/* Refresh button - hidden on mobile */}
        <button
          onClick={onRefresh}
          disabled={loading}
          title="Refresh emails"
          className="hidden sm:inline-flex p-2 sm:p-2.5 rounded-full hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-[#444746] dark:text-[#c4c7c5] transition-colors"
        >
          <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? "animate-spin text-[#0b57d0]" : ""}`} />
        </button>

        {/* Voice Assistant Toggle */}
        <button
          onClick={toggleMute}
          title={isMuted ? "Voice Assistant Muted (Click to Unmute)" : "Voice Assistant Active"}
          className={`p-1.5 sm:p-2.5 rounded-full transition-colors relative ${
            isMuted
              ? "text-[#b3261e] hover:bg-red-50 dark:hover:bg-red-950/30"
              : isSpeaking
              ? "text-[#0b57d0] bg-[#c2e7ff]/60 dark:bg-[#004a77]/50"
              : "text-[#444746] dark:text-[#c4c7c5] hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
          }`}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
          {isSpeaking && !isMuted && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full animate-ping" />
          )}
        </button>

        {/* Dark / Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? "Switch to Light mode" : "Switch to Dark mode"}
          className="p-1.5 sm:p-2.5 rounded-full hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-[#444746] dark:text-[#c4c7c5] transition-colors"
        >
          {isDark ? (
            <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-[#444746]" />
          )}
        </button>

        {/* User Account Avatar & Popover */}
        <div className="relative ml-1" ref={profileRef}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            title={`Google Account: ${user?.name || user?.email}`}
            className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-[#1a73e8] to-[#4285f4] text-white font-medium text-sm shadow-sm ring-2 ring-transparent hover:ring-blue-300 dark:hover:ring-blue-800 transition-all focus:outline-none"
          >
            {getInitials(user?.name || user?.email)}
          </button>

          {/* Authentic Google Account Flyout Modal */}
          {showProfile && (
            <div className="absolute right-0 top-12 w-80 sm:w-88 bg-white dark:bg-[#202124] rounded-3xl shadow-popup border border-[#dadce0] dark:border-[#3c4043] p-5 z-50 animate-slide-up text-[#1f1f1f] dark:text-[#e3e3e3]">
              {/* Account Header */}
              <div className="text-center pb-4 border-b border-[#dadce0] dark:border-[#3c4043]">
                <div className="text-xs text-[#5f6368] dark:text-[#9aa0a6] font-medium mb-3">
                  Google Workspace
                </div>
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#1a73e8] to-[#4285f4] text-white font-medium text-2xl flex items-center justify-center mx-auto shadow-md mb-2">
                  {getInitials(user?.name || user?.email)}
                </div>
                <h3 className="text-base font-semibold text-[#1f1f1f] dark:text-white">
                  {user?.name || "Active User"}
                </h3>
                <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mt-0.5 truncate px-2">
                  {user?.email}
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2.5 rounded-full bg-[#e8f0fe] dark:bg-[#1a3a60] text-[#1967d2] dark:text-[#a8c7fa] text-[11px] font-medium">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Authenticated Session</span>
                </div>
              </div>

              {/* Status info */}
              <div className="py-3 px-2 text-xs space-y-2 text-[#5f6368] dark:text-[#9aa0a6]">
                <div className="flex justify-between items-center">
                  <span>Mail Transport:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Nodemailer SMTP</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Socket Stream:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">user:{user?._id?.slice(-6)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-[#dadce0] dark:border-[#3c4043] flex items-center justify-between">
                <button
                  onClick={() => setShowProfile(false)}
                  className="px-3 py-1.5 text-xs text-[#5f6368] dark:text-[#9aa0a6] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#f8f9fa] hover:bg-[#f1f3f4] dark:bg-[#303134] dark:hover:bg-[#3c4043] text-[#b3261e] dark:text-[#f28b82] text-xs font-semibold border border-[#dadce0] dark:border-[#3c4043] transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
