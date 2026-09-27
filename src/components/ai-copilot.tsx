"use client";

import React, { useState, useRef, useEffect } from "react";

type Message = {
  id: string;
  role: "user" | "model";
  content: string;
};

export function AiCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "0", role: "model", content: "Hi! I'm your LocaToGo AI Copilot. Looking for a new role? Tell me what you're looking for (e.g., 'Find me remote React jobs' or 'Who is hiring for Python in SF?')." }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const modelMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: modelMessageId, role: "model", content: "" }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] })
      });

      if (!response.ok) throw new Error("Failed to fetch response");
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          
          setMessages(prev => prev.map(msg => 
            msg.id === modelMessageId ? { ...msg, content: msg.content + chunk } : msg
          ));
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => prev.map(msg => 
        msg.id === modelMessageId ? { ...msg, content: "Sorry, I encountered an error. Please try again." } : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  // Simple markdown renderer for bold and links
  const renderMessage = (text: string) => {
    // This is a naive regex parser for MVP. In production, use a library like ReactMarkdown.
    const parts = text.split(/(\[.*?\]\(.*?\)|\*\*.*?\*\*|\n)/g);
    
    return parts.map((part, i) => {
      if (part === "\\n") return <br key={i} />;
      
      const boldMatch = part.match(/\*\*(.*?)\*\*/);
      if (boldMatch) return <strong key={i} className="font-bold text-slate-900 dark:text-white">{boldMatch[1]}</strong>;
      
      const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) return <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold">{linkMatch[1]}</a>;
      
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-3 sm:mb-4 w-[calc(100vw-32px)] sm:w-96 h-[60vh] min-h-[400px] max-h-[500px] flex flex-col bg-white/80 dark:bg-[#0d1424]/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-3xl overflow-hidden transition-all duration-300 ease-in-out origin-bottom-right">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-slate-900 dark:bg-[#151b2b] border-b border-slate-800 text-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800/80 border border-slate-700/50 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-slate-300">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-sm tracking-wide text-slate-100">AI Career Assistant</h3>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/50 scroll-smooth">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div 
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                    msg.role === "user" 
                      ? "bg-slate-800 text-white rounded-br-none" 
                      : "bg-white dark:bg-[#151b2b] border border-slate-200/50 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-bl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{renderMessage(msg.content)}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 text-slate-400 rounded-2xl rounded-bl-none px-4 py-3 flex gap-1.5">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white dark:bg-[#0d1424] border-t border-slate-100 dark:border-slate-800">
            <form onSubmit={handleSubmit} className="flex items-center gap-2 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything..."
                className="flex-1 bg-slate-100 dark:bg-slate-900 border-none rounded-full pl-4 pr-10 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500/50 outline-none placeholder:text-slate-500"
                disabled={isLoading}
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-1.5 p-2 rounded-full bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${
          isOpen 
            ? "bg-slate-800 dark:bg-[#151b2b] border border-slate-700 text-white rotate-90" 
            : "bg-slate-900 dark:bg-slate-800 border border-slate-800 dark:border-slate-700 text-white hover:bg-slate-800 dark:hover:bg-slate-700"
        }`}
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        )}
      </button>
    </div>
  );
}
