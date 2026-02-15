import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import BeepDuck from "./BeepDuck";

const MOTIVATIONAL_MESSAGES = [
  "You're doing an amazing job! Every moment with your little one is precious.",
  "Remember, there's no perfect parent - just the perfect parent for your baby!",
  "Take it one day at a time. You've got this!",
  "Your love and care make all the difference in your baby's world.",
  "Being a parent is tough, but you're tougher. I'm proud of you!",
  "Every sleepless night and every smile makes you stronger.",
  "Trust your instincts - you know your baby best!",
];

export default function BeepMessage({ babyName }) {
  const navigate = useNavigate();
  const message = MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];

  return (
    <motion.div
      className="bg-gradient-to-br from-[#FFE66D]/20 to-[#A8D8EA]/20 rounded-3xl p-5 mb-6 shadow-sm border-2 border-[#FFE66D]/30 cursor-pointer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(createPageUrl("AiAssistant"))}
    >
      <div className="flex items-start gap-4">
        <BeepDuck variant="chat" size="md" animate />
        <div className="flex-1">
          <p className="text-lg font-semibold text-[#2D3436] mb-1">Hi there! 👋</p>
          <p className="text-base text-[#2D3436]/80 leading-relaxed mb-3">{message}</p>
          <p className="text-sm text-[#A8D8EA] font-semibold italic">
            Chat with me about your concerns - I'm here for you! 💙
          </p>
        </div>
      </div>
    </motion.div>
  );
}