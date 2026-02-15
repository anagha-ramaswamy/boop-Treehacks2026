import React from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

export default function ChatBubble({ message, babyName }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-[#FFE66D] flex items-center justify-center mr-2 mt-1 flex-shrink-0 shadow-sm">
          <span className="text-sm">🐥</span>
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-[#FFB347] text-white rounded-br-md"
            : "bg-white shadow-sm border border-[#FFE66D]/20 rounded-bl-md"
        }`}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed">{message.content}</p>
        ) : (
          <div className="text-sm leading-relaxed text-[#2D3436] prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="my-1">{children}</p>,
                ul: ({ children }) => <ul className="my-1 ml-3 list-disc">{children}</ul>,
                ol: ({ children }) => <ol className="my-1 ml-3 list-decimal">{children}</ol>,
                li: ({ children }) => <li className="my-0.5">{children}</li>,
                strong: ({ children }) => <strong className="font-bold text-[#2D3436]">{children}</strong>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        <p className={`text-[10px] mt-1.5 ${isUser ? "text-white/60" : "text-[#2D3436]/30"}`}>
          {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
        </p>
      </div>
    </motion.div>
  );
}