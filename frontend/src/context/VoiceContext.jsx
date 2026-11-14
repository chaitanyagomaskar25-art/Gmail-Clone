import React, { createContext, useContext, useState, useEffect, useRef } from "react";

const VoiceContext = createContext(null);

export const VoiceProvider = ({ children }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem("smartmail_voice_muted") === "true";
  });
  const [readingEmail, setReadingEmail] = useState(null);
  const [speechRate, setSpeechRate] = useState(() => {
    const saved = localStorage.getItem("smartmail_voice_rate");
    return saved ? parseFloat(saved) : 1.0;
  });

  const fullTextRef = useRef("");
  const charIndexRef = useRef(0);
  const rateRef = useRef(speechRate);
  const pausedByCodeRef = useRef(false);
  const voicesRef = useRef([]);

  // Check if speech synthesis is supported in browser
  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  // Keep rateRef in sync
  useEffect(() => {
    rateRef.current = speechRate;
  }, [speechRate]);

  // Load and cache voices
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      try {
        const available = window.speechSynthesis.getVoices();
        if (available && available.length > 0) {
          voicesRef.current = available;
        }
      } catch (e) {
        console.warn("Could not load voices:", e);
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    };
  }, [isSupported]);

  // Persist mute setting
  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem("smartmail_voice_muted", String(next));
      if (next && isSupported) {
        stop();
      }
      return next;
    });
  };

  const updateSpeechRate = (rate) => {
    setSpeechRate(rate);
    rateRef.current = rate;
    localStorage.setItem("smartmail_voice_rate", String(rate));
    if (readingEmail && isSpeaking && !isPaused) {
      speakSlice(charIndexRef.current);
    }
  };

  // Helper to get best English voice
  const getSelectedVoice = () => {
    if (!voicesRef.current || voicesRef.current.length === 0) {
      if (isSupported) {
        voicesRef.current = window.speechSynthesis.getVoices();
      }
    }
    const voices = voicesRef.current || [];
    return (
      voices.find((v) => v.lang === "en-US" && v.name.includes("Google")) ||
      voices.find((v) => v.lang === "en-US") ||
      voices.find((v) => v.lang.startsWith("en")) ||
      voices[0] ||
      null
    );
  };

  // Core speak method for a text slice
  const speakSlice = (startIndex = 0) => {
    if (!isSupported || !fullTextRef.current) return;

    try {
      window.speechSynthesis.cancel();
      // Ensure browser is not in paused state
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch (e) {}

    const textToSpeak = fullTextRef.current.slice(startIndex).trim();
    if (!textToSpeak) {
      setIsSpeaking(false);
      setIsPaused(false);
      setReadingEmail(null);
      charIndexRef.current = 0;
      return;
    }

    // Delay slightly after cancel() to avoid Chrome's async cancel race condition
    setTimeout(() => {
      try {
        // Ensure again unpaused before speaking
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = rateRef.current || 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.lang = "en-US";

        const voice = getSelectedVoice();
        if (voice) {
          utterance.voice = voice;
        }

        // Track exact spoken character position
        utterance.onboundary = (e) => {
          if (typeof e.charIndex === "number") {
            charIndexRef.current = startIndex + e.charIndex;
          }
        };

        utterance.onstart = () => {
          setIsSpeaking(true);
          setIsPaused(false);
          pausedByCodeRef.current = false;
        };

        utterance.onend = () => {
          if (!pausedByCodeRef.current) {
            setIsSpeaking(false);
            setIsPaused(false);
            setReadingEmail(null);
            charIndexRef.current = 0;
          }
        };

        utterance.onerror = (e) => {
          if (e.error === "canceled" || e.error === "interrupted") {
            return;
          }
          console.warn("Speech error:", e.error);
          setIsSpeaking(false);
          setIsPaused(false);
          setReadingEmail(null);
          charIndexRef.current = 0;
        };

        // Prevent Chromium GC from terminating speech early
        if (typeof window !== "undefined") {
          window.__smartMailUtterance = utterance;
        }

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error("Failed to speak utterance:", err);
        setIsSpeaking(false);
        setIsPaused(false);
      }
    }, 40);
  };

  // Announce incoming email (suppressed if muted)
  const announceNewEmail = (email) => {
    if (!isSupported || isMuted || !email) return;

    const senderName = email.from?.name || email.fromEmail || "someone";
    const subject = email.subject || "No subject";
    const textToSpeak = `New email received from ${senderName}. Subject: ${subject}.`;

    setReadingEmail({
      title: `Announcement: ${senderName}`,
      subject: email.subject,
      message: textToSpeak,
    });
    fullTextRef.current = textToSpeak;
    charIndexRef.current = 0;
    pausedByCodeRef.current = false;

    speakSlice(0);
  };

  // Read complete email on demand
  const readCompleteEmail = (email, overrideRate) => {
    if (!isSupported || !email) return;

    // If muted, automatically unmute because the user explicitly pressed Read Aloud
    if (isMuted) {
      setIsMuted(false);
      localStorage.setItem("smartmail_voice_muted", "false");
    }

    if (overrideRate) {
      rateRef.current = overrideRate;
      setSpeechRate(overrideRate);
    }

    const senderName = email.from?.name || email.fromEmail || "Unknown sender";
    const recipientName = email.toUser?.name || email.toEmail || "you";
    const subject = email.subject || "No subject";
    const body = email.message || "";

    const textToSpeak = `Email from ${senderName}, to ${recipientName}. Subject: ${subject}. Message: ${body}`;

    setReadingEmail(email);
    fullTextRef.current = textToSpeak;
    charIndexRef.current = 0;
    pausedByCodeRef.current = false;

    speakSlice(0);
  };

  // Pause speech
  const pause = () => {
    if (!isSupported) return;

    pausedByCodeRef.current = true;
    setIsPaused(true);

    try {
      window.speechSynthesis.pause();
    } catch (e) {
      console.warn("Pause error:", e);
    }
  };

  // Resume speech
  const resume = () => {
    if (!isSupported) return;

    pausedByCodeRef.current = false;
    setIsPaused(false);

    // Try native resume
    try {
      window.speechSynthesis.resume();
    } catch (e) {
      console.warn("Resume error:", e);
    }

    // Chrome bug recovery: if speech doesn't immediately resume, speak remaining slice
    setTimeout(() => {
      if (!window.speechSynthesis.speaking || window.speechSynthesis.paused) {
        speakSlice(charIndexRef.current);
      }
    }, 100);
  };

  // Stop speech completely
  const stop = () => {
    if (!isSupported) return;

    pausedByCodeRef.current = false;
    charIndexRef.current = 0;
    fullTextRef.current = "";

    try {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch (e) {}

    setIsSpeaking(false);
    setIsPaused(false);
    setReadingEmail(null);
  };

  return (
    <VoiceContext.Provider
      value={{
        isSupported,
        isSpeaking,
        isPaused,
        isMuted,
        readingEmail,
        speechRate,
        updateSpeechRate,
        toggleMute,
        announceNewEmail,
        readCompleteEmail,
        pause,
        resume,
        stop,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error("useVoice must be used within a VoiceProvider");
  }
  return context;
};
