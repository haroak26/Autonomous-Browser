import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, RotateCw, Search, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

interface AddressBarProps {
  currentUrl: string;
  isLoading: boolean;
  onNavigate: (url: string) => void;
  onReload: () => void;
  onBack: () => void;
  onForward: () => void;
}

export function AddressBar({
  currentUrl,
  isLoading,
  onNavigate,
  onReload,
  onBack,
  onForward,
}: AddressBarProps) {
  const [inputUrl, setInputUrl] = useState(currentUrl);

  useEffect(() => {
    setInputUrl(currentUrl);
  }, [currentUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    
    // Add protocol if missing
    let urlToNavigate = inputUrl.trim();
    if (!/^https?:\/\//i.test(urlToNavigate)) {
      urlToNavigate = `https://${urlToNavigate}`;
    }
    
    onNavigate(urlToNavigate);
  };

  return (
    <div className="h-16 px-4 flex items-center gap-3 bg-card border-b border-border/50 shadow-sm z-20 relative">
      <div className="flex items-center gap-1 text-muted-foreground">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-secondary/50 rounded-full transition-colors hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button 
          onClick={onForward}
          className="p-2 hover:bg-secondary/50 rounded-full transition-colors hover:text-foreground"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <button 
          onClick={onReload}
          className="p-2 hover:bg-secondary/50 rounded-full transition-colors hover:text-foreground relative"
          disabled={isLoading}
        >
          <RotateCw className={`w-5 h-5 ${isLoading ? 'animate-spin text-primary' : ''}`} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 relative group">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder="Enter URL or search..."
          className="w-full h-10 pl-10 pr-12 rounded-lg bg-secondary/30 border border-white/5 hover:border-white/10 focus:border-primary/50 focus:bg-secondary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none font-mono text-sm text-foreground placeholder:text-muted-foreground/50"
        />
        <div className="absolute inset-y-0 right-3 flex items-center">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-accent/10 text-accent border border-accent/20">
            <ShieldCheck className="w-3 h-3" />
            <span>Stealth</span>
          </div>
        </div>
      </form>

      {/* Loading Progress Bar */}
      {isLoading && (
        <motion.div 
          className="absolute bottom-0 left-0 h-[2px] bg-primary shadow-[0_0_10px_rgba(139,92,246,0.5)] z-30"
          initial={{ width: "0%" }}
          animate={{ width: "80%" }}
          transition={{ duration: 2, ease: "circOut" }}
        />
      )}
    </div>
  );
}
