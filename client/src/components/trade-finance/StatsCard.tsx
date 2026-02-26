import React from "react";

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
}

export function StatsCard({ icon, label, value, sub }: StatsCardProps) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm shadow-lg shadow-black/5 transition-all duration-300 hover:border-primary/20 hover:shadow-primary/5 hover:-translate-y-0.5 p-5">
      <div className="flex items-center gap-2 mb-2">
        <div className="rounded-lg bg-white/10 p-1.5 border border-white/5 shrink-0">
          {icon}
        </div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}
