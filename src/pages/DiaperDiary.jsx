import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/boop/PageHeader";
import LoadingDucky from "@/components/boop/LoadingDucky";
import DiaperCalendar from "@/components/diaper/DiaperCalendar";
import { Camera, Upload, X, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const CLASSIFICATION_STYLES = {
  normal: { color: "#22C55E", bg: "#F0FFF4", icon: CheckCircle, label: "Normal", emoji: "✅" },
  concerning: { color: "#EAB308", bg: "#FFFBEB", icon: AlertTriangle, label: "Concerning", emoji: "⚠️" },
  alert: { color: "#EF4444", bg: "#FEF2F2", icon: AlertCircle, label: "Alert", emoji: "🚨" },
};

export default function DiaperDiary() {
  const [user, setUser] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [notes, setNotes] = useState("");
  const [tab, setTab] = useState("capture");
  const fileRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const { data: diaperLogs = [], isLoading } = useQuery({
    queryKey: ["diaperLogs"],
    queryFn: () => base44.entities.DiaperLog.list("-created_date", 100),
  });

  const createLog = useMutation({
    mutationFn: (data) => base44.entities.DiaperLog.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diaperLogs"] });
      setPhoto(null);
      setPhotoPreview(null);
      setResult(null);
      setNotes("");
    },
  });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setResult(null);
  };

  const analyzePhoto = async () => {
    if (!photo) return;
    setAnalyzing(true);

    // Upload photo
    const { file_url } = await base44.integrations.Core.UploadFile({ file: photo });

    // Use InvokeLLM with vision
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this diaper image. Classify stool as: Normal (formed, yellow/brown), Concerning (green, mucus, very hard/loose), Alert (blood, black tar, white/clay-colored). Also check for any diaper rash. Provide confidence score 0-100 and brief clinical note.`,
      response_json_schema: {
        type: "object",
        properties: {
          classification: { type: "string", enum: ["normal", "concerning", "alert"] },
          confidence: { type: "number" },
          clinical_note: { type: "string" },
          rash_detected: { type: "boolean" },
          rash_severity: { type: "string", enum: ["none", "mild", "moderate", "severe"] },
        },
      },
      file_urls: [file_url],
    });

    setResult({ ...analysis, photo_url: file_url });
    setAnalyzing(false);
  };

  const saveEntry = async () => {
    if (!result) return;
    await createLog.mutateAsync({
      photo_url: result.photo_url,
      classification: result.classification,
      severity: result.rash_severity === "severe" ? "high" : result.rash_severity === "moderate" ? "medium" : "low",
      confidence: result.confidence,
      clinical_note: result.clinical_note,
      rash_detected: result.rash_detected,
      rash_severity: result.rash_severity,
      notes,
      timestamp: new Date().toISOString(),
    });
  };

  const babyName = user?.baby_name || "Baby";

  return (
    <div className="px-5 py-6 max-w-lg mx-auto">
      <PageHeader title="Diaper Diary" subtitle={`Tracking ${babyName}'s health`} emoji="📅" />

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {["capture", "calendar"].map(t => (
          <button
            key={t}
            className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
              tab === t ? "bg-[#4ECDC4] text-white shadow-sm" : "bg-white/60 text-[#2D3436]/50"
            }`}
            onClick={() => setTab(t)}
          >
            {t === "capture" ? "📸 Capture" : "📅 Calendar"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "calendar" ? (
          <motion.div key="cal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <DiaperCalendar logs={diaperLogs} isLoading={isLoading} />
          </motion.div>
        ) : (
          <motion.div key="capture" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Upload Area */}
            {!photoPreview ? (
              <motion.div
                className="border-2 border-dashed border-[#4ECDC4]/40 rounded-3xl p-12 text-center bg-white/40 cursor-pointer"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Camera className="w-12 h-12 text-[#4ECDC4]/50 mx-auto mb-3" />
                <p className="font-semibold text-[#2D3436]">Take or Upload Photo</p>
                <p className="text-sm text-[#2D3436]/40 mt-1">Tap to use camera or choose from gallery</p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {/* Preview */}
                <div className="relative rounded-3xl overflow-hidden shadow-sm">
                  <img src={photoPreview} alt="Preview" className="w-full h-64 object-cover" />
                  <button
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center"
                    onClick={() => { setPhotoPreview(null); setPhoto(null); setResult(null); }}
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* Analyze Button */}
                {!result && !analyzing && (
                  <motion.button
                    className="w-full py-4 rounded-2xl bg-[#4ECDC4] text-white font-bold text-base shadow-lg shadow-[#4ECDC4]/30"
                    whileTap={{ scale: 0.98 }}
                    onClick={analyzePhoto}
                  >
                    🔍 Analyze with AI
                  </motion.button>
                )}

                {analyzing && <LoadingDucky message="Analyzing diaper..." size="sm" />}

                {/* Result */}
                {result && (
                  <motion.div
                    className="rounded-3xl p-5 shadow-sm"
                    style={{ backgroundColor: CLASSIFICATION_STYLES[result.classification]?.bg }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{CLASSIFICATION_STYLES[result.classification]?.emoji}</span>
                      <div>
                        <h3 className="font-bold text-lg text-[#2D3436]">
                          {CLASSIFICATION_STYLES[result.classification]?.label}
                        </h3>
                        <p className="text-sm text-[#2D3436]/50">{result.confidence}% confidence</p>
                      </div>
                    </div>
                    <p className="text-sm text-[#2D3436]/70 bg-white/60 rounded-xl p-3">
                      {result.clinical_note}
                    </p>
                    {result.rash_detected && (
                      <div className="mt-3 p-3 bg-[#FFB347]/10 rounded-xl border border-[#FFB347]/20">
                        <p className="text-sm font-semibold text-[#FFB347]">
                          ⚠️ Rash Detected: {result.rash_severity}
                        </p>
                      </div>
                    )}

                    <Textarea
                      placeholder="Add your notes..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="mt-4 rounded-xl border-white/50 bg-white/60 text-sm"
                    />

                    <button
                      className="w-full mt-4 py-3.5 rounded-2xl bg-[#4ECDC4] text-white font-bold shadow-md"
                      onClick={saveEntry}
                      disabled={createLog.isPending}
                    >
                      {createLog.isPending ? "Saving..." : "💾 Save Entry"}
                    </button>
                  </motion.div>
                )}
              </div>
            )}

            {/* Recent Entries */}
            {diaperLogs.length > 0 && !photoPreview && (
              <div className="mt-8">
                <h3 className="font-bold text-[#2D3436] mb-3">Recent Entries</h3>
                <div className="space-y-2">
                  {diaperLogs.slice(0, 5).map(log => {
                    const style = CLASSIFICATION_STYLES[log.classification] || CLASSIFICATION_STYLES.normal;
                    return (
                      <div key={log.id} className="flex items-center gap-3 p-3 bg-white/60 rounded-2xl">
                        <span className="text-xl">{style.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#2D3436]">{style.label}</p>
                          <p className="text-xs text-[#2D3436]/40 truncate">
                            {new Date(log.created_date).toLocaleString()} · {log.confidence}%
                          </p>
                        </div>
                        {log.rash_detected && <span className="text-xs">🩹</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}