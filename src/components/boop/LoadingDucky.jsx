import React from "react";
import { motion } from "framer-motion";

export default function LoadingDucky({ message = "Loading...", size = "md" }) {
  const sizes = { sm: "w-12 h-12", md: "w-20 h-20", lg: "w-32 h-32" };

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <motion.div
        className={`${sizes[size]} relative`}
        animate={{ 
          y: [0, -15, 0],
          rotate: [0, -5, 5, 0]
        }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg viewBox="0 0 120 120" className="w-full h-full">
          <ellipse cx="60" cy="72" rx="42" ry="35" fill="#FFE66D" />
          <circle cx="60" cy="38" r="26" fill="#FFE66D" />
          <circle cx="50" cy="33" r="4" fill="#2D3436" />
          <circle cx="51.5" cy="31.5" r="1.5" fill="white" />
          <circle cx="70" cy="33" r="4" fill="#2D3436" />
          <circle cx="71.5" cy="31.5" r="1.5" fill="white" />
          <ellipse cx="60" cy="44" rx="12" ry="6" fill="#FFB347" />
          <ellipse cx="42" cy="42" rx="6" ry="4" fill="#FFDAB9" opacity="0.6" />
          <ellipse cx="78" cy="42" rx="6" ry="4" fill="#FFDAB9" opacity="0.6" />
          <ellipse cx="26" cy="70" rx="14" ry="20" fill="#FFD93D" transform="rotate(-15 26 70)" />
          <ellipse cx="94" cy="70" rx="14" ry="20" fill="#FFD93D" transform="rotate(15 94 70)" />
        </svg>
      </motion.div>
      
      <motion.div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-[#FFB347]"
            animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </motion.div>
      
      <p className="text-sm font-medium text-[#2D3436]/60">{message}</p>
    </div>
  );
}