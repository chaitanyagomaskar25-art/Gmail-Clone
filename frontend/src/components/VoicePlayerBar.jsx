import React from "react";
import { Play, Pause, Square, Volume2, VolumeX, Sparkles } from "lucide-react";
import { useVoice } from "../context/VoiceContext.jsx";

export const VoicePlayerBar = () => {
  const {
    isSpeaking,
    isPaused,
    isMuted,
    readingEmail,
    pause,
    resume,
    stop,
    toggleMute,
    speechRate,
    updateSpeechRate,
  } = useVoice();

  if (!isSpeaking && !isPaused) return null;

  const title =
    readingEmail?.subject || readingEmail?.title || "Reading email aloud...";

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 sm:gap-3.5 px-3.5 sm:px-5 py-2.5 sm:py-3 bg-white/95 dark:bg-[#202124]/95 backdrop-blur-md rounded-full shadow-2xl border border-blue-200 dark:border-blue-900/60 max-w-[95vw] text-slate-800 dark:text-slate-100 animate-slide-up select-none">
      {/* Sound Wave Animation */}
      <div className="flex items-end gap-1 px-1 h-5 w-6 flex-shrink-0">
        <span className={`w-1 bg-[#0b57d0] dark:bg-[#a8c7fa] rounded-full ${isPaused ? "h-1.5" : "animate-sound-wave-1"}`} />
        <span className={`w-1 bg-[#0b57d0] dark:bg-[#a8c7fa] rounded-full ${isPaused ? "h-1.5" : "animate-sound-wave-2"}`} />
        <span className={`w-1 bg-[#0b57d0] dark:bg-[#a8c7fa] rounded-full ${isPaused ? "h-1.5" : "animate-sound-wave-3"}`} />
        <span className={`w-1 bg-[#0b57d0] dark:bg-[#a8c7fa] rounded-full ${isPaused ? "h-1.5" : "animate-sound-wave-4"}`} />
      </div>

      {/* Title */}
      <div className="text-xs font-semibold max-w-[180px] sm:max-w-xs truncate" title={title}>
        <span className="text-[#0b57d0] dark:text-[#a8c7fa] mr-1">
          {isPaused ? "Paused:" : "Voice Assistant:"}
        </span>
        <span className="text-gray-800 dark:text-gray-200 font-normal">{title}</span>
      </div>

      {/* Speed Rate Pill */}
      <div className="hidden sm:flex items-center gap-1 border-l border-r border-gray-200 dark:border-gray-700 px-2">
        {[1.0, 1.25, 1.5].map((rate) => (
          <button
            key={rate}
            onClick={() => updateSpeechRate(rate)}
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
              speechRate === rate
                ? "bg-[#0b57d0] text-white"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            {rate}x
          </button>
        ))}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-1.5">
        {isPaused ? (
          <button
            onClick={resume}
            className="p-1.5 bg-[#0b57d0] hover:bg-[#0842a0] text-white rounded-full transition-colors shadow-sm"
            title="Resume reading"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
          </button>
        ) : (
          <button
            onClick={pause}
            className="p-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-full transition-colors"
            title="Pause reading"
          >
            <Pause className="w-3.5 h-3.5 fill-current" />
          </button>
        )}

        <button
          onClick={stop}
          className="p-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-red-500 hover:text-white dark:hover:bg-red-600 text-gray-800 dark:text-gray-100 rounded-full transition-colors"
          title="Stop reading"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
        </button>

        <button
          onClick={toggleMute}
          className="p-1.5 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 rounded-full transition-colors"
          title={isMuted ? "Unmute assistant" : "Mute assistant"}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
