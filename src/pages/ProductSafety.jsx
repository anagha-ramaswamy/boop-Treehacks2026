import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, Loader2, AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import PageHeader from "../components/boop/PageHeader";
import { Button } from "@/components/ui/button";

const SAFETY_COLORS = {
  0: { bg: "bg-green-50", text: "text-green-600", border: "border-green-200", icon: CheckCircle, label: "Safe" },
  1: { bg: "bg-green-50", text: "text-green-600", border: "border-green-200", icon: CheckCircle, label: "Safe" },
  2: { bg: "bg-yellow-50", text: "text-yellow-600", border: "border-yellow-200", icon: AlertTriangle, label: "Caution" },
  3: { bg: "bg-yellow-50", text: "text-yellow-600", border: "border-yellow-200", icon: AlertTriangle, label: "Caution" },
  4: { bg: "bg-yellow-50", text: "text-yellow-600", border: "border-yellow-200", icon: AlertTriangle, label: "Caution" },
  5: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200", icon: AlertTriangle, label: "Avoid" },
  6: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200", icon: AlertTriangle, label: "Avoid" },
  7: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200", icon: AlertCircle, label: "Avoid" },
  8: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200", icon: AlertCircle, label: "Avoid" },
  9: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200", icon: AlertCircle, label: "Avoid" },
  10: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200", icon: AlertCircle, label: "Avoid" },
};

export default function ProductSafety() {
  const [capturedImage, setCapturedImage] = useState(null);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCapturedImage(URL.createObjectURL(file));
    setResult(null);
    setChecking(true);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const response = await base44.functions.invoke("checkProductSafetyBrowserbase", { image_url: file_url });
      setResult(response.data);
    } catch (error) {
      toast.error("Failed to check product safety");
      console.error(error);
    } finally {
      setChecking(false);
    }
  };

  const resetCapture = () => {
    setCapturedImage(null);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-[#FFF8E7] p-4">
      <div className="max-w-2xl mx-auto">
        <PageHeader
          title="Product Safety"
          subtitle="Check EWG ratings for baby products"
          emoji="🧴"
        />

        <AnimatePresence mode="wait">
          {!capturedImage ? (
            <motion.div
              key="capture"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="bg-white rounded-3xl p-8 text-center shadow-sm">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-[#FFE66D]/20 flex items-center justify-center">
                  <Camera className="w-12 h-12 text-[#FFB347]" />
                </div>
                <h2 className="text-lg font-bold text-[#2D3436] mb-2">
                  Scan a Product
                </h2>
                <p className="text-sm text-[#2D3436]/60 mb-6">
                  Take a photo of any baby product to check its safety rating from the Environmental Working Group (EWG) database
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageCapture}
                  className="hidden"
                />
                <div className="flex gap-3">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 bg-[#FFB347] hover:bg-[#FF9A33] text-white h-12 rounded-2xl"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Take Photo
                  </Button>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="flex-1 h-12 rounded-2xl border-2"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Upload
                  </Button>
                </div>
              </div>

              <div className="bg-[#FFE66D]/10 rounded-2xl p-4 border border-[#FFE66D]/20">
                <p className="text-xs text-[#2D3436]/60">
                  💡 <strong>Tip:</strong> Make sure the product label is clear and visible in the photo for best results
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="bg-white rounded-3xl p-4 shadow-sm">
                <img
                  src={capturedImage}
                  alt="Product"
                  className="w-full h-64 object-cover rounded-2xl mb-4"
                />
              </div>

              {checking && (
                <div className="bg-white rounded-3xl p-8 text-center shadow-sm">
                  <Loader2 className="w-12 h-12 animate-spin text-[#FFB347] mx-auto mb-4" />
                  <p className="text-sm text-[#2D3436]/60">
                    Identifying product and checking EWG database...
                  </p>
                </div>
              )}

              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className="bg-white rounded-3xl p-5 shadow-sm">
                    <h3 className="font-bold text-[#2D3436] mb-1">
                      {result.product_name}
                    </h3>
                    {result.brand && (
                      <p className="text-sm text-[#2D3436]/50 mb-4">
                        by {result.brand}
                      </p>
                    )}

                    {result.safety && (
                      <div className={`rounded-2xl p-4 border-2 ${SAFETY_COLORS[result.safety.hazard_score]?.bg} ${SAFETY_COLORS[result.safety.hazard_score]?.border}`}>
                        <div className="flex items-center gap-3 mb-2">
                          {React.createElement(SAFETY_COLORS[result.safety.hazard_score]?.icon || AlertCircle, {
                            className: `w-8 h-8 ${SAFETY_COLORS[result.safety.hazard_score]?.text}`
                          })}
                          <div>
                            <div className="text-3xl font-bold">
                              {result.safety.hazard_score}/10
                            </div>
                            <div className={`text-sm font-semibold ${SAFETY_COLORS[result.safety.hazard_score]?.text}`}>
                              {SAFETY_COLORS[result.safety.hazard_score]?.label}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {result.safety?.concerns && result.safety.concerns.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold text-[#2D3436] mb-2 text-sm">
                          Key Concerns:
                        </h4>
                        <ul className="space-y-1">
                          {result.safety.concerns.map((concern, idx) => (
                            <li key={idx} className="text-sm text-[#2D3436]/70 flex items-start gap-2">
                              <span className="text-[#FF6B6B]">•</span>
                              {concern}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.safety?.summary && (
                      <div className="mt-4 pt-4 border-t border-[#2D3436]/10">
                        <p className="text-sm text-[#2D3436]/70 leading-relaxed">
                          {result.safety.summary}
                        </p>
                      </div>
                    )}

                    {result.source && (
                      <div className="mt-4 p-3 bg-[#4ECDC4]/10 rounded-lg border border-[#4ECDC4]/20">
                        <p className="text-xs text-[#4ECDC4] font-semibold">
                          🔍 Data from: {result.source}
                        </p>
                      </div>
                    )}
                  </div>

                  {result.ewg_url && (
                    <a
                      href={result.ewg_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block bg-[#4ECDC4]/10 rounded-2xl p-4 text-center text-sm font-semibold text-[#4ECDC4] hover:bg-[#4ECDC4]/20 transition-colors"
                    >
                      View Full EWG SkinDeep Report →
                    </a>
                  )}
                </motion.div>
              )}

              <Button
                onClick={resetCapture}
                variant="outline"
                className="w-full h-12 rounded-2xl border-2"
              >
                Check Another Product
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}