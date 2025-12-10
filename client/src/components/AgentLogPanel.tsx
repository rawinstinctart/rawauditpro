import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AgentAvatar, AgentBadge } from "./AgentBadge";
import { cn } from "@/lib/utils";
import type { AgentLog, Audit } from "@shared/schema";
import { formatDistanceToNow, format } from "date-fns";
import { de } from "date-fns/locale";
import { Sparkles, Clock, Search, BarChart3, Calculator, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface AgentLogPanelProps {
  logs: AgentLog[];
  className?: string;
  maxHeight?: string;
  showHeader?: boolean;
}

export function AgentLogPanel({ 
  logs, 
  className, 
  maxHeight = "h-80",
  showHeader = true 
}: AgentLogPanelProps) {
  return (
    <Card className={cn("overflow-hidden", className)} data-testid="agent-log-panel">
      {showHeader && (
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Agent-Aktivität
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <ScrollArea className={cn(maxHeight)}>
          <div className="p-4 space-y-4">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Noch keine Agent-Aktivität</p>
                <p className="text-xs mt-1">Starte einen Audit, um die KI-Agenten in Aktion zu sehen</p>
              </div>
            ) : (
              logs.map((log) => (
                <AgentLogEntry key={log.id} log={log} />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function AgentLogEntry({ log }: { log: AgentLog }) {
  return (
    <div className="flex gap-3 group" data-testid={`agent-log-${log.id}`}>
      <AgentAvatar agentType={log.agentType as any} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <AgentBadge agentType={log.agentType as any} showIcon={false} />
          <span className="text-xs text-muted-foreground">
            {log.createdAt ? formatDistanceToNow(new Date(log.createdAt), { addSuffix: true }) : "just now"}
          </span>
        </div>
        <p className="text-sm text-foreground leading-relaxed">{log.message}</p>
        {log.reasoning && (
          <div className="mt-2 pl-3 border-l-2 border-muted">
            <p className="text-xs text-muted-foreground italic">{log.reasoning}</p>
          </div>
        )}
        {log.action && (
          <div className="mt-2">
            <span className="text-xs font-medium text-primary">Aktion: </span>
            <span className="text-xs text-muted-foreground">{log.action}</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface AgentThinkingIndicatorProps {
  activeAgents: string[];
}

export function AgentThinkingIndicator({ activeAgents }: AgentThinkingIndicatorProps) {
  if (activeAgents.length === 0) return null;

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg" data-testid="agent-thinking-indicator">
      <div className="flex gap-1">
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: "0ms" }} />
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: "200ms" }} />
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: "400ms" }} />
      </div>
      <span className="text-xs text-muted-foreground">
        {activeAgents.length === 1
          ? `${activeAgents[0]}-Agent denkt nach...`
          : `${activeAgents.length} Agenten denken nach...`}
      </span>
    </div>
  );
}

type AuditStatus = "queued" | "crawling" | "analyzing" | "scoring" | "finalized" | "failed";

interface LifecyclePhase {
  status: AuditStatus;
  label: string;
  icon: typeof Clock;
}

const LIFECYCLE_PHASES: LifecyclePhase[] = [
  { status: "queued", label: "Warteschlange", icon: Clock },
  { status: "crawling", label: "Crawling", icon: Search },
  { status: "analyzing", label: "Analyse", icon: BarChart3 },
  { status: "scoring", label: "Bewertung", icon: Calculator },
  { status: "finalized", label: "Abgeschlossen", icon: CheckCircle2 },
];

function getPhaseIndex(status: AuditStatus): number {
  if (status === "failed") return -1;
  return LIFECYCLE_PHASES.findIndex(p => p.status === status);
}

interface AuditLifecycleTimelineProps {
  audit: {
    status: string | null;
    createdAt: Date | string | null;
    completedAt?: Date | string | null;
    currentStep?: string | null;
  };
  className?: string;
}

export function AuditLifecycleTimeline({ audit, className }: AuditLifecycleTimelineProps) {
  const currentIndex = getPhaseIndex(audit.status as AuditStatus);
  const isFailed = audit.status === "failed";

  return (
    <Card className={cn("overflow-hidden", className)} data-testid="audit-lifecycle-timeline">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Audit-Phasen
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-0">
          {LIFECYCLE_PHASES.map((phase, index) => {
            const Icon = phase.icon;
            const isComplete = currentIndex > index || (audit.status === "finalized" && phase.status === "finalized");
            const isCurrent = currentIndex === index && audit.status !== "finalized";
            const isPending = currentIndex < index;
            
            return (
              <div key={phase.status} className="flex gap-3" data-testid={`phase-${phase.status}`}>
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                    isComplete && "bg-green-500 text-white",
                    isCurrent && "bg-primary text-primary-foreground",
                    isPending && "bg-muted text-muted-foreground",
                    isFailed && index === 0 && "bg-destructive text-destructive-foreground"
                  )}>
                    {isCurrent ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isComplete ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  {index < LIFECYCLE_PHASES.length - 1 && (
                    <div className={cn(
                      "w-0.5 h-6 my-1 transition-colors",
                      isComplete ? "bg-green-500" : "bg-muted"
                    )} />
                  )}
                </div>
                <div className="pt-1 pb-4 min-w-0">
                  <p className={cn(
                    "text-sm font-medium",
                    isPending && "text-muted-foreground"
                  )}>
                    {phase.label}
                  </p>
                  {isCurrent && audit.currentStep && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {audit.currentStep}
                    </p>
                  )}
                  {isComplete && index === 0 && audit.createdAt && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(audit.createdAt as string | Date), "HH:mm", { locale: de })}
                    </p>
                  )}
                  {isComplete && phase.status === "finalized" && audit.completedAt && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(audit.completedAt as string | Date), "HH:mm", { locale: de })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          
          {isFailed && (
            <div className="flex gap-3" data-testid="phase-failed">
              <div className="flex flex-col items-center">
                <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 bg-destructive text-destructive-foreground">
                  <XCircle className="h-4 w-4" />
                </div>
              </div>
              <div className="pt-1 min-w-0">
                <p className="text-sm font-medium text-destructive">Fehlgeschlagen</p>
                {audit.completedAt && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(audit.completedAt as string | Date), "HH:mm", { locale: de })}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
