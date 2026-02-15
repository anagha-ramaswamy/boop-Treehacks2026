import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Mail, Copy } from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { base44 } from "@/api/base44Client";

const SECTION_CONFIG = {
  patient_info: { title: "Patient Information", emoji: "👶" },
  visit_reason: { title: "Visit Reason", emoji: "📋" },
  growth_metrics: { title: "Growth & Measurements", emoji: "📏" },
  developmental_milestones: { title: "Developmental Milestones", emoji: "🎯" },
  nutrition_assessment: { title: "Nutrition & Feeding", emoji: "🍼" },
  immunizations: { title: "Immunizations", emoji: "💉" },
  physical_exam: { title: "Physical Examination", emoji: "🩺" },
  subjective: { title: "Subjective (Patient Report)", emoji: "💬" },
  objective: { title: "Objective (Clinical Findings)", emoji: "🔬" },
  assessment: { title: "Assessment (Diagnosis)", emoji: "🎯" },
  plan: { title: "Plan (Treatment)", emoji: "📝" },
  feeding_history: { title: "Feeding History", emoji: "🍼" },
  intake_logs: { title: "Daily Intake Logs", emoji: "📊" },
  feeding_difficulties: { title: "Feeding Difficulties", emoji: "⚠️" },
  growth_trajectory: { title: "Growth Trajectory", emoji: "📈" },
  nutritional_recommendations: { title: "Recommendations", emoji: "💡" },
  stool_diary: { title: "Stool Pattern Diary", emoji: "🩺" },
  reflux_tracking: { title: "Reflux & Spit-up", emoji: "🤮" },
  gi_patterns: { title: "GI Patterns", emoji: "📊" },
  concerning_symptoms: { title: "Concerning Symptoms", emoji: "🚨" },
  gi_recommendations: { title: "GI Recommendations", emoji: "💊" },
  milestone_tracking: { title: "Milestone Progress", emoji: "🎯" },
  behavioral_observations: { title: "Behavioral Observations", emoji: "👁️" },
  sleep_patterns: { title: "Sleep Patterns", emoji: "😴" },
  cry_analysis: { title: "Cry Analysis", emoji: "🎵" },
  developmental_concerns: { title: "Developmental Concerns", emoji: "⚠️" },
  chief_complaint: { title: "Chief Complaint", emoji: "🚨" },
  symptom_timeline: { title: "Symptom Timeline", emoji: "⏰" },
  recent_history: { title: "Recent History (24-48h)", emoji: "📅" },
  medications_allergies: { title: "Medications & Allergies", emoji: "💊" },
  emergency_assessment: { title: "Emergency Assessment", emoji: "🚑" },
  complete_visit_history: { title: "Complete Visit History", emoji: "📚" },
  all_milestones: { title: "All Milestones Achieved", emoji: "✅" },
  vaccination_record: { title: "Vaccination Record", emoji: "💉" },
  growth_charts: { title: "Growth Charts", emoji: "📊" },
  major_concerns: { title: "Major Health Concerns", emoji: "⚠️" },
  comprehensive_summary: { title: "Comprehensive Summary", emoji: "📋" },
  recommendations: { title: "Recommendations", emoji: "💡" },
};

