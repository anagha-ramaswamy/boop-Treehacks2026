import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import DuckyLogo from "@/components/boop/DuckyLogo";

export default function Landing() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.isAuthenticated().then(authed => {
      if (authed) {
        base44.auth.me().then(user => {
          setUser(user);
          if (user.onboarding_complete) {
            navigate(createPageUrl("Dashboard"));
          } else {
            navigate(createPageUrl("Onboarding"));
          }
        }).catch(() => setChecking(false));
      } else {
        setChecking(false);
      }
    });
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#FFF8E7] flex items-center justify-center">
        <DuckyLogo size="lg" animate />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8E7] flex flex-col items-center justify-between px-6 py-12 overflow-hidden relative">
      {/* Floating bubbles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 40 + Math.random() * 80,
              height: 40 + Math.random() * 80,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: ["#FFE66D", "#FFB347", "#4ECDC4", "#FFDAB9"][i % 4],
              opacity: 0.12,
            }}
            animate={{
              y: [0, -20, 0],
              x: [0, 10, -10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      {/* Top section */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <DuckyLogo size="xl" animate />
        
        <motion.div
          className="text-center mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-xl font-bold text-[#2D3436] mb-2">
            Hi {user?.full_name?.split(' ')[0] || "there"}! 👋
          </p>
          <p className="text-[#2D3436]/60 max-w-xs text-base leading-relaxed">
            Your AI-powered baby monitoring companion. Understanding your little one, one boop at a time.
          </p>
        </motion.div>
      </div>

      {/* Bottom CTA */}
      <motion.div
        className="w-full max-w-sm space-y-4 relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <motion.button
          className="w-full py-4 rounded-2xl bg-[#FFE66D] text-[#2D3436] font-bold text-lg shadow-lg shadow-[#FFE66D]/30 flex items-center justify-center gap-3"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => base44.auth.redirectToLogin(createPageUrl("Onboarding"))}
        >
          <span>🐥</span>
          Get Started
        </motion.button>

        <p className="text-center text-xs text-[#2D3436]/40">
          Already have an account?{" "}
          <button
            className="text-[#FFB347] font-semibold underline underline-offset-2"
            onClick={() => base44.auth.redirectToLogin(createPageUrl("Dashboard"))}
          >
            Sign in
          </button>
        </p>

        <div className="pt-6 flex items-center justify-center gap-6 opacity-40">
          <span className="text-[10px] font-medium text-[#2D3436] uppercase tracking-wider">Built for</span>
          <span className="text-xs font-bold text-[#2D3436]">TreeHacks 2026</span>
        </div>
      </motion.div>
    </div>
  );
}