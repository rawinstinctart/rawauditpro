import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AgentAvatar, AgentBadge } from "./AgentBadge";
import { cn } from "@/lib/utils";
import type { AgentLog } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { Sparkles } from "lucide-react";

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
            Agent Activity
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <ScrollArea className={cn(maxHeight)}>
          <div className="p-4 space-y-4">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No agent activity yet</p>
                <p className="text-xs mt-1">Start an audit to see AI agents in action</p>
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
            <span className="text-xs font-medium text-primary">Action: </span>
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
          ? `${activeAgents[0]} Agent is thinking...`
          : `${activeAgents.length} agents are thinking...`}
      </span>
    </div>
  );
}
