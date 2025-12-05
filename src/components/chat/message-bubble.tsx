"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { User, Bot, Copy, Check, Play, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

interface ExecutionResult {
  success: boolean;
  output: string | null;
  error: string | null;
  runtime?: string;
  hint?: string;
}

const EXECUTABLE_LANGUAGES: Record<string, { endpoint: string; label: string; color: string }> = {
  python: { endpoint: "/api/execute", label: "Python", color: "bg-yellow-600 hover:bg-yellow-700" },
  py: { endpoint: "/api/execute", label: "Python", color: "bg-yellow-600 hover:bg-yellow-700" },
  javascript: { endpoint: "/api/execute-js", label: "JS", color: "bg-amber-500 hover:bg-amber-600" },
  js: { endpoint: "/api/execute-js", label: "JS", color: "bg-amber-500 hover:bg-amber-600" },
  typescript: { endpoint: "/api/execute-js", label: "TS", color: "bg-blue-600 hover:bg-blue-700" },
  ts: { endpoint: "/api/execute-js", label: "TS", color: "bg-blue-600 hover:bg-blue-700" },
  wasm: { endpoint: "/api/execute-wasm", label: "WASM", color: "bg-purple-600 hover:bg-purple-700" },
  wat: { endpoint: "/api/execute-wasm", label: "WAT", color: "bg-purple-600 hover:bg-purple-700" },
};

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [copied, setCopied] = useState(false);

  const langKey = language.toLowerCase();
  const langConfig = EXECUTABLE_LANGUAGES[langKey];
  const isExecutable = !!langConfig;

  const executeCode = async () => {
    if (!langConfig) return;

    setIsExecuting(true);
    setResult(null);

    try {
      const response = await fetch(langConfig.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language: langKey }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        output: null,
        error: error instanceof Error ? error.message : "Execution failed",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg overflow-hidden border border-slate-700 my-3">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <span className="text-xs font-mono text-slate-400">{language}</span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={copyCode}
            className="h-6 px-2 text-slate-400 hover:text-white hover:bg-slate-700"
          >
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
          </Button>
          {isExecutable && langConfig && (
            <Button
              size="sm"
              onClick={executeCode}
              disabled={isExecuting}
              className={cn("h-6 px-2 gap-1 text-white", langConfig.color)}
            >
              {isExecuting ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Play size={12} />
              )}
              <span className="text-xs">{isExecuting ? "Running" : `Run ${langConfig.label}`}</span>
            </Button>
          )}
        </div>
      </div>

      <pre className="p-4 bg-slate-900 text-slate-100 overflow-x-auto">
        <code className={`language-${language}`}>{code}</code>
      </pre>

      {result && (
        <div className={cn(
          "px-4 py-3 border-t border-slate-700",
          result.success ? "bg-slate-800" : "bg-red-950/50"
        )}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle size={14} className="text-green-400" />
              ) : (
                <XCircle size={14} className="text-red-400" />
              )}
              <span className={cn(
                "text-xs font-medium",
                result.success ? "text-green-400" : "text-red-400"
              )}>
                {result.success ? "Output" : "Error"}
              </span>
            </div>
            {result.runtime && (
              <span className="text-xs text-slate-500 font-mono">
                {result.runtime}
              </span>
            )}
          </div>
          <pre className="text-sm font-mono whitespace-pre-wrap text-slate-300 overflow-x-auto">
            {result.output || result.error || "No output"}
          </pre>
          {result.hint && (
            <p className="mt-2 text-xs text-slate-400 italic">
              {result.hint}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function MessageBubble({ role, content, isStreaming }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Bot size={16} className="text-white" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-blue-600 text-white"
            : "bg-slate-800 text-slate-100"
        )}
      >
        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown
            components={{
              code: ({ className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || "");
                const isInline = !match;

                if (isInline) {
                  return (
                    <code className="px-1.5 py-0.5 bg-slate-700 rounded text-sm" {...props}>
                      {children}
                    </code>
                  );
                }

                return (
                  <CodeBlock
                    code={String(children).replace(/\n$/, "")}
                    language={match[1]}
                  />
                );
              },
              pre: ({ children }) => <>{children}</>,
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
            }}
          >
            {content}
          </ReactMarkdown>
          {isStreaming && (
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="inline-block w-2 h-5 bg-blue-500 ml-1 rounded-sm"
            />
          )}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
          <User size={16} className="text-slate-300" />
        </div>
      )}
    </motion.div>
  );
}
