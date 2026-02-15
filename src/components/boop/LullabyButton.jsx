import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Music, Loader2, Square } from "lucide-react";

const MOOD_OPTIONS = [
  { label: "Sleepy", value: "sleepy", emoji: "😴" },
  { label: "Fussy", value: "fussy", emoji: "😣" },
  { label: "Happy", value: "happy", emoji: "😊" },
  { label: "Restless", value: "restless", emoji: "🤔" },
  { label: "Peaceful", value: "peaceful", emoji: "😌" },
];

export default function LullabyButton() {
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);
  const audioRef = useRef(null);

  const handleMoodSelect = async (mood) => {
    setSelectedMood(mood);
    setGenerating(true);
    
    try {
      const response = await base44.functions.invoke('generateLullaby', { mood });
      const audioUrl = response.data.audio_url;
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Failed to generate lullaby:', error);
      setIsPlaying(false);
    } finally {
      setGenerating(false);
      setShowMoodSelector(false);
    }
  };

  const stopLullaby = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setSelectedMood(null);
  };

  return (
    <div className="relative">
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />
      
      {/* Main Button */}
      <motion.button
        onClick={() => {
          if (isPlaying) {
            stopLullaby();
          } else {
            setShowMoodSelector(!showMoodSelector);
          }
        }}
        className="w-full relative group"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="relative h-32 bg-gradient-to-br from-[#A8D8EA]/30 to-[#FFE66D]/30 rounded-3xl border-2 border-[#A8D8EA]/50 overflow-hidden">
          {/* Animated background glow */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-[#FFE66D] to-[#A8D8EA] opacity-0"
            animate={isPlaying ? { opacity: [0.1, 0.2, 0.1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Sleeping Duck SVG */}
          <div className="absolute left-6 top-1/2 transform -translate-y-1/2">
            <motion.svg
              viewBox="0 0 120 120"
              className="w-24 h-24"
              animate={isPlaying ? { rotate: [0, -5, 5, 0] } : {}}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {/* Body */}
              <ellipse cx="60" cy="72" rx="42" ry="35" fill="#FFE66D" />
              {/* Head */}
              <circle cx="60" cy="38" r="26" fill="#FFE66D" />
              {/* Closed Eyes (sleeping) */}
              <path d="M 48 33 Q 50 35 52 33" stroke="#2D3436" strokeWidth="2" fill="none" />
              <path d="M 68 33 Q 70 35 72 33" stroke="#2D3436" strokeWidth="2" fill="none" />
              {/* Beak */}
              <ellipse cx="60" cy="44" rx="12" ry="6" fill="#FFB347" />
              {/* Wings */}
              <ellipse cx="26" cy="70" rx="14" ry="20" fill="#FFD93D" transform="rotate(-15 26 70)" />
              <ellipse cx="94" cy="70" rx="14" ry="20" fill="#FFD93D" transform="rotate(15 94 70)" />
              {/* Blush marks */}
              <circle cx="42" cy="50" r="5" fill="#FFDAB9" opacity="0.7" />
              <circle cx="78" cy="50" r="5" fill="#FFDAB9" opacity="0.7" />
            </motion.svg>
          </div>

          {/* Text and Controls */}
          <div className="absolute right-6 top-1/2 transform -translate-y-1/2 text-right">
            {generating ? (
              <div className="flex items-center gap-2 justify-end">
                <Loader2 className="w-5 h-5 text-[#A8D8EA] animate-spin" />
                <p className="text-sm font-bold text-[#2D3436]">Creating...</p>
              </div>
            ) : isPlaying ? (
              <div>
                <div className="flex items-center justify-end gap-2 mb-1">
                  <motion.div
                    className="flex gap-1"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1 h-4 bg-[#FFE66D] rounded-full"
                        animate={{ scaleY: [1, 3, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                      />
                    ))}
                  </motion.div>
                  <Square className="w-4 h-4 text-[#FF6B6B]" />
                </div>
                <p className="text-sm font-bold text-[#2D3436]">🎵 Lullaby</p>
                <p className="text-xs text-[#2D3436]/60">Click to stop</p>
              </div>
            ) : (
              <div>
                <Music className="w-6 h-6 text-[#A8D8EA] mx-auto mb-1" />
                <p className="text-sm font-bold text-[#2D3436]">Lullaby</p>
                <p className="text-xs text-[#2D3436]/60">Pick a mood</p>
              </div>
            )}
          </div>
        </div>
      </motion.button>

      {/* Mood Selector Modal */}
      {showMoodSelector && !generating && !isPlaying && (
        <motion.div
          className="absolute bottom-full mb-3 left-0 right-0 bg-white rounded-2xl shadow-lg p-4 z-50"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm font-bold text-[#2D3436] mb-3">Pick baby's mood:</p>
          <div className="grid grid-cols-2 gap-2">
            {MOOD_OPTIONS.map((mood) => (
              <motion.button
                key={mood.value}
                onClick={() => handleMoodSelect(mood.value)}
                className="p-2 rounded-xl bg-[#FFF8E7] border-2 border-[#FFE66D] hover:bg-[#FFE66D]/20 transition-all"
                whileTap={{ scale: 0.95 }}
              >
                <div className="text-lg mb-1">{mood.emoji}</div>
                <p className="text-xs font-semibold text-[#2D3436]">{mood.label}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Close selector on background click */}
      {showMoodSelector && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMoodSelector(false)}
        />
      )}
    </div>
  );
}