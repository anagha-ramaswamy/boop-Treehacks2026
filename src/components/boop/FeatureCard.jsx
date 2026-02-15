import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronRight } from "lucide-react";

export default function FeatureCard({ title, description, icon, emoji, color, bgColor, to, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link to={createPageUrl(to)} className="block">
        <div
          className="relative overflow-hidden rounded-3xl p-5 shadow-sm border border-white/50 backdrop-blur-sm transition-shadow hover:shadow-lg"
          style={{ backgroundColor: bgColor }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-3 shadow-sm"
                style={{ backgroundColor: color + "30" }}
              >
                {emoji}
              </div>
              <h3 className="font-bold text-[#2D3436] text-lg leading-tight">{title}</h3>
              <p className="text-sm text-[#2D3436]/60 mt-1 leading-relaxed">{description}</p>
            </div>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center mt-1 flex-shrink-0"
              style={{ backgroundColor: color + "20" }}
            >
              <ChevronRight className="w-4 h-4" style={{ color }} />
            </div>
          </div>
          
          {/* Decorative circle */}
          <div
            className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-10"
            style={{ backgroundColor: color }}
          />
        </div>
      </Link>
    </motion.div>
  );
}