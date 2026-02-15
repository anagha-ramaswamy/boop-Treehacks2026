import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/boop/PageHeader";
import LoadingDucky from "@/components/boop/LoadingDucky";
import ReportPreview from "@/components/reports/ReportPreview";
import { FileText, Plus, Calendar, Download, Mail, Trash2, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const REPORT_TYPES = [
  {
    id: "well_child",
    name: "Well-Child Visit Summary ⭐",
    description: "Routine checkup (2, 4, 6, 9, 12mo visits)",
    icon: "👶",
    sections: ["patient_info", "visit_reason", "growth_metrics", "developmental_milestones", "nutrition_assessment", "immunizations", "physical_exam", "recommendations"],
  },
  {
    id: "soap_note",
    name: "SOAP Note (Sick Visit)",
    description: "Subjective, Objective, Assessment, Plan",
    icon: "🤒",
    sections: ["patient_info", "subjective", "objective", "assessment", "plan"],
  },
  {
    id: "feeding_nutrition",
    name: "Feeding & Nutrition Assessment",
    description: "Intake logs, patterns, growth trajectory",
    icon: "🍼",
    sections: ["patient_info", "feeding_history", "intake_logs", "feeding_difficulties", "growth_trajectory", "nutritional_recommendations"],
  },
  {
    id: "gi_diary",
    name: "Digestive Health Report",
    description: "Stool diary, reflux, elimination patterns",
    icon: "🩺",
    sections: ["patient_info", "stool_diary", "reflux_tracking", "gi_patterns", "concerning_symptoms", "gi_recommendations"],
  },
  {
    id: "developmental",
    name: "Developmental Progress Report",
    description: "Monthly milestone tracking & behavior",
    icon: "📈",
    sections: ["patient_info", "milestone_tracking", "behavioral_observations", "sleep_patterns", "cry_analysis", "developmental_concerns"],
  },
  {
    id: "emergency",
    name: "Emergency Visit Summary",
    description: "Recent symptoms, timeline, medical history",
    icon: "🚨",
    sections: ["patient_info", "chief_complaint", "symptom_timeline", "recent_history", "medications_allergies", "emergency_assessment"],
  },
  {
    id: "comprehensive",
    name: "Comprehensive Health Summary",
    description: "Complete first year medical history",
    icon: "📋",
    sections: ["patient_info", "complete_visit_history", "all_milestones", "vaccination_record", "growth_charts", "major_concerns", "comprehensive_summary"],
  },
];

export default function HealthReports() {
  const [user, setUser] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportType, setReportType] = useState("well_child");
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: () => base44.entities.HealthReport.list("-created_date", 20),
  });

  const { data: cryLogs = [] } = useQuery({
    queryKey: ["cryLogs"],
    queryFn: () => base44.entities.CryLog.list("-created_date", 100),
  });
  const { data: diaperLogs = [] } = useQuery({
    queryKey: ["diaperLogs"],
    queryFn: () => base44.entities.DiaperLog.list("-created_date", 100),
  });
  const { data: surveys = [] } = useQuery({
    queryKey: ["surveys"],
    queryFn: () => base44.entities.SurveyResponse.list("-created_date", 30),
  });
  const { data: chatMessages = [] } = useQuery({
    queryKey: ["chatMessages"],
    queryFn: () => base44.entities.ChatMessage.list("-created_date", 50),
  });

  const createReport = useMutation({
    mutationFn: (data) => base44.entities.HealthReport.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reports"] }),
  });

  const deleteReport = useMutation({
    mutationFn: (id) => base44.entities.HealthReport.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reports"] }),
  });

  const generateReport = async () => {
    setGenerating(true);
    const babyName = user?.baby_name || "Baby";
    
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    const filteredCry = cryLogs.filter(l => {
      const d = new Date(l.created_date);
      return d >= startDate && d <= endDate;
    });
    const filteredDiaper = diaperLogs.filter(l => {
      const d = new Date(l.created_date);
      return d >= startDate && d <= endDate;
    });
    const filteredSurveys = surveys.filter(s => {
      const d = new Date(s.date || s.created_date);
      return d >= startDate && d <= endDate;
    });

    const selectedType = REPORT_TYPES.find(t => t.id === reportType);
    const dataContext = `
Baby: ${babyName}, Age: ${user?.baby_age_months || "unknown"} months, Birth Date: ${user?.baby_birth_date || "unknown"}
Parent: ${user?.full_name || "Parent"}
Date Range: ${dateRange.start} to ${dateRange.end}
Pediatrician: ${user?.pediatrician_name || "Not specified"}

CRY LOG DATA (${filteredCry.length} entries):
${filteredCry.slice(0, 20).map(l => `- ${new Date(l.created_date).toLocaleDateString()}: ${l.classification} (${l.confidence}%)`).join("\n")}

DIAPER LOG DATA (${filteredDiaper.length} entries):
${filteredDiaper.slice(0, 20).map(l => `- ${new Date(l.created_date).toLocaleDateString()}: ${l.classification} - ${l.clinical_note || ""}`).join("\n")}

SURVEY DATA (${filteredSurveys.length} entries):
${filteredSurveys.slice(0, 10).map(s => `- ${s.date}: ${JSON.stringify(s.responses || {})}`).join("\n")}

PARENT QUESTIONS FROM CHAT:
${chatMessages.filter(m => m.role === "user").slice(0, 10).map(m => `- ${m.content}`).join("\n")}
`;

    const sectionPrompts = {
      patient_info: "Full patient demographics (name, age, DOB, parent name)",
      visit_reason: "Reason for visit (well-child checkup, routine)",
      growth_metrics: "Weight, length, head circumference percentiles",
      developmental_milestones: "Motor, language, social-emotional milestones achieved",
      nutrition_assessment: "Feeding type, frequency, amount, concerns",
      immunizations: "Vaccines given or due",
      physical_exam: "Brief normal findings",
      recommendations: "Follow-up care, anticipatory guidance",
      subjective: "Patient's/parent's description of symptoms, concerns, history",
      objective: "Observable findings, vitals, exam results",
      assessment: "Clinical diagnosis or impression",
      plan: "Treatment plan, medications, follow-up",
      feeding_history: "Detailed feeding patterns, difficulties, intake",
      intake_logs: "Daily feeding amounts and timing",
      feeding_difficulties: "Refusal, latching issues, allergies",
      growth_trajectory: "Weight/length trends over time",
      nutritional_recommendations: "Feeding adjustments, supplementation",
      stool_diary: "Frequency, consistency, color, patterns from diaper logs",
      reflux_tracking: "Spit-up frequency and severity from surveys",
      gi_patterns: "Digestive trends and concerns",
      concerning_symptoms: "Red flag GI symptoms if any",
      gi_recommendations: "Dietary changes, probiotics, follow-up",
      milestone_tracking: "Developmental progress by domain",
      behavioral_observations: "Temperament, cry patterns, responsiveness",
      sleep_patterns: "Sleep duration, quality, routines",
      cry_analysis: "Cry classification patterns and trends",
      developmental_concerns: "Any delays or concerns",
      chief_complaint: "Primary reason for emergency visit",
      symptom_timeline: "When symptoms started, progression",
      recent_history: "Last 24-48 hours of relevant events",
      medications_allergies: "Current meds and known allergies",
      emergency_assessment: "Severity and urgency assessment",
      complete_visit_history: "All documented visits chronologically",
      all_milestones: "Complete milestone checklist",
      vaccination_record: "Full immunization history",
      growth_charts: "Growth curves over time",
      major_concerns: "Significant health issues addressed",
      comprehensive_summary: "Overall health narrative",
    };

    const schema = {};
    selectedType.sections.forEach(section => {
      schema[section] = { type: "string" };
    });

    const aiResult = await base44.integrations.Core.InvokeLLM({
      prompt: `You are generating a ${selectedType.name} following AAP/medical documentation standards.

${dataContext}

Generate ONLY the following sections for this report type. Each section should be professional, clinical, and evidence-based:

${selectedType.sections.map(s => `- ${s}: ${sectionPrompts[s] || ""}`).join("\n")}

Use proper medical terminology. Be specific and quantitative where possible.`,
      response_json_schema: {
        type: "object",
        properties: schema,
      },
    });

    const report = await createReport.mutateAsync({
      title: `${selectedType.name} - ${babyName}`,
      date_range_start: dateRange.start,
      date_range_end: dateRange.end,
      report_type: reportType,
      sections: aiResult,
      ai_summary: aiResult[selectedType.sections[selectedType.sections.length - 1]],
      status: "draft",
      export_history: [],
    });

    setSelectedReport(report);
    setGenerating(false);
  };

  if (!user) return <LoadingDucky />;

  return (
    <div className="px-5 py-6 max-w-lg mx-auto">
      <PageHeader title="Health Reports" subtitle="Clinical reports for your pediatrician" emoji="📋" />

      {selectedReport ? (
        <ReportPreview
          report={selectedReport}
          user={user}
          onBack={() => setSelectedReport(null)}
        />
      ) : (
        <>
          {/* Generate New Report */}
          <div className="bg-white rounded-3xl p-5 shadow-sm mb-6">
            <h3 className="font-bold text-[#2D3436] mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#A29BFE]" />
              Generate New Report
            </h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-[#2D3436]/50 mb-1 block">Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_TYPES.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          <span>{type.icon}</span>
                          <div>
                            <div className="font-semibold text-sm">{type.name}</div>
                            <div className="text-xs text-[#2D3436]/40">{type.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-[#2D3436]/50 mb-1 block">Start Date</Label>
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                    className="rounded-xl text-sm h-10"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#2D3436]/50 mb-1 block">End Date</Label>
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                    className="rounded-xl text-sm h-10"
                  />
                </div>
              </div>
              <button
                className="w-full py-3.5 rounded-2xl bg-[#A29BFE] text-white font-bold shadow-md shadow-[#A29BFE]/20 flex items-center justify-center gap-2"
                onClick={generateReport}
                disabled={generating}
              >
                {generating ? (
                  <span className="flex items-center gap-2">
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>🐥</motion.span>
                    Generating...
                  </span>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Generate Report
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Existing Reports */}
          <h3 className="font-bold text-[#2D3436] mb-3">Previous Reports</h3>
          {isLoading ? (
            <LoadingDucky message="Loading reports..." size="sm" />
          ) : reports.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-3xl block mb-2">📄</span>
              <p className="text-sm text-[#2D3436]/40">No reports generated yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map(report => (
                <motion.div
                  key={report.id}
                  className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 cursor-pointer"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#A29BFE]/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-[#A29BFE]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#2D3436] truncate">{report.title}</p>
                    <p className="text-xs text-[#2D3436]/40">
                      {new Date(report.created_date).toLocaleDateString()} · {report.status}
                    </p>
                  </div>
                  <button
                    className="p-2 text-[#2D3436]/20 hover:text-[#FF6B6B] transition-colors"
                    onClick={e => { e.stopPropagation(); deleteReport.mutate(report.id); }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}

          {/* Disclaimer */}
          <div className="mt-6 p-4 bg-[#FFE66D]/10 rounded-2xl border border-[#FFE66D]/20">
            <p className="text-xs text-[#2D3436]/50 leading-relaxed">
              ⚠️ <strong>Disclaimer:</strong> Reports are generated from parent observations and AI analysis. They are not a substitute for professional medical evaluation. Always consult your pediatrician for medical concerns.
            </p>
          </div>
        </>
      )}
    </div>
  );
}