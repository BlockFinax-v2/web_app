
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  gradient?: boolean;
  hoverEffect?: boolean;
}

export function GlassCard({ 
  children, 
  className, 
  gradient = false,
  hoverEffect = true 
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-card/80 backdrop-blur-md transition-all duration-300",
        hoverEffect && "hover:border-brand-primary/50 hover:shadow-md hover:-translate-y-1",
        gradient && "bg-gradient-to-br from-muted/50 to-card/80",
        className
      )}
    >
      {gradient && (
        <div className="absolute inset-0 bg-gradient-to-br from-brand-neon/5 via-transparent to-brand-primary/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      )}
      <div className="relative z-10 p-6 h-full">
        {children}
      </div>
    </div>
  );
}
