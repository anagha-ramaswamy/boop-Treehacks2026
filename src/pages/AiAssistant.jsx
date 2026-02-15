import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/boop/PageHeader";
import ChatBubble from "@/components/chat/ChatBubble";
import { Send, Sparkles, Mic, MicOff } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function AiAssistant() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatEnd = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const { data: cryLogs = [] } = useQuery({
    queryKey: ["cryLogs"],
    queryFn: () => base44.entities.CryLog.list("-created_date", 20),
  });
  const { data: diaperLogs = [] } = useQuery({
    queryKey: ["diaperLogs"],
    queryFn: () => base44.entities.DiaperLog.list("-created_date", 20),
  });
  const { data: surveys = [] } = useQuery({
    queryKey: ["surveys"],
    queryFn: () => base44.entities.SurveyResponse.list("-created_date", 7),
  });

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Welcome message
  useEffect(() => {
    if (user && messages.length === 0) {
      const babyName = user.baby_name || "your baby";
      setMessages([{
        role: "assistant",
        content: `Hi ${user.full_name?.split(" ")[0]}! 🐥 I'm your AI pediatric assistant. I have access to ${babyName}'s cry logs, diaper entries, and daily surveys to give you personalized advice.\n\nFeel free to ask me anything about ${babyName}'s care — I'm here to help!`,
        timestamp: new Date().toISOString(),
      }]);
    }
  }, [user]);

  const buildContext = () => {
    const babyName = user?.baby_name || "the baby";
    let ctx = `Baby's name: ${babyName}. Age: ${user?.baby_age_months || "unknown"} months.\n`;
    
    if (cryLogs.length > 0) {
      ctx += `\nRecent cry logs (last ${cryLogs.length}):\n`;
      cryLogs.slice(0, 5).forEach(l => {
        ctx += `- ${new Date(l.created_date).toLocaleDateString()}: ${l.classification} (${l.confidence}% confidence)\n`;
      });
    }
    if (diaperLogs.length > 0) {
      ctx += `\nRecent diaper logs (last ${diaperLogs.length}):\n`;
      diaperLogs.slice(0, 5).forEach(l => {
        ctx += `- ${new Date(l.created_date).toLocaleDateString()}: ${l.classification} - ${l.clinical_note}\n`;
      });
    }
    if (surveys.length > 0) {
      ctx += `\nRecent survey responses:\n`;
      surveys.slice(0, 3).forEach(s => {
        ctx += `- ${s.date}: ${JSON.stringify(s.responses || {})}\n`;
      });
    }
    return ctx;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim(), timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const context = buildContext();
    const conversationHistory = messages.slice(-10).map(m => `${m.role}: ${m.content}`).join("\n");

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a supportive pediatric AI assistant named Boop helping parents with baby care questions. You have access to the following data from the app:\n\n${context}\n\nConversation history:\n${conversationHistory}\n\nUser: ${userMsg.content}\n\nBe warm, empathetic, reassuring, and evidence-based. Use conversational markers like "I understand this is stressful" and reference specific baby data when relevant. Reference the baby by name frequently. Keep responses concise but helpful. If there are concerning patterns, gently suggest consulting a pediatrician.`,
    });

    setMessages(prev => [
      ...prev,
      { role: "assistant", content: response, timestamp: new Date().toISOString() },
    ]);
    setLoading(false);

    // Save to ChatMessage entity
    await base44.entities.ChatMessage.create({ role: "user", content: userMsg.content, timestamp: userMsg.timestamp });
    await base44.entities.ChatMessage.create({ role: "assistant", content: response, timestamp: new Date().toISOString() });
  };

  // Voice input
  const toggleVoice = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return;
    
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(r => r[0].transcript)
        .join("");
      setInput(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-lg mx-auto">
      <div className="px-5 pt-6">
        <PageHeader title="AI Assistant" subtitle="Ask me anything about baby care" emoji="💬" />
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <ChatBubble key={i} message={msg} babyName={user?.baby_name} />
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            className="flex items-center gap-2 px-4 py-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-[#FFB347]"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
            <span className="text-xs text-[#2D3436]/40">Thinking...</span>
          </motion.div>
        )}
        <div ref={chatEnd} />
      </div>

      {/* Input Area */}
      <div className="px-5 pb-5 pt-3 bg-gradient-to-t from-[#FFF8E7] to-transparent">
        <div className="flex items-end gap-2 bg-white rounded-2xl p-2 shadow-sm border border-[#FFE66D]/30">
          <button
            onClick={toggleVoice}
            className={`p-2.5 rounded-xl transition-colors flex-shrink-0 ${
              isListening ? "bg-[#FF6B6B]/10 text-[#FF6B6B]" : "text-[#2D3436]/30 hover:text-[#FFB347]"
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about baby care..."
            className="flex-1 border-0 focus-visible:ring-0 resize-none min-h-[40px] max-h-[120px] text-sm bg-transparent p-2"
            rows={1}
          />
          <motion.button
            className={`p-2.5 rounded-xl flex-shrink-0 transition-colors ${
              input.trim() ? "bg-[#FFB347] text-white" : "bg-[#FFE66D]/30 text-[#2D3436]/20"
            }`}
            whileTap={{ scale: 0.9 }}
            onClick={sendMessage}
            disabled={!input.trim() || loading}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}