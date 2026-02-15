import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import DuckyLogo from "@/components/boop/DuckyLogo";
import { ChevronRight, Baby, Heart, Stethoscope } from "lucide-react";

const STEPS = [
  { title: "About You", subtitle: "Let's get to know you", icon: Heart, emoji: "👋" },
  { title: "About Baby", subtitle: "Tell us about your little one", icon: Baby, emoji: "🍼" },
  { title: "Pediatrician", subtitle: "Optional - for health reports", icon: Stethoscope, emoji: "🏥" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    parent_age: "",
    baby_name: "",
    baby_age_months: "",
    baby_birth_date: "",
    pediatrician_name: "",
    pediatrician_contact: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u.onboarding_complete) {
        navigate(createPageUrl("Dashboard"));
      }
    }).catch(() => navigate(createPageUrl("Landing")));
  }, []);

  const handleNext = async () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      setSaving(true);
      await base44.auth.updateMe({
        ...form,
        parent_age: parseInt(form.parent_age) || null,
        baby_age_months: parseInt(form.baby_age_months) || null,
        onboarding_complete: true,
      });
      navigate(createPageUrl("Dashboard"));
    }
  };

  const update = (key, value) => setForm({ ...form, [key]: value });

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FFF8E7] flex items-center justify-center">
        <DuckyLogo size="md" animate />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8E7] flex flex-col px-6 py-8">
      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
              i <= step ? "bg-[#FFB347]" : "bg-[#FFE66D]/40"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3 }}
          className="flex-1"
        >
          <div className="mb-8">
            <span className="text-4xl mb-2 block">{STEPS[step].emoji}</span>
            <h2 className="text-2xl font-bold text-[#2D3436]">{STEPS[step].title}</h2>
            <p className="text-[#2D3436]/50 mt-1">{STEPS[step].subtitle}</p>
          </div>

          <div className="space-y-5">
            {step === 0 && (
              <>
                <div>
                  <Label className="text-[#2D3436]/70 font-semibold text-sm mb-2 block">
                    Your Name
                  </Label>
                  <Input
                    value={user.full_name || ""}
                    disabled
                    className="bg-white/60 border-[#FFE66D]/50 rounded-xl h-12 text-base"
                  />
                  <p className="text-xs text-[#2D3436]/40 mt-1">From your account</p>
                </div>
                <div>
                  <Label className="text-[#2D3436]/70 font-semibold text-sm mb-2 block">
                    Your Age
                  </Label>
                  <Input
                    type="number"
                    placeholder="e.g. 28"
                    value={form.parent_age}
                    onChange={e => update("parent_age", e.target.value)}
                    className="bg-white border-[#FFE66D]/50 rounded-xl h-12 text-base"
                  />
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div>
                  <Label className="text-[#2D3436]/70 font-semibold text-sm mb-2 block">
                    Baby's Name
                  </Label>
                  <Input
                    placeholder="What's their name?"
                    value={form.baby_name}
                    onChange={e => update("baby_name", e.target.value)}
                    className="bg-white border-[#FFE66D]/50 rounded-xl h-12 text-base"
                  />
                </div>
                <div>
                  <Label className="text-[#2D3436]/70 font-semibold text-sm mb-2 block">
                    Baby's Birth Date
                  </Label>
                  <Input
                    type="date"
                    value={form.baby_birth_date}
                    onChange={e => update("baby_birth_date", e.target.value)}
                    className="bg-white border-[#FFE66D]/50 rounded-xl h-12 text-base"
                  />
                </div>
                <div>
                  <Label className="text-[#2D3436]/70 font-semibold text-sm mb-2 block">
                    Age in Months
                  </Label>
                  <Input
                    type="number"
                    placeholder="e.g. 3"
                    value={form.baby_age_months}
                    onChange={e => update("baby_age_months", e.target.value)}
                    className="bg-white border-[#FFE66D]/50 rounded-xl h-12 text-base"
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <Label className="text-[#2D3436]/70 font-semibold text-sm mb-2 block">
                    Pediatrician's Name
                  </Label>
                  <Input
                    placeholder="Dr. Smith (optional)"
                    value={form.pediatrician_name}
                    onChange={e => update("pediatrician_name", e.target.value)}
                    className="bg-white border-[#FFE66D]/50 rounded-xl h-12 text-base"
                  />
                </div>
                <div>
                  <Label className="text-[#2D3436]/70 font-semibold text-sm mb-2 block">
                    Contact Info
                  </Label>
                  <Input
                    placeholder="Phone or email (optional)"
                    value={form.pediatrician_contact}
                    onChange={e => update("pediatrician_contact", e.target.value)}
                    className="bg-white border-[#FFE66D]/50 rounded-xl h-12 text-base"
                  />
                </div>
                <p className="text-xs text-[#2D3436]/40 bg-[#4ECDC4]/10 p-3 rounded-xl">
                  💡 This info helps generate health reports you can share with your pediatrician.
                </p>
              </>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <motion.div className="pt-8">
        <Button
          className="w-full h-14 rounded-2xl bg-[#FFB347] hover:bg-[#FFA030] text-white font-bold text-base shadow-lg shadow-[#FFB347]/30"
          onClick={handleNext}
          disabled={saving}
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                🐥
              </motion.span>
              Setting up...
            </span>
          ) : step < 2 ? (
            <span className="flex items-center gap-2">
              Continue <ChevronRight className="w-5 h-5" />
            </span>
          ) : (
            "Let's Go! 🎉"
          )}
        </Button>
        {step > 0 && (
          <button
            className="w-full mt-3 text-sm text-[#2D3436]/40 font-medium"
            onClick={() => setStep(step - 1)}
          >
            Go back
          </button>
        )}
      </motion.div>
    </div>
  );
}