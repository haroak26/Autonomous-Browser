import { useEffect, useState } from "react";
import { AddressBar } from "@/components/browser/AddressBar";
import { Viewport } from "@/components/browser/Viewport";
import { ChatPanel } from "@/components/browser/ChatPanel";
import { useBrowserStatus, useBrowserAction, useLaunchBrowser } from "@/hooks/use-browser";
import { motion } from "framer-motion";
import { PanelRightOpen, PanelRightClose } from "lucide-react";

export default function Home() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  
  const { data: browserState, isLoading: isStatusLoading } = useBrowserStatus();
  const actionMutation = useBrowserAction();
  const launchMutation = useLaunchBrowser();

  // Launch browser on mount if not ready
  useEffect(() => {
    // A simple check could be implemented here, but for now we just try to ensure it's launched
    // Or we could trigger it manually via a button. Let's assume auto-launch for better UX.
    launchMutation.mutate();
  }, []);

  const handleNavigate = (url: string) => {
    actionMutation.mutate({ action: "navigate", url });
  };

  const handleReload = () => {
    actionMutation.mutate({ action: "reload" });
  };

  const handleBack = () => {
    actionMutation.mutate({ action: "back" });
  };

  const handleForward = () => {
    actionMutation.mutate({ action: "forward" });
  };

  const handleInteract = (type: "click", x: number, y: number) => {
    actionMutation.mutate({ action: type, x, y });
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Top Navigation Bar */}
      <AddressBar 
        currentUrl={browserState?.url || ""}
        isLoading={browserState?.isLoading || actionMutation.isPending}
        onNavigate={handleNavigate}
        onReload={handleReload}
        onBack={handleBack}
        onForward={handleForward}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        <Viewport 
          screenshot={browserState?.screenshot}
          isLoading={browserState?.isLoading || actionMutation.isPending}
          onInteract={handleInteract}
        />

        {/* Floating Sidebar Toggle (Visible when closed) */}
        {!isSidebarOpen && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute right-4 top-4 z-40 p-2 bg-primary text-primary-foreground rounded-lg shadow-lg hover:bg-primary/90 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <PanelRightOpen className="w-5 h-5" />
          </motion.button>
        )}

        {/* Collapsible Sidebar */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ 
            width: isSidebarOpen ? "auto" : 0,
            opacity: isSidebarOpen ? 1 : 0
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="relative h-full flex"
        >
          {isSidebarOpen && (
            <>
              <ChatPanel />
              {/* Close Button inside panel */}
              <button
                className="absolute top-2 right-2 z-50 p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <PanelRightClose className="w-4 h-4" />
              </button>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
