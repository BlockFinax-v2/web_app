import { CheckCircle2, ArrowRight } from "lucide-react";
import { PROGRESS_STEPS, getProgressIndex } from "./constants";

interface ProgressTrackerProps {
  status: string;
}

export function ProgressTracker({ status }: ProgressTrackerProps) {
  const current = getProgressIndex(status);
  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {PROGRESS_STEPS.map((step, i) => (
        <div key={step} className="flex items-center shrink-0">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium ${
            i < current ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
            i === current ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
            "bg-muted text-muted-foreground"
          }`}>
            {i < current ? <CheckCircle2 className="h-3 w-3" /> : <span className="w-3 h-3 flex items-center justify-center">{i + 1}</span>}
            <span className="hidden sm:inline">{step}</span>
          </div>
          {i < PROGRESS_STEPS.length - 1 && <ArrowRight className="h-3 w-3 mx-0.5 text-muted-foreground shrink-0" />}
        </div>
      ))}
    </div>
  );
}
