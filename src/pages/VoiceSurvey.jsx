import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/boop/PageHeader";
import LoadingDucky from "@/components/boop/LoadingDucky";
import BeepDuck from "@/components/boop/BeepDuck";
import { Mic, MicOff, Volume2, VolumeX, Check, AlertTriangle, ChevronRight, ExternalLink, TrendingUp, TrendingDown, Minus } from "lucide-react";

const CRITICAL_KEYWORDS = ["fever", "vomiting", "blood", "lethargic", "unresponsive", "not eating", "dehydrated", "seizure", "rash", "swollen"];

export default function VoiceSurvey() {
  const [user, setUser] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [criticalDetected, setCriticalDetected] = useState([]);
  const [completed, setCompleted] = useState(false);
  const [allAnswers, setAllAnswers] = useState({});
  const [totalQuestions, setTotalQuestions] = useState(6);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [summary, setSummary] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [resources, setResources] = useState([]);
  const [babyStats, setBabyStats] = useState(null);
  const [generatedQuestions, setGeneratedQuestions] = useState({});
  const recognitionRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const { data: prevSurveys = [] } = useQuery({
    queryKey: ["surveys"],
    queryFn: () => base44.entities.SurveyResponse.list("-created_date", 7),
  });

  const saveSurvey = useMutation({
    mutationFn: (data) => base44.entities.SurveyResponse.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["surveys"] }),
  });

  const babyName = user?.baby_name || "Baby";

  const baseQuestions = [
    prevSurveys.length > 0 
      ? `Hi! How are you feeling today? Let's check in on ${babyName}. Yesterday you mentioned ${prevSurveys[0]?.responses?.q0 || "some things"}. How are things today?`
      : `Hi! Let's check in on ${babyName}. How are you and ${babyName} doing today?`
  ];

  const getCurrentQuestion = () => {
    if (currentQ === 0) return baseQuestions[0];
    return generatedQuestions[`q${currentQ}`] || "";
  };

  const getFemaleVoice = useCallback(() => {
    let voices = speechSynthesis.getVoices();
    
    // If no voices loaded, wait for them
    if (voices.length === 0) {
      return new Promise((resolve) => {
        const checkVoices = () => {
          voices = speechSynthesis.getVoices();
          if (voices.length > 0) {
            resolve(selectFemaleVoice(voices));
          } else {
            setTimeout(checkVoices, 50);
          }
        };
        checkVoices();
      });
    }
    
    return Promise.resolve(selectFemaleVoice(voices));
  }, []);

  const selectFemaleVoice = (voices) => {
    // Priority order for female voices
    const femaleVoice = 
      voices.find(v => v.name.includes("Google US English Female")) ||
      voices.find(v => v.name === "Samantha") ||
      voices.find(v => v.name === "Victoria") ||
      voices.find(v => v.name === "Zira") ||
      voices.find(v => v.name.includes("Karen")) ||
      voices.find(v => v.name.includes("Moira")) ||
      voices.find(v => v.lang === "en-US" && v.name.includes("Female")) ||
      voices.find(v => v.lang.startsWith("en") && !v.name.includes("Male") && v.name.includes("Female"));
    
    return femaleVoice || voices.find(v => v.lang.startsWith("en"));
  };

  const speak = useCallback(async (text) => {
    if (!ttsEnabled) return Promise.resolve();
    
    return new Promise(async (resolve) => {
      try {
        speechSynthesis.cancel();
        const femaleVoice = await getFemaleVoice();
        const utterance = new SpeechSynthesisUtterance(text);
        
        if (femaleVoice) {
          utterance.voice = femaleVoice;
        }
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.volume = 1;
        
        setSpeaking(true);
        utterance.onend = () => { setSpeaking(false); resolve(); };
        utterance.onerror = () => { setSpeaking(false); resolve(); };
        speechSynthesis.speak(utterance);
      } catch (e) {
        setSpeaking(false);
        resolve();
      }
    });
  }, [ttsEnabled, getFemaleVoice]);

  const startListening = useCallback(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const result = Array.from(event.results)
        .map(r => r[0].transcript)
        .join("");
      setTranscript(result);

      const lower = result.toLowerCase();
      const found = CRITICAL_KEYWORDS.filter(kw => lower.includes(kw));
      if (found.length > 0) setCriticalDetected(prev => [...new Set([...prev, ...found])]);
    };

    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    setTranscript("");
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const confirmAnswer = async () => {
    stopListening();
    const qIndex = `q${currentQ}`;
    const newAnswers = { ...allAnswers, [qIndex]: transcript };
    setAllAnswers(newAnswers);

    if (currentQ < totalQuestions - 1) {
      setGenerating(true);
      
      const prevContext = prevSurveys.slice(0, 3).map(s => 
        `${s.date}: ${JSON.stringify(s.responses || {})}`
      ).join("\n");

      const lastAnswer = Object.values(newAnswers)[Object.values(newAnswers).length - 1];
      const conversationSummary = Object.entries(newAnswers).slice(0, -1).map(([k, v]) => `Q${k.replace('q', '')}: ${v}`).join("\n");
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Beep, a pediatric AI assistant conducting a comprehensive daily health check-in with a parent about their baby ${babyName}.

Parent's latest response: "${lastAnswer}"

Conversation so far:
${conversationSummary || "First question"}

Medical context:
${prevContext || "No previous data"}

${criticalDetected.length > 0 ? `⚠️ Health flags: ${criticalDetected.join(", ")} - probe deeper if relevant` : ""}

Guidelines for your follow-up:
1. Ask a SPECIFIC, INSIGHTFUL question that builds directly on their last answer
2. Dig deeper into health patterns (feeding, sleep, digestion, behavior, mood)
3. Seek actionable details (timing, frequency, severity, triggers, duration)
4. Vary question topics each time - don't repeat similar themes
5. Be conversational and warm, use ${babyName}'s name naturally
6. Ask ONE clear question only

Examples of strong follow-ups:
- If they said baby is fussy: "What time of day is ${babyName} most fussy - is there a pattern?"
- If they mentioned feeding: "How long does ${babyName} typically nurse/bottle feed, and does he/she seem satisfied?"
- If they mentioned sleep: "When ${babyName} wakes up, does he/she cry or just whimper?"

Return ONLY the question text, nothing else.`,
      });

      const nextQuestion = result.trim();
      setGeneratedQuestions(prev => ({ ...prev, [`q${currentQ + 1}`]: nextQuestion }));
      setGenerating(false);
      setCurrentQ(currentQ + 1);
      setTranscript("");
    } else {
      await finishSurvey(newAnswers);
    }
  };

  const finishSurvey = async (finalAnswers) => {
    // Detect foods mentioned in responses for allergen tracking
    const foodKeywords = ['milk', 'formula', 'breast', 'cow', 'dairy', 'bottle', 'solids', 'cereal', 'rice', 'vegetables', 'fruits', 'meat', 'chicken', 'beef', 'fish', 'egg', 'eggs', 'peanut', 'nut', 'nuts', 'yogurt', 'cheese', 'butter', 'cream', 'olive oil', 'rice cereal', 'oats', 'banana', 'apple', 'pear', 'sweet potato', 'carrot', 'broccoli', 'spinach', 'green beans', 'peas', 'introduced', 'started', 'eating', 'food'];
    const foodsMentioned = [];
    Object.values(finalAnswers).forEach(answer => {
      const lowerAnswer = answer.toLowerCase();
      foodKeywords.forEach(keyword => {
        if (lowerAnswer.includes(keyword) && !foodsMentioned.includes(keyword)) {
          foodsMentioned.push(keyword);
        }
      });
    });

    await saveSurvey.mutateAsync({
      date: new Date().toISOString().split("T")[0],
      responses: finalAnswers,
      critical_keywords: criticalDetected,
      foods_mentioned: foodsMentioned,
    });

    // Generate summary and comparison
    setGenerating(true);
    const prevContext = prevSurveys.slice(0, 3).map(s => 
      `${s.date}: ${JSON.stringify(s.responses || {})}`
    ).join("\n");

    const analysisResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze today's survey response about baby ${babyName}. Provide:
1. A brief 2-sentence summary of today's health status
2. Comparison to previous days (improving/worsening/stable) - identify trends
3. Real, verified resources with working links

Today's data: ${JSON.stringify(finalAnswers)}
Previous context: ${prevContext || "No previous data"}
Health concerns: ${criticalDetected.length > 0 ? criticalDetected.join(", ") : "None detected"}

Resources to include (ONLY include if topic is relevant):
- Feeding: https://www.healthychildren.org/English/ages-stages/baby/feeding-nutrition/pages/default.aspx
- Sleep: https://www.cdc.gov/parents/infants/safe-sleep.html
- Development: https://www.healthychildren.org/English/ages-stages/baby/pages/default.aspx
- Digestion: https://www.mayoclinic.org/healthy-lifestyle/infant-and-toddler-health/expert-answers/infant-constipation/faq-20058236

IMPORTANT: Only include URLs that are directly relevant to the baby's issues mentioned. Return 2-3 max resources.`,
      response_json_schema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          trends: { type: "array", items: { 
            type: "object",
            properties: {
              metric: { type: "string" },
              status: { type: "string", enum: ["improving", "worsening", "stable"]},
              note: { type: "string" },
            }
          }},
          resources: { type: "array", items: {
            type: "object",
            properties: {
              title: { type: "string" },
              url: { type: "string" }
            }
          }},
        },
      },
    });

    setSummary(analysisResult.summary);
    setComparison(analysisResult.trends || []);
    setResources(analysisResult.resources || []);

    // Fetch clinical stats for baby age comparison
    try {
      const statsResponse = await base44.functions.invoke('fetchBabyStatistics', {
        age_months: user.baby_age_months || 0,
      });
      setBabyStats(statsResponse.data);
    } catch (err) {
      console.error('Failed to fetch baby stats:', err);
    }

    setGenerating(false);
    setCompleted(true);
  };

  useEffect(() => {
    if (user && !completed) {
      const question = getCurrentQuestion();
      if (question) {
        speak(question).then(() => {
          if (!completed) startListening();
        });
      }
    }
  }, [currentQ, user, completed, generatedQuestions]);

  if (!user) return <LoadingDucky />;

  if (completed) {
    return (
      <div className="px-5 py-6 max-w-lg mx-auto pb-24">
        <div className="text-center mb-6">
          <BeepDuck variant="chat" size="lg" animate />
          <h2 className="text-2xl font-bold text-[#2D3436] mt-4">Check-in Complete!</h2>
          <p className="text-sm text-[#2D3436]/60 mt-1">Data logged for {babyName}</p>
        </div>

        {/* Summary */}
        {summary && (
          <motion.div
            className="bg-white rounded-3xl p-5 shadow-sm mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="font-bold text-[#2D3436] mb-2">📋 Today's Summary</h3>
            <p className="text-sm text-[#2D3436]/70 leading-relaxed">{summary}</p>
          </motion.div>
        )}

        {/* Comparison */}
        {comparison && comparison.length > 0 && (
          <motion.div
            className="bg-white rounded-3xl p-5 shadow-sm mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="font-bold text-[#2D3436] mb-3">📊 Compared to Previous Days</h3>
            <div className="space-y-2">
              {comparison && comparison.length > 0 && comparison.map((trend, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-[#FFF8E7] rounded-xl">
                  {trend.status === "improving" && <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />}
                  {trend.status === "worsening" && <TrendingDown className="w-5 h-5 text-red-600 mt-0.5" />}
                  {trend.status === "stable" && <Minus className="w-5 h-5 text-blue-600 mt-0.5" />}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#2D3436]">{trend.metric}</p>
                    <p className="text-xs text-[#2D3436]/60">{trend.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Clinical Statistics */}
        {babyStats && (
          <motion.div
            className="bg-gradient-to-br from-[#A8D8EA]/20 to-[#FFE66D]/20 rounded-3xl p-5 shadow-sm mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <h3 className="font-bold text-[#2D3436] mb-2 text-sm">📈 How {babyName} Compares</h3>
            <p className="text-xs text-[#2D3436]/50 mb-3">Clinical benchmarks for {user.baby_age_months}-month-old babies</p>
            <div className="space-y-2 mb-3">
              {babyStats.statistics?.weight_lbs && (
                <div className="bg-white/60 rounded-xl p-3">
                  <p className="text-xs font-semibold text-[#2D3436]">Weight</p>
                  <p className="text-sm text-[#2D3436]/70">{babyStats.statistics.weight_lbs} ({babyStats.statistics.weight_range})</p>
                </div>
              )}
              {babyStats.statistics?.length_inches && (
                <div className="bg-white/60 rounded-xl p-3">
                  <p className="text-xs font-semibold text-[#2D3436]">Length</p>
                  <p className="text-sm text-[#2D3436]/70">{babyStats.statistics.length_inches} ({babyStats.statistics.length_range})</p>
                </div>
              )}
              {babyStats.statistics?.feeding_oz_per_day && (
                <div className="bg-white/60 rounded-xl p-3">
                  <p className="text-xs font-semibold text-[#2D3436]">Typical Feeding</p>
                  <p className="text-sm text-[#2D3436]/70">{babyStats.statistics.feeding_oz_per_day} per day, {babyStats.statistics.feeding_frequency}</p>
                </div>
              )}
              {babyStats.statistics?.sleep_hours && (
                <div className="bg-white/60 rounded-xl p-3">
                  <p className="text-xs font-semibold text-[#2D3436]">Sleep</p>
                  <p className="text-sm text-[#2D3436]/70">{babyStats.statistics.sleep_hours} per day</p>
                </div>
              )}
            </div>
            <div className="flex items-start gap-2 p-2 bg-white/40 rounded-lg border border-[#2D3436]/10">
              <span className="text-xs text-[#2D3436]/50">📊 Data from</span>
              <span className="text-xs font-semibold text-[#2D3436]/70">{babyStats.source}</span>
            </div>
          </motion.div>
        )}

        {/* Resources */}
        {resources.length > 0 && (
          <motion.div
            className="bg-gradient-to-br from-[#A8D8EA]/20 to-[#FFE66D]/20 rounded-3xl p-5 shadow-sm mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="font-bold text-[#2D3436] mb-3">📚 Recommended Reading</h3>
            <div className="space-y-2">
              {resources.map((resource, i) => (
                <a
                  key={i}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-white/80 rounded-xl hover:bg-white transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-[#A8D8EA] flex-shrink-0" />
                  <span className="text-sm text-[#2D3436] flex-1">{resource.title}</span>
                </a>
              ))}
            </div>
          </motion.div>
        )}

        {/* Critical Keywords */}
        {criticalDetected.length > 0 && (
          <motion.div
            className="p-4 bg-[#FF6B6B]/10 rounded-2xl border border-[#FF6B6B]/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#FF6B6B] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#FF6B6B]">
                  Keywords flagged: {criticalDetected.join(", ")}
                </p>
                <p className="text-xs text-[#2D3436]/60 mt-1">
                  Consider discussing with {user.pediatrician_name || "your pediatrician"}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="px-5 py-6 max-w-lg mx-auto pb-24">
      <div className="mb-6 bg-gradient-to-br from-[#FFE66D]/20 to-[#A8D8EA]/20 rounded-3xl p-5 shadow-sm border-2 border-[#FFE66D]/30">
        <div className="flex items-start gap-4">
          <BeepDuck variant="chat" size="md" animate />
          <div className="flex-1">
            <p className="text-lg font-bold text-[#2D3436] mb-1">Daily Check-in with Beep</p>
            <p className="text-sm text-[#2D3436]/70">Let's talk about how {babyName} is doing today</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <span className="text-xs text-[#2D3436]/40 font-semibold">
          Question {currentQ + 1} of {totalQuestions}
        </span>
        <button
          onClick={() => setTtsEnabled(!ttsEnabled)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
            ttsEnabled ? "bg-[#A8D8EA]/20 text-[#A8D8EA]" : "bg-gray-100 text-gray-400"
          }`}
        >
          {ttsEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          Voice
        </button>
      </div>

      <div className="flex gap-1.5 mb-6">
        {Array.from({ length: totalQuestions }).map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition-all ${
              i < currentQ ? "bg-[#A8D8EA]" : i === currentQ ? "bg-[#FFE66D]" : "bg-[#FFE66D]/20"
            }`}
          />
        ))}
      </div>

      {generating ? (
        <LoadingDucky message="Generating personalized follow-ups..." />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-3xl p-5 shadow-sm">
              <p className="text-lg font-bold text-[#2D3436] leading-snug mb-3">
                {getCurrentQuestion()}
              </p>
              {speaking && (
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map(i => (
                      <motion.div
                        key={i}
                        className="w-1 bg-[#A8D8EA] rounded-full"
                        animate={{ height: [4, 20, 4] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-[#A8D8EA] font-semibold">Beep is speaking...</span>
                </div>
              )}
            </div>

            <div className={`rounded-3xl p-5 min-h-[140px] transition-all ${
              listening ? "bg-[#FFE66D]/20 border-2 border-[#FFE66D]" : "bg-white/80 border-2 border-transparent"
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-[#2D3436]/60">Your Response</span>
                {listening && (
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FFE66D] animate-pulse" />
                    <span className="text-xs text-[#FFE66D] font-bold">Listening...</span>
                  </div>
                )}
              </div>
              <p className="text-base text-[#2D3436] min-h-[60px] leading-relaxed">
                {transcript || (
                  <span className="text-[#2D3436]/30 italic">Tap Record and speak your answer...</span>
                )}
              </p>

              {criticalDetected.length > 0 && (
                <motion.div
                  className="mt-3 p-3 bg-[#FF6B6B]/10 rounded-xl"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#FF6B6B]" />
                    <span className="text-xs font-bold text-[#FF6B6B]">
                      Keywords detected: {criticalDetected.join(", ")}
                    </span>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                className={`flex-1 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-md ${
                  listening 
                    ? "bg-[#FFE66D] text-[#2D3436]"
                    : "bg-gradient-to-r from-[#A8D8EA] to-[#FFE66D] text-[#2D3436]"
                }`}
                whileTap={{ scale: 0.98 }}
                onClick={listening ? stopListening : startListening}
              >
                {listening ? (
                  <><MicOff className="w-5 h-5" /> Stop Recording</>
                ) : (
                  <><Mic className="w-5 h-5" /> Record Answer</>
                )}
              </motion.button>

              {transcript && (
                <motion.button
                  className="w-14 h-14 rounded-2xl bg-[#A8D8EA] text-white flex items-center justify-center shadow-lg"
                  whileTap={{ scale: 0.9 }}
                  onClick={confirmAnswer}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <ChevronRight className="w-6 h-6" />
                </motion.button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}