import React, { useState } from "react";
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, Sun, Moon, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [localError, setLocalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login, register, authError, setAuthError } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    setAuthError(null);

    if (!email.trim() || !password) {
      setLocalError("Email and password are required.");
      return;
    }

    if (!isLogin) {
      if (!name.trim()) {
        setLocalError("Full name is required.");
        return;
      }
      if (password.length < 8) {
        setLocalError("Password must be at least 8 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setLocalError("Passwords do not match.");
        return;
      }
    }

    setSubmitting(true);
    try {
      if (isLogin) {
        await login(email.trim(), password);
      } else {
        await register(name.trim(), email.trim(), password);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setIsLogin(true);
  };

  const errorMsg = localError || authError;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#f0f4f9] dark:bg-[#111318] transition-colors duration-200 relative select-none font-sans">
      {/* Theme Toggle Top Right */}
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="p-2.5 rounded-full bg-white dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#3c4043] text-gray-700 dark:text-gray-300 shadow-sm hover:scale-105 transition-all"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-700" />}
        </button>
      </div>

      {/* Main Google Sign-in Card */}
      <div className="w-full max-w-[460px] bg-white dark:bg-[#1e1f20] rounded-[28px] p-8 sm:p-10 shadow-lg border border-[#dadce0] dark:border-[#3c4043] transition-all">
        {/* Google 4-color Logo SVG */}
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-9 h-7" viewBox="0 0 24 24" fill="none">
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
          <span className="text-xl font-normal text-[#1f1f1f] dark:text-[#e3e3e3]">Gmail</span>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-normal text-[#1f1f1f] dark:text-white tracking-tight">
          {isLogin ? "Sign in" : "Create a Google Account"}
        </h1>
        <p className="text-sm text-[#444746] dark:text-[#c4c7c5] mt-1.5 mb-6">
          {isLogin ? "to continue to Gmail Workspace" : "Enter your details to create an account"}
        </p>

        {/* Tab Toggle Pill */}
        <div className="flex bg-[#f0f4f9] dark:bg-[#282a2d] p-1 rounded-full mb-6">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setLocalError("");
              setAuthError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all ${
              isLogin
                ? "bg-white dark:bg-[#1e1f20] text-[#0b57d0] dark:text-[#a8c7fa] shadow-sm"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setLocalError("");
              setAuthError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all ${
              !isLogin
                ? "bg-white dark:bg-[#1e1f20] text-[#0b57d0] dark:text-[#a8c7fa] shadow-sm"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
            }`}
          >
            Create account
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-xl text-xs flex items-center gap-2.5 animate-slide-up">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full name
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5" />
                <input
                  type="text"
                  placeholder="e.g. Alice Walker"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-[#dadce0] dark:border-[#3c4043] bg-transparent text-sm text-[#1f1f1f] dark:text-[#e3e3e3] outline-none focus:border-[#0b57d0] focus:ring-1 focus:ring-[#0b57d0] transition-all placeholder-gray-400"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email address
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5" />
              <input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-[#dadce0] dark:border-[#3c4043] bg-transparent text-sm text-[#1f1f1f] dark:text-[#e3e3e3] outline-none focus:border-[#0b57d0] focus:ring-1 focus:ring-[#0b57d0] transition-all placeholder-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password (min 8 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pl-10 pr-10 rounded-xl border border-[#dadce0] dark:border-[#3c4043] bg-transparent text-sm text-[#1f1f1f] dark:text-[#e3e3e3] outline-none focus:border-[#0b57d0] focus:ring-1 focus:ring-[#0b57d0] transition-all placeholder-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm Password
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-[#dadce0] dark:border-[#3c4043] bg-transparent text-sm text-[#1f1f1f] dark:text-[#e3e3e3] outline-none focus:border-[#0b57d0] focus:ring-1 focus:ring-[#0b57d0] transition-all placeholder-gray-400"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 rounded-full bg-[#0b57d0] hover:bg-[#0842a0] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 transition-all font-sans"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? "Sign in" : "Next"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* 1-Click Quick Demo Switcher */}
        <div className="mt-8 pt-5 border-t border-[#dadce0] dark:border-[#3c4043]">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-2.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Instant Demo Logins:</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo("alice@example.com", "password123")}
              className="px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-semibold text-left border border-blue-200 dark:border-blue-900/50 transition-colors"
            >
              <div className="font-bold">Alice Walker</div>
              <div className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">alice@example.com</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo("bob@example.com", "password123")}
              className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold text-left border border-emerald-200 dark:border-emerald-900/50 transition-colors"
            >
              <div className="font-bold">Bob Builder</div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">bob@example.com</div>
            </button>
          </div>
        </div>
      </div>

      {/* Google Footer */}
      <footer className="mt-6 flex items-center justify-between w-full max-w-[460px] text-[11px] text-[#5f6368] dark:text-[#9aa0a6] px-3">
        <span>English (United States)</span>
        <div className="flex items-center gap-4">
          <span className="hover:underline cursor-pointer">Help</span>
          <span className="hover:underline cursor-pointer">Privacy</span>
          <span className="hover:underline cursor-pointer">Terms</span>
        </div>
      </footer>
    </div>
  );
};
