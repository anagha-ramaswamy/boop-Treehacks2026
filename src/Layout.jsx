import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Home, Mic, Camera, MessageCircle, FileText, Settings, LogOut, Baby, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { name: "Dashboard", icon: Home, page: "Dashboard" },
  { name: "Cam", icon: Camera, page: "BabyCam" },
  { name: "Cry", icon: Mic, page: "CryDecoder" },
  { name: "Diaper", icon: Baby, page: "DiaperDiary" },
  { name: "Safety", icon: Shield, page: "ProductSafety" },
  { name: "Reports", icon: FileText, page: "HealthReports" },
  { name: "Chat", icon: MessageCircle, page: "AiAssistant" },
];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

  const publicPages = ["Landing"];
  const isPublic = publicPages.includes(currentPageName);

  if (isPublic) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#FFF8E7] flex flex-col">
      <style>{`
        :root {
          --boop-yellow: #FFE66D;
          --boop-cream: #FFF8E7;
          --boop-orange: #FFB347;
        }
      `}</style>
      
      {/* Main Content */}
      <main className="flex-1 pb-24 safe-area-top">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPageName}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-[#FFE66D]/30 safe-area-bottom z-50">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = currentPageName === item.page;
            const Icon = item.icon;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all relative"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -top-1 w-8 h-1 rounded-full bg-[#FFB347]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <div className={`p-1.5 rounded-xl transition-all ${
                  isActive ? "bg-[#FFE66D]/30" : ""
                }`}>
                  <Icon className={`w-5 h-5 transition-colors ${
                    isActive ? "text-[#FFB347]" : "text-[#2D3436]/40"
                  }`} />
                </div>
                <span className={`text-[10px] font-semibold transition-colors ${
                  isActive ? "text-[#FFB347]" : "text-[#2D3436]/40"
                }`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all hover:bg-red-50"
          >
            <div className="p-1.5 rounded-xl">
              <LogOut className="w-5 h-5 text-[#2D3436]/40 hover:text-red-600 transition-colors" />
            </div>
            <span className="text-[10px] font-semibold text-[#2D3436]/40">Logout</span>
          </button>
        </div>
      </nav>
    </div>
  );
}