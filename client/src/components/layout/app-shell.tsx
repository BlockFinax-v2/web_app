import { useState, useRef, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Compass, Briefcase, MessageCircle } from "lucide-react";

interface AppShellProps {
  children?: ReactNode; // We pass the Trade tab content (MainLayout) via children or render it here?
  tradeContent: ReactNode;
  exploreContent: ReactNode;
  chatContent: ReactNode;
}

type TabType = 'explore' | 'trade' | 'chat';

export function AppShell({ tradeContent, exploreContent, chatContent }: AppShellProps) {
  const [activeTab, setActiveTab] = useState<TabType>('trade');
  const [direction, setDirection] = useState(0);

  const switchTab = (newTab: TabType) => {
    const tabs = ['explore', 'trade', 'chat'];
    const oldIdx = tabs.indexOf(activeTab);
    const newIdx = tabs.indexOf(newTab);
    setDirection(newIdx > oldIdx ? 1 : -1);
    setActiveTab(newTab);
  };

  const swipeHandlers = {
    onDragEnd: (e: any, { offset, velocity }: any) => {
      const swipe = swipePower(offset.x, velocity.x);

      if (swipe < -swipeConfidenceThreshold) {
        // swipe left, go to next tab
        if (activeTab === 'explore') switchTab('trade');
        else if (activeTab === 'trade') switchTab('chat');
      } else if (swipe > swipeConfidenceThreshold) {
        // swipe right, go to prev tab
        if (activeTab === 'chat') switchTab('trade');
        else if (activeTab === 'trade') switchTab('explore');
      }
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden relative">
      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={activeTab}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            {...swipeHandlers}
            className="absolute inset-0 w-full h-full pb-16" // pb-16 to account for bottom nav
          >
            {activeTab === 'explore' && exploreContent}
            {activeTab === 'trade' && tradeContent}
            {activeTab === 'chat' && chatContent}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around z-50 px-2 sm:px-6">
        <button
          onClick={() => switchTab('explore')}
          className={cn(
            "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
            activeTab === 'explore' ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Compass className="h-6 w-6" />
          <span className="text-[10px] font-medium tracking-wider uppercase">Explore</span>
        </button>

        <button
          onClick={() => switchTab('trade')}
          className={cn(
            "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors relative",
            activeTab === 'trade' ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {/* A cool floating indicator for Trade since it's the main hub */}
          {activeTab === 'trade' && (
            <motion.div layoutId="nav-indicator" className="absolute -top-1 w-8 h-1 bg-primary rounded-full" />
          )}
          <Briefcase className="h-6 w-6" />
          <span className="text-[10px] font-medium tracking-wider uppercase">Trade</span>
        </button>

        <button
          onClick={() => switchTab('chat')}
          className={cn(
            "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
            activeTab === 'chat' ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <MessageCircle className="h-6 w-6" />
          <span className="text-[10px] font-medium tracking-wider uppercase">Chat</span>
        </button>
      </div>
    </div>
  );
}

const variants = {
  enter: (direction: number) => {
    return {
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    };
  },
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => {
    return {
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    };
  }
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};
