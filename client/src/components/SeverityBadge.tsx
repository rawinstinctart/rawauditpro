import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Severity = "critical" | "high" | "medium" | "low";

interface SeverityBadgeProps {
  severity: Severity;
  showIcon?: boolean;
  className?: string;
}

const severityConfig = {
  critical: {
    label: "Critical",
    icon: AlertCircle,
    className: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20",
  },
  high: {
    label: "High",
    icon: AlertTriangle,
    className: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20",
  },
  medium: {
    label: "Medium",
    icon: Info,
    className: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  },
  low: {
    label: "Low",
    icon: CheckCircle,
    className: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/20",
  },
};

export function SeverityBadge({ severity, showIcon = true, className }: SeverityBadgeProps) {
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn("border font-medium gap-1", config.className, className)}
      data-testid={`badge-severity-${severity}`}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
}
