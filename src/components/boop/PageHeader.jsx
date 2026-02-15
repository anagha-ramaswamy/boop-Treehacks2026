import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PageHeader({ title, subtitle, emoji, backTo = "Dashboard" }) {
  return (
    <motion.div 
      className="mb-6"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Link
        to={createPageUrl(backTo)}
        className="inline-flex items-center gap-2 text-sm font-medium text-[#2D3436]/50 hover:text-[#2D3436] transition-colors mb-3"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>
      <div className="flex items-center gap-3">
        {emoji && (
          <span className="text-3xl">{emoji}</span>
        )}
        <div>
          <h1 className="text-2xl font-bold text-[#2D3436]">{title}</h1>
          {subtitle && (
            <p className="text-sm text-[#2D3436]/50 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}