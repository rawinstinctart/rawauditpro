import { cn } from "@/lib/utils";

interface HealthScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function HealthScore({ score, size = "md", showLabel = true }: HealthScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getScoreRingColor = (score: number) => {
    if (score >= 80) return "stroke-green-500";
    if (score >= 60) return "stroke-yellow-500";
    if (score >= 40) return "stroke-orange-500";
    return "stroke-red-500";
  };

  const sizeConfig = {
    sm: { container: "h-12 w-12", text: "text-sm", stroke: 3 },
    md: { container: "h-16 w-16", text: "text-lg", stroke: 4 },
    lg: { container: "h-24 w-24", text: "text-2xl", stroke: 5 },
  };

  const config = sizeConfig[size];
  const circumference = 2 * Math.PI * 45;
  const progress = ((100 - score) / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1" data-testid="health-score">
      <div className={cn("relative", config.container)}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            className="stroke-muted"
            strokeWidth={config.stroke}
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            className={cn("transition-all duration-500", getScoreRingColor(score))}
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={progress}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold", config.text, getScoreColor(score))}>
            {score}
          </span>
        </div>
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground">Gesundheitswert</span>
      )}
    </div>
  );
}
