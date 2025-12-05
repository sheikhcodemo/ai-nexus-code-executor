"use client";

import { useState, useRef, useEffect } from "react";
import { MessageBubble } from "@/components/chat/message-bubble";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Sparkles, Code2, Cpu, Terminal } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      const assistantId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantMessage += chunk;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: assistantMessage } : m
          )
        );
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-col h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">AI Nexus</h1>
              <p className="text-xs text-slate-400">Multi-language code execution</p>
            </div>
          </div>
        </div>
      </header>

      <div className="border-b border-slate-800/50 bg-slate-900/30">
        <div className="max-w-4xl mx-auto px-4 py-2 flex gap-3 overflow-x-auto">
          <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full text-xs font-medium whitespace-nowrap">
            <Code2 size={12} /> JavaScript (QuickJS)
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 text-yellow-400 rounded-full text-xs font-medium whitespace-nowrap">
            <Terminal size={12} /> Python (E2B)
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-xs font-medium whitespace-nowrap">
            <Cpu size={12} /> WebAssembly
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex p-4 bg-slate-800/50 rounded-2xl mb-4">
                <Sparkles className="w-12 h-12 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Welcome to AI Nexus
              </h2>
              <p className="text-slate-400 max-w-md mx-auto">
                Ask me to write code in JavaScript, Python, or WebAssembly.
                You can execute code blocks directly in the chat!
              </p>
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
                {[
                  { text: "Write a JavaScript function to sort an array", lang: "JS" },
                  { text: "Create a Python script to calculate fibonacci", lang: "Python" },
                  { text: "Explain how WebAssembly works", lang: "WASM" },
                ].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(suggestion.text)}
                    className="p-3 text-left bg-slate-800/50 hover:bg-slate-800 rounded-xl text-sm text-slate-300 transition-colors"
                  >
                    <span className="text-xs text-slate-500 block mb-1">{suggestion.lang}</span>
                    {suggestion.text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                role={message.role}
                content={message.content}
                isStreaming={isLoading && message.id === messages[messages.length - 1]?.id && message.role === "assistant"}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-slate-800 bg-slate-900/80 backdrop-blur-xl">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me to write code..."
              className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
