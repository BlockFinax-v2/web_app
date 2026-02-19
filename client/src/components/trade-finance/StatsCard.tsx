import React from "react";

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
}

export function StatsCard({ icon, label, value, sub }: StatsCardProps) {
  return (
    <div className="bg-background rounded-lg border p-4">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="text-xl font-semibold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}
