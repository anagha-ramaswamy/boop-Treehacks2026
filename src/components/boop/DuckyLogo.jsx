import React from "react";
import { motion } from "framer-motion";

export default function DuckyLogo({ size = "md", animate = true, className = "" }) {
  const sizes = {
    xs: "w-8 h-8",
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-32 h-32",
    xl: "w-48 h-48"
  };

  const textSizes = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-xl",
    lg: "text-3xl",
    xl: "text-5xl"
  };

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <motion.div
        className={`${sizes[size]} relative`}
        animate={animate ? { y: [0, -8, 0] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg viewBox="0 0 120 120" className="w-full h-full">
          {/* Body */}
          <ellipse cx="60" cy="72" rx="42" ry="35" fill="#FFE66D" />
          {/* Head */}
          <circle cx="60" cy="38" r="26" fill="#FFE66D" />
          {/* Eye left */}
          <circle cx="50" cy="33" r="4" fill="#2D3436" />
          <circle cx="51.5" cy="31.5" r="1.5" fill="white" />
          {/* Eye right */}
          <circle cx="70" cy="33" r="4" fill="#2D3436" />
          <circle cx="71.5" cy="31.5" r="1.5" fill="white" />
          {/* Beak */}
          <ellipse cx="60" cy="44" rx="12" ry="6" fill="#FFB347" />
          {/* Blush left */}
          <ellipse cx="42" cy="42" rx="6" ry="4" fill="#FFDAB9" opacity="0.6" />
          {/* Blush right */}
          <ellipse cx="78" cy="42" rx="6" ry="4" fill="#FFDAB9" opacity="0.6" />
          {/* Wing left */}
          <ellipse cx="26" cy="70" rx="14" ry="20" fill="#FFD93D" transform="rotate(-15 26 70)" />
          {/* Wing right */}
          <ellipse cx="94" cy="70" rx="14" ry="20" fill="#FFD93D" transform="rotate(15 94 70)" />
          {/* Belly highlight */}
          <ellipse cx="58" cy="75" rx="22" ry="18" fill="#FFF3B0" opacity="0.5" />
        </svg>
      </motion.div>
      <motion.div
        className="flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <span className={`font-bold text-[#2D3436] ${textSizes[size]} tracking-tight`}>
          boop
        </span>
        {(size === "lg" || size === "xl") && (
          <span className="text-sm font-medium text-[#FFB347] tracking-widest uppercase">
            Speak Baby
          </span>
        )}
      </motion.div>
    </div>
  );
}