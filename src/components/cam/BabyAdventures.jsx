import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";


const DEMO_IMAGES = [
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6990f9c9e39e5510242c21a0/51bfbf3c8_images3.jpg",
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6990f9c9e39e5510242c21a0/e6526ae84_istockphoto-640147636-612x612.jpg",
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6990f9c9e39e5510242c21a0/61bcf7e1f_images2.jpg",
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6990f9c9e39e5510242c21a0/934910297_images1.jpg",
];

export default function BabyAdventures({ babyName, musicUrl }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const audioRef = useRef(null);

  // Auto-play music when it becomes available
  useEffect(() => {
    if (musicUrl && audioRef.current) {
      // Ensure the audio element is ready and play immediately
      audioRef.current.currentTime = 0;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    }
  }, [musicUrl]);

  useEffect(() => {
    if (!autoPlay) return;
    const interval = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % DEMO_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoPlay]);

  const next = () => setCurrentIndex((i) => (i + 1) % DEMO_IMAGES.length);
  const prev = () => setCurrentIndex((i) => (i - 1 + DEMO_IMAGES.length) % DEMO_IMAGES.length);

  return (
    <div className="space-y-4">
      {/* Title with nostalgic vibe */}
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold text-[#2D3436] mb-2">
          {babyName}'s Precious Moments 🎞️
        </h3>
        <p className="text-sm text-[#2D3436]/50 italic">A nostalgic journey through time</p>
      </div>

      {/* Vintage Film Frame Slideshow */}
      <div className="relative">
        {/* Film strip holes on sides */}
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-[#2D3436] z-10 flex flex-col justify-around py-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="w-4 h-4 bg-[#FFF8E7] rounded-sm mx-auto" />
          ))}
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-[#2D3436] z-10 flex flex-col justify-around py-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="w-4 h-4 bg-[#FFF8E7] rounded-sm mx-auto" />
          ))}
        </div>

        {/* Main slideshow */}
        <div className="mx-6 bg-[#2D3436] p-4 rounded-lg shadow-2xl">
          <div className="relative aspect-[4/3] rounded overflow-hidden bg-black">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentIndex}
                src={DEMO_IMAGES[currentIndex]}
                alt="Baby moment"
                className="w-full h-full object-cover sepia-[0.3] contrast-[1.1]"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.8 }}
              />
            </AnimatePresence>

            {/* Vintage overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none" />

            {/* Navigation */}
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-[#2D3436]" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-[#2D3436]" />
            </button>

            {/* Counter */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/70 backdrop-blur-sm text-white text-sm font-semibold">
              {currentIndex + 1} / {DEMO_IMAGES.length}
            </div>
          </div>

          {/* Film caption area */}
          <div className="mt-3 text-center">
            <p className="text-white font-bold text-sm">
              Memory #{currentIndex + 1}
            </p>
          </div>
        </div>
      </div>

      {/* Audio player (hidden) */}
      {musicUrl && (
        <audio 
          ref={audioRef} 
          src={musicUrl} 
          loop
          autoPlay
          preload="auto"
        />
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setAutoPlay(!autoPlay)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            autoPlay ? "bg-[#A8D8EA] text-white" : "bg-[#A8D8EA]/20 text-[#A8D8EA]"
          }`}
        >
          {autoPlay ? "⏸️ Pause Slides" : "▶️ Play Slides"}
        </button>
      </div>

      {/* Info */}
      <div className="bg-[#FFE66D]/10 rounded-2xl p-4 text-center">
        <p className="text-sm text-[#2D3436]/70 leading-relaxed">
          💛 These precious moments are captured from your baby monitor. 
          <br />
          <span className="text-xs italic">AI-powered music auto-generates based on the mood and vibes of {babyName}'s photos.</span>
        </p>
      </div>
    </div>
  );
}