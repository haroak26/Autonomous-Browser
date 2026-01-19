import { Globe, Loader2, MousePointer2 } from "lucide-react";
import { motion } from "framer-motion";

interface ViewportProps {
  screenshot?: string;
  isLoading: boolean;
  onInteract: (type: "click", x: number, y: number) => void;
}

export function Viewport({ screenshot, isLoading, onInteract }: ViewportProps) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!screenshot) return;
    
    // Calculate relative coordinates (0-1) or absolute pixels depending on backend expectation
    // Assuming backend wants pixels relative to viewport
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    onInteract("click", x, y);
  };

  return (
    <div className="flex-1 bg-black/40 relative overflow-hidden flex flex-col items-center justify-center p-8">
      {/* CRT Scanline Effect Overlay */}
      <div className="absolute inset-0 z-10 crt-overlay pointer-events-none opacity-30" />
      <div className="absolute inset-0 z-10 stealth-scan-line" />

      {/* Main Viewport Container */}
      <motion.div 
        className="relative w-full h-full max-w-6xl bg-white/5 rounded-lg border border-white/10 shadow-2xl overflow-hidden backdrop-blur-sm"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {screenshot ? (
          <div 
            className="w-full h-full relative cursor-crosshair group"
            onClick={handleClick}
          >
            <img 
              src={`data:image/png;base64,${screenshot}`} 
              alt="Browser Viewport" 
              className="w-full h-full object-contain bg-white"
            />
            
            {/* Hover Interaction Effect */}
            <div className="absolute pointer-events-none w-8 h-8 rounded-full border-2 border-primary/50 -translate-x-1/2 -translate-y-1/2 hidden group-hover:block transition-transform duration-75 ease-out z-20 mix-blend-difference" 
                 style={{ 
                   left: 'var(--mouse-x)', 
                   top: 'var(--mouse-y)' 
                 }} 
            />
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
            <div className="w-24 h-24 rounded-full bg-secondary/50 flex items-center justify-center mb-4 border border-white/5">
              <Globe className="w-10 h-10 text-primary/50" />
            </div>
            <h3 className="text-xl font-medium text-foreground">Ready to Browse</h3>
            <p className="max-w-md text-center text-sm">
              Enter a URL or ask Scout AI to navigate for you. 
              Stealth mode is active and protecting your identity.
            </p>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="text-sm font-medium text-primary animate-pulse">Loading content...</span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
