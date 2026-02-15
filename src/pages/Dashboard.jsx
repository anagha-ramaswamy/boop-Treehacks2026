import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import BeepDuck from "@/components/boop/BeepDuck";
import BeepMessage from "@/components/boop/BeepMessage";
import LullabyButton from "@/components/boop/LullabyButton";
import { ChevronRight } from "lucide-react";

const FEATURES = [
  {
    title: "Baby Cry Decoder",
    description: "Understand your baby's cries",
    variant: "microphone",
    color: "#A8D8EA",
    to: "CryDecoder",
  },
  {
    title: "Diaper Diary",
    description: "Track & analyze diapers",
    variant: "diary",
    color: "#FFE66D",
    to: "DiaperDiary",
  },
  {
    title: "Baby Cam Monitor",
    description: "AI danger detection",
    variant: "camera",
    color: "#A8D8EA",
    to: "BabyCam",
  },
  {
    title: "Product Safety Check",
    description: "Scan EWG ratings instantly",
    variant: "default",
    color: "#FFB347",
    to: "ProductSafety",
  },
  {
    title: "Health Reports",
    description: "Clinical reports for doctors",
    variant: "report",
    color: "#FFE66D",
    to: "HealthReports",
  },
];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(user => {
      setUser(user);
      if (!user.onboarding_complete) {
        navigate(createPageUrl("Onboarding"));
      }
    }).catch(() => navigate(createPageUrl("Landing")));
  }, []);

  const babyName = user?.baby_name || "Baby";
  const babyAge = user?.baby_age_months || 0;

  return (
    <div className="px-5 py-6 max-w-lg mx-auto pb-24">
      {/* Daily Check-in - Baby Bottle Design */}
      <motion.div
        className="relative mb-6 cursor-pointer"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate(createPageUrl("VoiceSurvey"))}
      >
        <div className="relative">
          {/* Bottle Body */}
          <div className="bg-gradient-to-b from-white/90 to-[#A8D8EA]/30 rounded-[3rem] p-6 shadow-lg border-4 border-[#FFE66D]/40">
            {/* Bottle Nipple */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-8 bg-[#FFE66D] rounded-t-full border-4 border-[#FFE66D]/60" />
            
            <div className="text-center pt-4">
              <p className="text-2xl font-bold text-[#2D3436] mb-2">Daily Check-In</p>
              <p className="text-base text-[#2D3436]/70 mb-3">How is {babyName} feeling today?</p>
              <div className="flex items-center justify-center gap-2 text-[#A8D8EA]">
                <span className="text-sm font-semibold">Tap to start</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Measurement marks */}
            <div className="absolute right-4 top-16 space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className="w-6 h-0.5 bg-[#A8D8EA]/30" />
                  <span className="text-xs text-[#2D3436]/30">{4 - i}oz</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Lullaby Generator */}
      <div className="mb-6">
        <LullabyButton />
      </div>

      {/* Beep's Message */}
      <BeepMessage babyName={babyName} />

      {/* Greeting */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-[#2D3436] mb-1">Hi {user?.full_name?.split(' ')[0]}! 👋</h1>
        <p className="text-lg text-[#2D3436]/60">
          {babyName} is {babyAge} months old
        </p>
      </motion.div>

      {/* Features Grid */}
      <div className="grid grid-cols-2 gap-4">
        {FEATURES.map((feature, i) => (
          <motion.div
            key={feature.to}
            className="relative cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(createPageUrl(feature.to))}
          >
            <div
              className="rounded-3xl p-5 shadow-md relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${feature.color}40 0%, ${feature.color}20 100%)`,
                border: `3px solid ${feature.color}60`,
              }}
            >
              {/* Duck Icon */}
              <div className="flex justify-center mb-3">
                <BeepDuck variant={feature.variant} size="lg" />
              </div>

              {/* Text */}
              <h3 className="text-base font-bold text-[#2D3436] text-center mb-1">
                {feature.title}
              </h3>
              <p className="text-xs text-[#2D3436]/60 text-center leading-snug">
                {feature.description}
              </p>

              {/* Decorative circles */}
              <div
                className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-20"
                style={{ backgroundColor: feature.color }}
              />
              <div
                className="absolute -bottom-3 -left-3 w-12 h-12 rounded-full opacity-15"
                style={{ backgroundColor: feature.color }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}