export default function ReportPreview({ report, user, onBack }) {
  const sections = report.sections || {};
  const [exporting, setExporting] = useState(false);

  const copyToClipboard = () => {
    let text = `${report.title}\n\n`;
    Object.entries(sections).forEach(([key, value]) => {
      const config = SECTION_CONFIG[key];
      if (config && value) {
        text += `${config.title}\n${value}\n\n`;
      }
    });
    text += `\nDisclaimer: This report is generated from parent observations and AI analysis. It is not a substitute for professional medical evaluation.`;
    navigator.clipboard.writeText(text);
    toast.success("Report copied to clipboard!");
  };

  const generatePDF = () => {
    setExporting(true);
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let y = margin;

    // Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Boop Health Report", margin, y);
    y += 8;
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text(report.title, margin, y);
    y += 10;

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date(report.created_date).toLocaleDateString()}`, margin, y);
    y += 5;
    doc.text(`Patient: ${user?.baby_name || "Baby"} | Age: ${user?.baby_age_months || "?"} months`, margin, y);
    y += 5;
    if (user?.pediatrician_name) {
      doc.text(`Pediatrician: ${user.pediatrician_name}`, margin, y);
      y += 5;
    }
    y += 5;
    
    doc.setDrawColor(230, 230, 109);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Sections
    Object.entries(sections).forEach(([key, value]) => {
      const config = SECTION_CONFIG[key];
      if (!config || !value) return;

      if (y > pageHeight - 40) {
        doc.addPage();
        y = margin;
      }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(45, 52, 54);
      doc.text(`${config.emoji} ${config.title}`, margin, y);
      y += 7;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60);
      const lines = doc.splitTextToSize(value, maxWidth);
      lines.forEach(line => {
        if (y > pageHeight - 20) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += 5;
      });
      y += 5;
    });

    // Footer disclaimer
    if (y > pageHeight - 30) {
      doc.addPage();
      y = margin;
    }
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.setFont("helvetica", "italic");
    const disclaimer = doc.splitTextToSize("Disclaimer: This report is generated from parent observations and AI analysis. It is not a substitute for professional medical evaluation. Always consult your pediatrician for medical concerns.", maxWidth);
    disclaimer.forEach(line => {
      doc.text(line, margin, y);
      y += 4;
    });

    doc.save(`${report.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
    setExporting(false);
    toast.success("PDF downloaded!");
  };

  const emailReport = async () => {
    setExporting(true);
    let bodyText = `${report.title}\n\nGenerated: ${new Date(report.created_date).toLocaleDateString()}\n\n`;
    bodyText += `Patient: ${user?.baby_name || "Baby"}, Age: ${user?.baby_age_months || "?"} months\n`;
    if (user?.pediatrician_name) bodyText += `Pediatrician: ${user.pediatrician_name}\n`;
    bodyText += `\n${"=".repeat(60)}\n\n`;
    
    Object.entries(sections).forEach(([key, value]) => {
      const config = SECTION_CONFIG[key];
      if (config && value) {
        bodyText += `${config.emoji} ${config.title.toUpperCase()}\n${"-".repeat(40)}\n${value}\n\n`;
      }
    });
    
    bodyText += `\n${"=".repeat(60)}\n\nDisclaimer: This report is generated from parent observations and AI analysis. It is not a substitute for professional medical evaluation.\n\nGenerated by Boop - Speak Baby`;

    try {
      await base44.integrations.Core.SendEmail({
        to: user?.pediatrician_contact || user?.email || "",
        subject: report.title,
        body: bodyText,
      });
      toast.success("Report emailed successfully!");
    } catch (err) {
      toast.error("Failed to send email");
    }
    setExporting(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium text-[#2D3436]/50 hover:text-[#2D3436] mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Reports
      </button>

      {/* Report Header */}
      <div className="bg-white rounded-3xl p-5 shadow-sm mb-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-[#A29BFE]" />
          <span className="text-xs font-semibold text-[#A29BFE] uppercase tracking-wider">
            {report.status}
          </span>
        </div>
        <h2 className="text-lg font-bold text-[#2D3436]">{report.title}</h2>
        <p className="text-xs text-[#2D3436]/40 mt-1">
          Generated {new Date(report.created_date).toLocaleDateString()}
        </p>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <button
            className="flex-1 py-2.5 rounded-xl bg-[#FF6B6B]/10 text-[#FF6B6B] text-sm font-semibold flex items-center justify-center gap-1.5"
            onClick={generatePDF}
            disabled={exporting}
          >
            <Download className="w-4 h-4" /> {exporting ? "..." : "PDF"}
          </button>
          <button
            className="flex-1 py-2.5 rounded-xl bg-[#4ECDC4]/10 text-[#4ECDC4] text-sm font-semibold flex items-center justify-center gap-1.5"
            onClick={emailReport}
            disabled={exporting}
          >
            <Mail className="w-4 h-4" /> {exporting ? "..." : "Email"}
          </button>
          <button
            className="flex-1 py-2.5 rounded-xl bg-[#A29BFE]/10 text-[#A29BFE] text-sm font-semibold flex items-center justify-center gap-1.5"
            onClick={copyToClipboard}
          >
            <Copy className="w-4 h-4" /> Copy
          </button>
        </div>
      </div>

      {/* Report Sections */}
      <div className="space-y-3">
        {Object.entries(SECTION_CONFIG).map(([key, config]) => {
          const content = sections[key];
          if (!content) return null;
          return (
            <motion.div
              key={key}
              className="bg-white rounded-2xl p-4 shadow-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="font-bold text-[#2D3436] mb-2 flex items-center gap-2">
                <span>{config.emoji}</span>
                {config.title}
              </h3>
              <p className="text-sm text-[#2D3436]/70 leading-relaxed whitespace-pre-wrap">
                {content}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div className="mt-4 p-4 bg-[#FFE66D]/10 rounded-2xl border border-[#FFE66D]/20">
        <p className="text-xs text-[#2D3436]/50 leading-relaxed">
          ⚠️ This report is generated from parent observations and AI analysis. It is not a substitute for professional medical evaluation. Always consult your pediatrician for medical concerns.
        </p>
      </div>
    </motion.div>
  );
}