import { Badge } from "@/components/ui/badge";
import { Brain, Search, Pencil, Wrench, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type AgentType = "strategy" | "audit" | "content" | "fix" | "ranking";

interface AgentBadgeProps {
  agentType: AgentType;
  showIcon?: boolean;
  className?: string;
  isActive?: boolean;
}

const agentConfig = {
  strategy: {
    label: "Strategy",
    icon: Brain,
    className: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20",
    activeColor: "bg-purple-500",
  },
  audit: {
    label: "Audit",
    icon: Search,
    className: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
    activeColor: "bg-blue-500",
  },
  content: {
    label: "Content",
    icon: Pencil,
    className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    activeColor: "bg-emerald-500",
  },
  fix: {
    label: "Fix",
    icon: Wrench,
    className: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20",
    activeColor: "bg-orange-500",
  },
  ranking: {
    label: "Ranking",
    icon: TrendingUp,
    className: "bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/20",
    activeColor: "bg-pink-500",
  },
};

export function AgentBadge({ agentType, showIcon = true, className, isActive }: AgentBadgeProps) {
  const config = agentConfig[agentType];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn("border font-medium gap-1.5 relative", config.className, className)}
      data-testid={`badge-agent-${agentType}`}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
      {isActive && (
        <span className={cn("absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full animate-pulse-dot", config.activeColor)} />
      )}
    </Badge>
  );
}

export function AgentAvatar({ agentType, size = "md" }: { agentType: AgentType; size?: "sm" | "md" | "lg" }) {
  const config = agentConfig[agentType];
  const Icon = config.icon;
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };
  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center",
        sizeClasses[size],
        config.className
      )}
      data-testid={`avatar-agent-${agentType}`}
    >
      <Icon className={iconSizes[size]} />
    </div>
  );
}
