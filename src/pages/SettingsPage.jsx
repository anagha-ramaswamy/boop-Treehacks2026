import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PageHeader from "@/components/boop/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LogOut, Save, Baby, Stethoscope, Bug } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setForm({
        baby_name: u.baby_name || "",
        baby_age_months: u.baby_age_months || "",
        baby_birth_date: u.baby_birth_date || "",
        parent_age: u.parent_age || "",
        pediatrician_name: u.pediatrician_name || "",
        pediatrician_contact: u.pediatrician_contact || "",
        debug_mode: u.debug_mode || false,
      });
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe({
      ...form,
      parent_age: parseInt(form.parent_age) || null,
      baby_age_months: parseInt(form.baby_age_months) || null,
    });
    setSaving(false);
    toast.success("Settings saved!");
  };

  const handleLogout = () => {
    base44.auth.logout(createPageUrl("Landing"));
  };

  if (!user) return null;

  return (
    <div className="px-5 py-6 max-w-lg mx-auto">
      <PageHeader title="Settings" subtitle="Manage your profile" emoji="⚙️" />

      <div className="space-y-6">
        {/* Baby Info */}
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <h3 className="font-bold text-[#2D3436] mb-4 flex items-center gap-2">
            <Baby className="w-4 h-4 text-[#FFB347]" />
            Baby Information
          </h3>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-[#2D3436]/50 mb-1 block">Baby's Name</Label>
              <Input
                value={form.baby_name}
                onChange={e => setForm({ ...form, baby_name: e.target.value })}
                className="rounded-xl h-11"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-[#2D3436]/50 mb-1 block">Age (months)</Label>
                <Input
                  type="number"
                  value={form.baby_age_months}
                  onChange={e => setForm({ ...form, baby_age_months: e.target.value })}
                  className="rounded-xl h-11"
                />
              </div>
              <div>
                <Label className="text-xs text-[#2D3436]/50 mb-1 block">Birth Date</Label>
                <Input
                  type="date"
                  value={form.baby_birth_date}
                  onChange={e => setForm({ ...form, baby_birth_date: e.target.value })}
                  className="rounded-xl h-11"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pediatrician */}
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <h3 className="font-bold text-[#2D3436] mb-4 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-[#4ECDC4]" />
            Pediatrician
          </h3>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-[#2D3436]/50 mb-1 block">Name</Label>
              <Input
                value={form.pediatrician_name}
                onChange={e => setForm({ ...form, pediatrician_name: e.target.value })}
                className="rounded-xl h-11"
                placeholder="Dr. Smith"
              />
            </div>
            <div>
              <Label className="text-xs text-[#2D3436]/50 mb-1 block">Contact</Label>
              <Input
                value={form.pediatrician_contact}
                onChange={e => setForm({ ...form, pediatrician_contact: e.target.value })}
                className="rounded-xl h-11"
                placeholder="Phone or email"
              />
            </div>
          </div>
        </div>

        {/* Debug Mode */}
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bug className="w-4 h-4 text-[#A29BFE]" />
              <div>
                <h3 className="font-bold text-[#2D3436] text-sm">Demo Mode</h3>
                <p className="text-xs text-[#2D3436]/40">Show debug panel & reasoning traces</p>
              </div>
            </div>
            <Switch
              checked={form.debug_mode}
              onCheckedChange={v => setForm({ ...form, debug_mode: v })}
            />
          </div>
        </div>

        {/* Save */}
        <Button
          className="w-full h-12 rounded-2xl bg-[#FFB347] hover:bg-[#FFA030] text-white font-bold shadow-md"
          onClick={handleSave}
          disabled={saving}
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>

        {/* Logout */}
        <button
          className="w-full py-3 text-sm font-semibold text-[#FF6B6B] flex items-center justify-center gap-2"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>

        {/* Info */}
        <div className="text-center pb-4">
          <p className="text-[10px] text-[#2D3436]/30">
            boop v1.0 · Built for TreeHacks 2026 🌲
          </p>
        </div>
      </div>
    </div>
  );
}