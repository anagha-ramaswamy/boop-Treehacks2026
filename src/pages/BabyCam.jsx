import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/boop/PageHeader";
import LoadingDucky from "@/components/boop/LoadingDucky";
import BabyAdventures from "@/components/cam/BabyAdventures";
import { Camera, Video, AlertTriangle, Play, Pause, Upload, Shield } from "lucide-react";
import { toast } from "sonner";

export default function BabyCam() {
  const [user, setUser] = useState(null);
  const [monitoring, setMonitoring] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [tab, setTab] = useState("monitor");
  const [musicUrl, setMusicUrl] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const analyzeIntervalRef = useRef(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => { 
    base44.auth.me().then(setUser);
  }, []);

  // Pre-generate music immediately when component mounts
  useEffect(() => {
    generateMusic();
  }, []);

  const generateMusic = async () => {
    if (musicUrl) return;
    try {
      const response = await base44.functions.invoke('generateAdventureMusic', {
        image_urls: [
          "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6990f9c9e39e5510242c21a0/51bfbf3c8_images3.jpg",
          "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6990f9c9e39e5510242c21a0/e6526ae84_istockphoto-640147636-612x612.jpg"
        ]
      });
      if (response.data.success && response.data.audio_url) {
        setMusicUrl(response.data.audio_url);
      }
    } catch (error) {
      console.error("Music generation error:", error);
    }
  };

  const { data: alerts = [] } = useQuery({
    queryKey: ["camAlerts"],
    queryFn: () => base44.entities.CamAlert.list("-created_date", 50),
  });

  const { data: captures = [] } = useQuery({
    queryKey: ["camCaptures"],
    queryFn: () => base44.entities.CamCapture.list("-created_date", 100),
  });

  const createAlert = useMutation({
    mutationFn: (data) => base44.entities.CamAlert.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["camAlerts"] }),
  });

  const createCapture = useMutation({
    mutationFn: (data) => base44.entities.CamCapture.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["camCaptures"] }),
  });

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const isImage = file.type.startsWith('image/');
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      
      // If it's an image, analyze it immediately
      if (isImage) {
        toast.info("Analyzing image for dangers...");
        try {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          
          const result = await base44.integrations.Core.InvokeLLM({
            prompt: `Analyze this image for baby safety. Look for:
1. Is there a baby visible in the frame?
2. Are there any dangerous objects near the baby? Consider:
   - Sharp objects (knives, scissors, tools)
   - Hot surfaces (stoves, ovens, heaters)
   - Choking hazards (small objects)
   - Cleaning products or chemicals
   - Electrical outlets or cords
   - Stairs or elevated surfaces
   - Heavy items that could fall
3. How close is the baby to any dangerous object?

Flag as danger if: baby is visible AND a dangerous object is within reaching distance or poses immediate risk.`,
            response_json_schema: {
              type: "object",
              properties: {
                baby_visible: { type: "boolean" },
                danger_detected: { type: "boolean" },
                danger_description: { type: "string" },
                baby_proximity: { type: "string", enum: ["very_close", "close", "moderate", "far", "none"] },
                confidence: { type: "number" },
              },
            },
            file_urls: [file_url],
          });

          if (result.danger_detected && result.baby_visible) {
            await createAlert.mutateAsync({
              frame_url: file_url,
              danger_detected: true,
              danger_description: result.danger_description,
              confidence: result.confidence,
              baby_proximity: result.baby_proximity,
              alert_sent: true,
              timestamp: new Date().toISOString(),
            });

            toast.error(`🚨 DANGER DETECTED: ${result.danger_description}`, {
              description: `Baby is ${result.baby_proximity.replace("_", " ")} to danger!`,
              duration: 10000,
            });

            if (user?.email) {
              await base44.integrations.Core.SendEmail({
                to: user.email,
                subject: `🚨 Boop Alert: Baby Near Danger`,
                body: `URGENT: ${user.baby_name || "Baby"} is ${result.baby_proximity.replace("_", " ")} to: ${result.danger_description}\n\nCheck the image in Boop Baby Cam!\n\nTime: ${new Date().toLocaleString()}`,
              });
            }
          } else {
            toast.success("✅ No dangers detected in this image");
          }
        } catch (error) {
          toast.error("Failed to analyze image");
          console.error(error);
        }
      }
    }
  };

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        const file = new File([blob], "frame.jpg", { type: "image/jpeg" });
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        resolve(file_url);
      }, "image/jpeg", 0.85);
    });
  };

  const analyzeFrame = async () => {
    if (analyzing) return;
    setAnalyzing(true);

    try {
      const frameUrl = await captureFrame();
      if (!frameUrl) return;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this baby monitor frame. Look for:
1. Is there a baby visible in the frame?
2. Are there any dangerous objects near the baby? Consider:
   - Sharp objects (knives, scissors, tools)
   - Hot surfaces (stoves, ovens, heaters)
   - Choking hazards (small objects, coins, buttons)
   - Cleaning products or chemicals
   - Electrical outlets or cords
   - Heavy items that could fall
   - Any object with a "BoopDanger" yellow sticker
3. How close is the baby to any dangerous object?
4. What is the dangerous object?

Flag as danger if: (a) a baby is visible AND (b) a dangerous object is within reaching distance or poses immediate risk.`,
        response_json_schema: {
          type: "object",
          properties: {
            baby_visible: { type: "boolean" },
            danger_detected: { type: "boolean" },
            danger_description: { type: "string" },
            baby_proximity: { type: "string", enum: ["very_close", "close", "moderate", "far", "none"] },
            confidence: { type: "number" },
            baby_activity: { type: "string" },
          },
        },
        file_urls: [frameUrl],
      });

      if (result.danger_detected && result.baby_visible) {
        // Create alert
        await createAlert.mutateAsync({
          frame_url: frameUrl,
          danger_detected: true,
          danger_description: result.danger_description,
          confidence: result.confidence,
          baby_proximity: result.baby_proximity,
          alert_sent: true,
          timestamp: new Date().toISOString(),
        });

        // Show urgent notification
        toast.error(`🚨 DANGER ALERT: ${result.danger_description}`, {
          description: `Baby is ${result.baby_proximity.replace("_", " ")} to danger!`,
          duration: 10000,
        });

        // Send email if configured
        if (user?.email) {
          await base44.integrations.Core.SendEmail({
            to: user.email,
            subject: `🚨 Boop Alert: Baby Near Danger`,
            body: `URGENT: ${user.baby_name || "Baby"} is ${result.baby_proximity.replace("_", " ")} to: ${result.danger_description}\n\nCheck the Boop Baby Cam immediately!\n\nTime: ${new Date().toLocaleString()}`,
          });
        }
      } else if (result.baby_visible && Math.random() < 0.15) {
        // Randomly capture cute moments
        const caption = await base44.integrations.Core.InvokeLLM({
          prompt: `Generate a short, cute, playful caption (max 8 words) for this baby moment: ${result.baby_activity}`,
        });
        
        await createCapture.mutateAsync({
          photo_url: frameUrl,
          caption,
          baby_activity: result.baby_activity,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("Analysis error:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const startMonitoring = () => {
    if (!videoUrl) {
      toast.error("Please upload a video first");
      return;
    }
    setMonitoring(true);
    if (videoRef.current) {
      videoRef.current.play();
    }
    // Analyze every 5 seconds
    analyzeIntervalRef.current = setInterval(analyzeFrame, 5000);
  };

  const stopMonitoring = () => {
    setMonitoring(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
    if (analyzeIntervalRef.current) {
      clearInterval(analyzeIntervalRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (analyzeIntervalRef.current) {
        clearInterval(analyzeIntervalRef.current);
      }
    };
  }, []);

  const recentAlerts = alerts.filter(a => a.danger_detected).slice(0, 3);
  const babyName = user?.baby_name || "Baby";

  return (
    <div className="px-5 py-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2D3436]">Baby Cam 📹</h1>
          <p className="text-sm text-[#2D3436]/50">Protecting {babyName} 24/7</p>
        </div>
        <motion.button
          className="px-4 py-2 rounded-full bg-gradient-to-r from-[#FFE66D] to-[#A8D8EA] text-[#2D3436] font-bold text-sm shadow-md flex items-center gap-2"
          onClick={() => setTab(tab === "monitor" ? "adventures" : "monitor")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{ x: [0, 5, 0] }}
          transition={{ x: { duration: 2, repeat: Infinity } }}
        >
          {tab === "monitor" ? "📸 Adventures" : "🛡️ Monitor"}
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {tab === "adventures" ? (
          <motion.div key="adventures" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <BabyAdventures babyName={babyName} musicUrl={musicUrl} />
          </motion.div>
        ) : (
          <motion.div key="monitor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Upload/Connect Section */}
            {!videoUrl ? (
              <div className="space-y-4">
                <div
                  className="border-2 border-dashed border-[#FF6B6B]/40 rounded-3xl p-12 text-center bg-white/40 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*,image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Video className="w-12 h-12 text-[#FF6B6B]/50 mx-auto mb-3" />
                  <p className="font-semibold text-[#2D3436]">Upload Image or Video</p>
                  <p className="text-sm text-[#2D3436]/40 mt-1">Upload baby cam footage or photo</p>
                  <p className="text-xs text-[#2D3436]/30 mt-2">Production: connects to live baby monitor stream</p>
                </div>

                <div className="bg-[#FFE66D]/10 rounded-2xl p-4 border border-[#FFE66D]/20">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-[#FFB347] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-[#2D3436]">How BoopDanger Works</p>
                      <p className="text-xs text-[#2D3436]/50 mt-1 leading-relaxed">
                        Place bright yellow "BOOP DANGER" stickers on risky objects (ovens, sharp items, cleaning supplies). Boop's AI monitors the camera and alerts you if {babyName} gets near them!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Video Feed */}
                <div className="relative rounded-3xl overflow-hidden shadow-lg bg-black">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full aspect-video object-cover"
                    loop
                    playsInline
                  />
                  {monitoring && (
                    <motion.div
                      className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF6B6B] text-white text-xs font-bold"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <div className="w-2 h-2 rounded-full bg-white" />
                      LIVE MONITORING
                    </motion.div>
                  )}
                  {analyzing && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs">
                      <motion.div
                        className="w-2 h-2 rounded-full bg-[#4ECDC4]"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      />
                      Analyzing...
                    </div>
                  )}
                </div>
                <canvas ref={canvasRef} className="hidden" />

                {/* Controls */}
                <div className="flex gap-3">
                  {!monitoring ? (
                    <button
                      className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-[#FF6B6B] to-[#FF8585] text-white font-bold shadow-lg shadow-[#FF6B6B]/30 flex items-center justify-center gap-2"
                      onClick={startMonitoring}
                    >
                      <Shield className="w-5 h-5" />
                      Start Monitoring
                    </button>
                  ) : (
                    <button
                      className="flex-1 py-4 rounded-2xl bg-[#FFB347] text-white font-bold shadow-lg flex items-center justify-center gap-2"
                      onClick={stopMonitoring}
                    >
                      <Pause className="w-5 h-5" />
                      Stop
                    </button>
                  )}
                  <button
                    className="px-4 py-4 rounded-2xl bg-white/60 text-[#2D3436]/50"
                    onClick={() => { setVideoUrl(null); setVideoFile(null); stopMonitoring(); }}
                  >
                    <Upload className="w-5 h-5" />
                  </button>
                </div>

                {/* Recent Alerts */}
                {recentAlerts.length > 0 && (
                  <div className="bg-white rounded-3xl p-5 shadow-sm">
                    <h3 className="font-bold text-[#2D3436] mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#FF6B6B]" />
                      Recent Alerts
                    </h3>
                    <div className="space-y-2">
                      {recentAlerts.map(alert => (
                        <div key={alert.id} className="flex items-center gap-3 p-3 bg-[#FF6B6B]/5 rounded-xl border border-[#FF6B6B]/10">
                          <img
                            src={alert.frame_url}
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                            alt=""
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#FF6B6B]">{alert.danger_description}</p>
                            <p className="text-xs text-[#2D3436]/40">
                              {new Date(alert.created_date).toLocaleString()} · {alert.baby_proximity?.replace("_", " ")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/80 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-bold text-[#FF6B6B]">{alerts.filter(a => a.danger_detected).length}</p>
                    <p className="text-xs text-[#2D3436]/40 mt-1">Total Alerts</p>
                  </div>
                  <div className="bg-white/80 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-bold text-[#4ECDC4]">{monitoring ? "ON" : "OFF"}</p>
                    <p className="text-xs text-[#2D3436]/40 mt-1">Status</p>
                  </div>
                  <div className="bg-white/80 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-bold text-[#FFB347]">{captures.length}</p>
                    <p className="text-xs text-[#2D3436]/40 mt-1">Moments</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}