import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "./context/AuthContext.jsx";
import { useVoice } from "./context/VoiceContext.jsx";
import { emailApi, getAccessToken } from "./api/client.js";
import { connectSocket, disconnectSocket } from "./socket/socketClient.js";
import { AuthPage } from "./pages/AuthPage.jsx";
import { Sidebar } from "./components/Sidebar.jsx";
import { Header } from "./components/Header.jsx";
import { EmailList } from "./components/EmailList.jsx";
import { EmailDetail } from "./components/EmailDetail.jsx";
import { ComposeModal } from "./components/ComposeModal.jsx";
import { ContactsModal } from "./components/ContactsModal.jsx";
import { VoicePlayerBar } from "./components/VoicePlayerBar.jsx";
import { CheckCircle2, AlertCircle, X, Pen } from "lucide-react";

export function App() {
  const { user, loading: authLoading } = useAuth();
  const { announceNewEmail } = useVoice();

  // Navigation and active view
  const [activeTab, setActiveTab] = useState("inbox"); // 'inbox' | 'starred' | 'sent' | 'drafts'
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [stats, setStats] = useState({ inboxTotal: 0, unreadCount: 0, sentTotal: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);

  // UI layout toggles - responsive: open on desktop (>=768px), closed on mobile (<768px)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 768 : true
  );
  const [isSplitView, setIsSplitView] = useState(() => {
    return localStorage.getItem("smartmail_split_view") === "true";
  });

  // Starred messages tracking (persisted)
  const [starredIds, setStarredIds] = useState(() => {
    try {
      const saved = localStorage.getItem("smartmail_starred_ids");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Modals
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeInitialData, setComposeInitialData] = useState(null);
  const [isContactsOpen, setIsContactsOpen] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 4500);
  };

  const toggleSplitView = () => {
    setIsSplitView((prev) => {
      const next = !prev;
      localStorage.setItem("smartmail_split_view", String(next));
      return next;
    });
  };

  const handleToggleStar = async (e, emailId) => {
    if (e && e.stopPropagation) e.stopPropagation();

    // Optimistic UI update
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (next.has(emailId)) next.delete(emailId);
      else next.add(emailId);
      try {
        localStorage.setItem("smartmail_starred_ids", JSON.stringify([...next]));
      } catch (_) {}
      return next;
    });

    setEmails((prev) =>
      prev.map((m) => (m._id === emailId ? { ...m, isStarred: !m.isStarred } : m))
    );

    if (selectedEmail?._id === emailId) {
      setSelectedEmail((prev) => ({ ...prev, isStarred: !prev.isStarred }));
    }

    try {
      const { data } = await emailApi.toggleStar(emailId);
      if (data.success) {
        if (data.isStarred) {
          setStarredIds((prev) => new Set([...prev, emailId]));
        } else {
          setStarredIds((prev) => {
            const next = new Set(prev);
            next.delete(emailId);
            return next;
          });
          if (activeTab === "starred") {
            setEmails((prev) => prev.filter((m) => m._id !== emailId));
          }
        }
        fetchStats();
      }
    } catch (err) {
      console.error("Failed to toggle star:", err);
      fetchEmails();
    }
  };

  // Load email counts / stats
  const fetchStats = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await emailApi.getStats();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, [user]);

  // Load Emails based on activeTab & search
  const fetchEmails = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingEmails(true);
      const apiCall =
        activeTab === "sent"
          ? emailApi.getSent
          : activeTab === "starred"
          ? emailApi.getStarred
          : activeTab === "drafts"
          ? emailApi.getDrafts
          : emailApi.getInbox;

      const { data } = await apiCall(1, 50, searchQuery);

      if (data.success) {
        setEmails(data.emails || []);

        // Sync starredIds from response
        setStarredIds((prev) => {
          const next = new Set(prev);
          (data.emails || []).forEach((m) => {
            if (m.isStarred) next.add(m._id);
            else if (activeTab !== "starred") next.delete(m._id);
          });
          return next;
        });

        setSelectedEmail((prev) => {
          if (!prev) return null;
          const found = data.emails.find((e) => e._id === prev._id);
          return found || null;
        });
      }
    } catch (err) {
      console.error("Failed to fetch emails:", err);
    } finally {
      setLoadingEmails(false);
    }
  }, [user, activeTab, searchQuery]);

  // Initial and reactive data fetching with search debounce
  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      fetchEmails();
      fetchStats();
    }, 250);
    return () => clearTimeout(timer);
  }, [user, activeTab, searchQuery, fetchEmails, fetchStats]);

  // Responsive sidebar auto-close on mobile screen width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ======================================
  // REAL-TIME SOCKET.IO INTEGRATION
  // ======================================
  useEffect(() => {
    if (!user) {
      disconnectSocket();
      setSocketConnected(false);
      return;
    }

    const token = getAccessToken();
    const socket = connectSocket(token);

    if (socket.connected) {
      setSocketConnected(true);
    }

    const handleConnect = () => {
      setSocketConnected(true);
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
    };

    // Real-time new email notification
    const handleNewEmail = ({ email, unreadCount }) => {
      setEmails((prev) => [email, ...prev.filter((e) => e._id !== email._id)]);

      setStats((prev) => ({
        ...prev,
        unreadCount: typeof unreadCount === "number" ? unreadCount : prev.unreadCount + 1,
        inboxTotal: prev.inboxTotal + 1,
      }));

      // Announce via Voice Assistant
      announceNewEmail(email);

      // Toast feedback
      const sender = email.from?.name || email.fromEmail || "New message";
      showToast(`New email from ${sender}: "${email.subject}"`, "success");
    };

    // Real-time unread counter update
    const handleUnreadCount = ({ unreadCount }) => {
      setStats((prev) => ({
        ...prev,
        unreadCount,
      }));
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("new_email", handleNewEmail);
    socket.on("update_unread_count", handleUnreadCount);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("new_email", handleNewEmail);
      socket.off("update_unread_count", handleUnreadCount);
    };
  }, [user, announceNewEmail]);

  // Mark Read / Unread handler
  const handleToggleRead = async (emailId, isRead) => {
    try {
      const { data } = await emailApi.markAsRead(emailId, isRead);
      if (data.success) {
        setEmails((prev) =>
          prev.map((e) => (e._id === emailId ? { ...e, isRead } : e))
        );
        if (selectedEmail?._id === emailId) {
          setSelectedEmail((prev) => ({ ...prev, isRead }));
        }
        fetchStats();
      }
    } catch (err) {
      showToast("Failed to update message status", "error");
    }
  };

  // Delete email handler
  const handleDeleteEmail = async (emailId) => {
    try {
      const { data } = await emailApi.deleteEmail(emailId);
      if (data.success) {
        setEmails((prev) => prev.filter((e) => e._id !== emailId));
        if (selectedEmail?._id === emailId) {
          setSelectedEmail(null);
        }
        fetchStats();
        showToast("Email moved to trash", "success");
      }
    } catch (err) {
      showToast("Failed to delete email", "error");
    }
  };

  // Select email & auto mark read (or open draft in compose modal)
  const handleSelectEmail = (email) => {
    if (activeTab === "drafts") {
      setComposeInitialData({
        to: email.toEmail || "",
        subject: email.subject === "(no subject)" ? "" : email.subject,
        message: email.message || "",
        draftId: email._id,
      });
      setIsComposeOpen(true);
      return;
    }

    setSelectedEmail(email);
    if (!email.isRead && activeTab === "inbox") {
      handleToggleRead(email._id, true);
    }
  };

  // Reply handler (opens compose popup)
  const handleReply = (email) => {
    const replyRecipient = activeTab === "inbox" ? (email.fromEmail || email.from?.email) : email.toEmail;
    const replySubject = email.subject.startsWith("Re:")
      ? email.subject
      : `Re: ${email.subject}`;
    const quotedMessage = `\n\n--- On ${new Date(
      email.createdAt
    ).toLocaleString()}, ${email.from?.name || email.fromEmail} wrote ---\n> ${
      email.message
    }`;

    setComposeInitialData({
      to: replyRecipient,
      subject: replySubject,
      message: quotedMessage,
    });
    setIsComposeOpen(true);
  };

  // Inline quick reply from reading pane
  const handleInlineSendReply = async ({ to, subject, message }) => {
    try {
      const { data } = await emailApi.sendEmail({ to, subject, message });
      if (data.success) {
        showToast("Reply sent successfully", "success");
        fetchEmails();
        fetchStats();
      }
    } catch (err) {
      showToast("Failed to send reply", "error");
      throw err;
    }
  };

  // Compose to specific contact from Directory
  const handleComposeTo = (contactEmail) => {
    setComposeInitialData({
      to: contactEmail,
      subject: "",
      message: "",
    });
    setIsComposeOpen(true);
  };

  // If loading session check
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f6f8fc] dark:bg-[#111318] text-gray-500 gap-3 font-sans">
        <div className="w-10 h-10 border-4 border-gray-200 dark:border-gray-800 border-t-[#0b57d0] rounded-full animate-spin" />
        <p className="text-xs font-semibold tracking-wide text-[#444746] dark:text-[#c4c7c5]">
          Loading Gmail Workspace...
        </p>
      </div>
    );
  }

  // If not logged in
  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#f6f8fc] dark:bg-[#111318] transition-colors duration-200 font-sans">
      {/* Top Gmail Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onRefresh={() => {
          fetchEmails();
          fetchStats();
        }}
        loading={loadingEmails}
        socketConnected={socketConnected}
        toggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Main Mail Workspace */}
      <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setSelectedEmail(null);
          }}
          stats={stats}
          starredCount={stats?.starredTotal ?? starredIds.size}
          onOpenCompose={() => {
            setComposeInitialData(null);
            setIsComposeOpen(true);
          }}
          onOpenContacts={() => setIsContactsOpen(true)}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Master Email Canvas (Google Workspace floating surface) */}
        <main className="flex-1 flex overflow-hidden bg-white dark:bg-[#1e1f20] rounded-none md:rounded-2xl md:rounded-tl-2xl shadow-sm border-0 md:border border-[#e0e2e7] dark:border-[#2d3139] md:mr-2 md:mb-2 w-full">
          {/* If Split view is active AND an email is selected: Show Side-by-Side */}
          {isSplitView && selectedEmail ? (
            <div className="flex-1 flex overflow-hidden">
              {/* Left Column: Email List */}
              <div className="w-96 lg:w-[420px] xl:w-[460px] border-r border-[#e7e9ed] dark:border-[#30343f] flex flex-col h-full flex-shrink-0">
                <EmailList
                  emails={emails}
                  selectedEmail={selectedEmail}
                  onSelectEmail={handleSelectEmail}
                  onToggleRead={handleToggleRead}
                  onDeleteEmail={handleDeleteEmail}
                  activeTab={activeTab}
                  loading={loadingEmails}
                  onRefresh={() => {
                    fetchEmails();
                    fetchStats();
                  }}
                  starredIds={starredIds}
                  onToggleStar={handleToggleStar}
                  isSplitView={isSplitView}
                  onToggleSplitView={toggleSplitView}
                />
              </div>

              {/* Right Column: Email Detail Reading Pane */}
              <div className="flex-1 h-full overflow-hidden flex flex-col">
                <EmailDetail
                  email={selectedEmail}
                  onClose={() => setSelectedEmail(null)}
                  onReply={handleReply}
                  onDelete={handleDeleteEmail}
                  onToggleRead={handleToggleRead}
                  activeTab={activeTab}
                  isStarred={(starredIds && starredIds.has(selectedEmail._id)) || Boolean(selectedEmail.isStarred)}
                  onToggleStar={handleToggleStar}
                  onSendReply={handleInlineSendReply}
                />
              </div>
            </div>
          ) : selectedEmail ? (
            /* Full Screen Reading View (Standard Gmail behavior) */
            <div className="flex-1 h-full overflow-hidden flex flex-col">
              <EmailDetail
                email={selectedEmail}
                onClose={() => setSelectedEmail(null)}
                onReply={handleReply}
                onDelete={handleDeleteEmail}
                onToggleRead={handleToggleRead}
                activeTab={activeTab}
                isStarred={(starredIds && starredIds.has(selectedEmail._id)) || Boolean(selectedEmail.isStarred)}
                onToggleStar={handleToggleStar}
                onSendReply={handleInlineSendReply}
              />
            </div>
          ) : (
            /* Full Width Email List View */
            <div className="flex-1 h-full overflow-hidden flex flex-col">
              <EmailList
                emails={emails}
                selectedEmail={selectedEmail}
                onSelectEmail={handleSelectEmail}
                onToggleRead={handleToggleRead}
                onDeleteEmail={handleDeleteEmail}
                activeTab={activeTab}
                loading={loadingEmails}
                onRefresh={() => {
                  fetchEmails();
                  fetchStats();
                }}
                starredIds={starredIds}
                onToggleStar={handleToggleStar}
                isSplitView={isSplitView}
                onToggleSplitView={toggleSplitView}
              />
            </div>
          )}
        </main>
      </div>

      {/* Gmail Style Compose Popup */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => {
          setIsComposeOpen(false);
          fetchStats();
          if (activeTab === "drafts") fetchEmails();
        }}
        onEmailSent={(msg) => {
          showToast(msg, "success");
          fetchEmails();
          fetchStats();
        }}
        onDraftSaved={() => {
          fetchStats();
          if (activeTab === "drafts") fetchEmails();
        }}
        initialData={composeInitialData}
      />

      {/* Contacts Directory Modal */}
      <ContactsModal
        isOpen={isContactsOpen}
        onClose={() => setIsContactsOpen(false)}
        onSelectContact={handleComposeTo}
      />

      {/* Mobile Floating Compose Button */}
      <button
        onClick={() => {
          setComposeInitialData(null);
          setIsComposeOpen(true);
        }}
        title="Compose new message"
        className="md:hidden fixed bottom-6 right-5 z-40 flex items-center gap-2.5 px-4 py-3.5 bg-[#c2e7ff] text-[#001d35] dark:bg-[#c2e7ff] dark:text-[#001d35] rounded-2xl shadow-xl active:scale-95 transition-transform cursor-pointer font-sans"
      >
        <Pen className="w-5 h-5 text-[#001d35]" />
        <span className="text-sm font-semibold">Compose</span>
      </button>

      {/* Voice Assistant Floating Player Bar */}
      <VoicePlayerBar />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#1f1f1f] text-white dark:bg-white dark:text-[#1f1f1f] shadow-2xl border border-gray-700/50 dark:border-gray-200/50 text-xs font-semibold animate-slide-up">
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 dark:text-rose-600 flex-shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-gray-400 hover:text-white dark:hover:text-black p-0.5 rounded-full"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
