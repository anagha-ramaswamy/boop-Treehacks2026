import React from "react";
import { motion } from "framer-motion";

export default function BeepDuck({ variant = "default", size = "md", animate = false }) {
  const sizes = {
    xs: "w-8 h-8",
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-24 h-24",
    xl: "w-32 h-32",
  };

  const variants = {
    default: (
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
    ),
    camera: (
      <svg viewBox="0 0 120 120" className="w-full h-full">
        <ellipse cx="60" cy="72" rx="42" ry="35" fill="#FFE66D" />
        <circle cx="60" cy="38" r="26" fill="#FFE66D" />
        <circle cx="50" cy="33" r="4" fill="#2D3436" />
        <circle cx="51.5" cy="31.5" r="1.5" fill="white" />
        <circle cx="70" cy="33" r="4" fill="#2D3436" />
        <circle cx="71.5" cy="31.5" r="1.5" fill="white" />
        <ellipse cx="60" cy="44" rx="12" ry="6" fill="#FFB347" />
        <rect x="50" y="60" width="20" height="15" rx="3" fill="#A8D8EA" />
        <circle cx="60" cy="67" r="5" fill="#2D3436" opacity="0.3" />
        <rect x="68" y="62" width="4" height="4" fill="#FFE66D" />
      </svg>
    ),
    microphone: (
      <svg viewBox="0 0 120 120" className="w-full h-full">
        <ellipse cx="60" cy="72" rx="42" ry="35" fill="#FFE66D" />
        <circle cx="60" cy="38" r="26" fill="#FFE66D" />
        <circle cx="50" cy="33" r="4" fill="#2D3436" />
        <circle cx="51.5" cy="31.5" r="1.5" fill="white" />
        <circle cx="70" cy="33" r="4" fill="#2D3436" />
        <circle cx="71.5" cy="31.5" r="1.5" fill="white" />
        <ellipse cx="60" cy="44" rx="12" ry="6" fill="#FFB347" />
        <rect x="56" y="55" width="8" height="15" rx="4" fill="#A8D8EA" />
        <path d="M 58 70 Q 60 75 62 70" stroke="#A8D8EA" strokeWidth="2" fill="none" />
      </svg>
    ),
    chat: (
      <svg viewBox="0 0 120 120" className="w-full h-full">
        <ellipse cx="60" cy="72" rx="42" ry="35" fill="#FFE66D" />
        <circle cx="60" cy="38" r="26" fill="#FFE66D" />
        <circle cx="50" cy="33" r="4" fill="#2D3436" />
        <circle cx="51.5" cy="31.5" r="1.5" fill="white" />
        <circle cx="70" cy="33" r="4" fill="#2D3436" />
        <circle cx="71.5" cy="31.5" r="1.5" fill="white" />
        <path d="M 48 42 Q 60 48 72 42" stroke="#FFB347" strokeWidth="2" fill="none" />
        <circle cx="75" cy="55" r="8" fill="white" />
        <circle cx="77" cy="54" r="2" fill="#2D3436" />
        <circle cx="82" cy="56" r="1.5" fill="#2D3436" />
        <circle cx="86" cy="58" r="1" fill="#2D3436" />
      </svg>
    ),
    diary: (
      <svg viewBox="0 0 120 120" className="w-full h-full">
        <ellipse cx="60" cy="72" rx="42" ry="35" fill="#FFE66D" />
        <circle cx="60" cy="38" r="26" fill="#FFE66D" />
        <circle cx="50" cy="33" r="4" fill="#2D3436" />
        <circle cx="51.5" cy="31.5" r="1.5" fill="white" />
        <circle cx="70" cy="33" r="4" fill="#2D3436" />
        <circle cx="71.5" cy="31.5" r="1.5" fill="white" />
        <ellipse cx="60" cy="44" rx="12" ry="6" fill="#FFB347" />
        <rect x="48" y="58" width="24" height="20" rx="2" fill="#A8D8EA" />
        <line x1="52" y1="63" x2="68" y2="63" stroke="#2D3436" strokeWidth="1" opacity="0.3" />
        <line x1="52" y1="68" x2="68" y2="68" stroke="#2D3436" strokeWidth="1" opacity="0.3" />
        <line x1="52" y1="73" x2="64" y2="73" stroke="#2D3436" strokeWidth="1" opacity="0.3" />
      </svg>
    ),
    report: (
      <svg viewBox="0 0 120 120" className="w-full h-full">
        <ellipse cx="60" cy="72" rx="42" ry="35" fill="#FFE66D" />
        <circle cx="60" cy="38" r="26" fill="#FFE66D" />
        <circle cx="50" cy="33" r="4" fill="#2D3436" />
        <circle cx="51.5" cy="31.5" r="1.5" fill="white" />
        <circle cx="70" cy="33" r="4" fill="#2D3436" />
        <circle cx="71.5" cy="31.5" r="1.5" fill="white" />
        <ellipse cx="60" cy="44" rx="12" ry="6" fill="#FFB347" />
        <rect x="46" y="56" width="28" height="24" rx="2" fill="white" stroke="#A8D8EA" strokeWidth="2" />
        <line x1="50" y1="62" x2="70" y2="62" stroke="#A8D8EA" strokeWidth="1.5" />
        <line x1="50" y1="67" x2="70" y2="67" stroke="#A8D8EA" strokeWidth="1.5" />
        <line x1="50" y1="72" x2="65" y2="72" stroke="#A8D8EA" strokeWidth="1.5" />
      </svg>
    ),
  };

  const Component = animate ? motion.div : "div";
  const animationProps = animate ? {
    animate: { y: [0, -10, 0], rotate: [0, -3, 3, 0] },
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
  } : {};

  return (
    <Component className={sizes[size]} {...animationProps}>
      {variants[variant] || variants.default}
    </Component>
  );
}