import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/boop/PageHeader";
import LoadingDucky from "@/components/boop/LoadingDucky";
import CryAnalytics from "@/components/cry/CryAnalytics";
import { Mic, Square, Clock, AlertCircle } from "lucide-react";

const CLASSIFICATIONS = {
  hunger: { emoji: "🍼", label: "Hungry", color: "#FFB347", bg: "#FFF8EE" },
  tired: { emoji: "😴", label: "Tired", color: "#A29BFE", bg: "#F5F3FF" },
  discomfort: { emoji: "😣", label: "Discomfort", color: "#FF6B6B", bg: "#FFF0F0" },
  pain: { emoji: "😭", label: "Pain", color: "#E74C3C", bg: "#FDEDEC" },
  needs_changing: { emoji: "🧷", label: "Needs Changing", color: "#4ECDC4", bg: "#F0FFFE" },
  unknown: { emoji: "❓", label: "Analyzing...", color: "#636E72", bg: "#F5F5F5" },
};

export default function CryDecoder() {
  const [user, setUser] = useState(null);
  const [recording, setRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [duration, setDuration] = useState(0);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const mediaRecorder = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: cryLogs = [], isLoading } = useQuery({
    queryKey: ["cryLogs"],
    queryFn: () => base44.entities.CryLog.list("-created_date", 50),
  });

  const createLog = useMutation({
    mutationFn: (data) => base44.entities.CryLog.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cryLogs"] }),
  });

  const startRecording = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);
    chunksRef.current = [];
    
    mediaRecorder.current.ondataavailable = (e) => {
      chunksRef.current.push(e.data);
    };

    mediaRecorder.current.start();
    setRecording(true);
    setDuration(0);
    setResult(null);
    
    timerRef.current = setInterval(() => {
      setDuration(d => {
        if (d >= 30) {
          stopRecording();
          return 30;
        }
        return d + 1;
      });
    }, 1000);
  }, []);

  const stopRecording = useCallback(async () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(t => t.stop());
    }
    clearInterval(timerRef.current);
    setRecording(false);
    setAnalyzing(true);

    // Simulate cry classification (replace with GCP endpoint)
    setTimeout(async () => {
      const classifications = ["hunger", "tired", "discomfort", "pain", "needs_changing"];
      const cls = classifications[Math.floor(Math.random() * classifications.length)];
      const conf = Math.floor(70 + Math.random() * 28);
      
      const logData = {
        classification: cls,
        confidence: conf,
        duration_seconds: duration,
        timestamp: new Date().toISOString(),
        notes: "",
      };
      
      await createLog.mutateAsync(logData);
      setResult({ classification: cls, confidence: conf });
      setAnalyzing(false);
    }, 2000);
  }, [duration, createLog]);

  const babyName = user?.baby_name || "Baby";

  return (
    <div className="px-5 py-6 max-w-lg mx-auto">
      <PageHeader
        title="Cry Decoder"
        subtitle={`Understanding ${babyName}'s needs`}
        emoji="🎵"
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
            !showAnalytics ? "bg-[#FFE66D] text-[#2D3436] shadow-sm" : "bg-white/60 text-[#2D3436]/50"
          }`}
          onClick={() => setShowAnalytics(false)}
        >
          Record
        </button>
        <button
          className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
            showAnalytics ? "bg-[#FFE66D] text-[#2D3436] shadow-sm" : "bg-white/60 text-[#2D3436]/50"
          }`}
          onClick={() => setShowAnalytics(true)}
        >
          Analytics
        </button>
      </div>

      <AnimatePresence mode="wait">
        {showAnalytics ? (
          <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CryAnalytics logs={cryLogs} isLoading={isLoading} />
          </motion.div>
        ) : (
          <motion.div key="record" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Recording Interface */}
            <div className="flex flex-col items-center py-8">
              {/* Waveform / Status */}
              <div className="relative mb-8">
                {recording && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-[#FF6B6B]/20"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
                <motion.button
                  className={`w-32 h-32 rounded-full flex items-center justify-center shadow-lg transition-colors relative z-10 ${
                    recording 
                      ? "bg-[#FF6B6B] animate-recording-pulse" 
                      : analyzing 
                        ? "bg-[#FFE66D]"
                        : "bg-gradient-to-br from-[#FFE66D] to-[#FFB347]"
                  }`}
                  whileHover={{ scale: recording ? 1 : 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onPointerDown={recording ? undefined : startRecording}
                  onPointerUp={recording ? stopRecording : undefined}
                  disabled={analyzing}
                >
                  {analyzing ? (
                    <LoadingDucky size="sm" message="" />
                  ) : recording ? (
                    <Square className="w-10 h-10 text-white" />
                  ) : (
                    <Mic className="w-10 h-10 text-white" />
                  )}
                </motion.button>
              </div>

              {/* Timer */}
              {recording && (
                <motion.div
                  className="flex items-center gap-2 mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="w-2 h-2 rounded-full bg-[#FF6B6B] animate-pulse" />
                  <span className="text-lg font-bold text-[#2D3436] tabular-nums">
                    {String(Math.floor(duration / 60)).padStart(2, "0")}:
                    {String(duration % 60).padStart(2, "0")}
                  </span>
                  <span className="text-xs text-[#2D3436]/40">/ 0:30</span>
                </motion.div>
              )}

              <p className="text-sm text-[#2D3436]/50 font-medium text-center">
                {recording
                  ? "Release to stop recording"
                  : analyzing
                    ? `Analyzing ${babyName}'s cry...`
                    : "Press and hold to record"
                }
              </p>

              {/* Waveform animation during recording */}
              {recording && (
                <div className="flex items-center gap-1 mt-6">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 rounded-full bg-[#FFB347]"
                      animate={{ height: [8, 12 + Math.random() * 28, 8] }}
                      transition={{ duration: 0.4 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.05 }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Result Card */}
            <AnimatePresence>
              {result && (
                <motion.div
                  className="rounded-3xl p-6 text-center shadow-sm"
                  style={{ backgroundColor: CLASSIFICATIONS[result.classification]?.bg }}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <span className="text-5xl block mb-3">
                    {CLASSIFICATIONS[result.classification]?.emoji}
                  </span>
                  <h3 className="text-xl font-bold text-[#2D3436]">
                    {CLASSIFICATIONS[result.classification]?.label}
                  </h3>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: CLASSIFICATIONS[result.classification]?.color }}
                    />
                    <span className="text-sm font-semibold text-[#2D3436]">
                      {result.confidence}% confident
                    </span>
                  </div>
                  <p className="text-sm text-[#2D3436]/50 mt-3">
                    {babyName} might be {CLASSIFICATIONS[result.classification]?.label.toLowerCase()}.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Recent Logs */}
            {cryLogs.length > 0 && (
              <div className="mt-8">
                <h3 className="font-bold text-[#2D3436] mb-3">Recent Entries</h3>
                <div className="space-y-2">
                  {cryLogs.slice(0, 5).map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center gap-3 p-3 bg-white/60 rounded-2xl"
                    >
                      <span className="text-xl">{CLASSIFICATIONS[log.classification]?.emoji}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#2D3436]">
                          {CLASSIFICATIONS[log.classification]?.label}
                        </p>
                        <p className="text-xs text-[#2D3436]/40">
                          {new Date(log.created_date).toLocaleString()} · {log.confidence}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}