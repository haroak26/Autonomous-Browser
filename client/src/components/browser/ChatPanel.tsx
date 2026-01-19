import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAICommand } from "@/hooks/use-ai-assistant";
import { useBrowserStatus, useBrowserAction } from "@/hooks/use-browser";
import { BrowserActionRequest } from "@shared/schema";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function ChatPanel() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Scout AI ready. I can browse the web, extract data, and navigate for you. What's our mission?"
    }
  ]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: browserState } = useBrowserStatus();
  const aiMutation = useAICommand();
  const actionMutation = useBrowserAction();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || aiMutation.isPending) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");

    aiMutation.mutate(
      {
        message: userMsg.content,
        context: browserState,
      },
      {
        onSuccess: (response) => {
          const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: response.message,
          };
          setMessages(prev => [...prev, aiMsg]);

          if (response.action) {
            // Execute the action suggested by AI
            // In a real app, we might ask for confirmation or show what it's doing
            executeAIAction(response.action);
          }
        },
        onError: () => {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: "assistant",
            content: "I encountered an error processing your request.",
          }]);
        }
      }
    );
  };

  const executeAIAction = (action: BrowserActionRequest) => {
    actionMutation.mutate(action);
  };

  return (
    <div className="flex flex-col h-full bg-card border-l border-border shadow-xl w-80 lg:w-96 flex-shrink-0 z-30">
      <div className="p-4 border-b border-border bg-card/50 backdrop-blur-sm">
        <h2 className="text-sm font-bold flex items-center gap-2 text-foreground">
          <Sparkles className="w-4 h-4 text-primary" />
          Scout Intelligence
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Stealth Mode Active • GPT-4o Connected
        </p>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                ${msg.role === "assistant" ? "bg-primary/20 text-primary border border-primary/20" : "bg-muted text-muted-foreground"}
              `}>
                {msg.role === "assistant" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className={`
                rounded-2xl px-4 py-2.5 max-w-[85%] text-sm leading-relaxed
                ${msg.role === "assistant" 
                  ? "bg-secondary/50 text-secondary-foreground rounded-tl-none border border-white/5" 
                  : "bg-primary text-primary-foreground rounded-tr-none shadow-lg shadow-primary/10"}
              `}>
                {msg.content}
              </div>
            </motion.div>
          ))}
          {aiMutation.isPending && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary border border-primary/20 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex gap-1 items-center bg-secondary/30 rounded-2xl rounded-tl-none px-4 py-3">
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Scout to navigate..."
            className="w-full bg-secondary/50 border border-white/5 rounded-xl py-3 pl-4 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
            disabled={aiMutation.isPending}
          />
          <button
            type="submit"
            disabled={!input.trim() || aiMutation.isPending}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
