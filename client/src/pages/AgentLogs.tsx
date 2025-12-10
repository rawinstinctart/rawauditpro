import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AgentAvatar, AgentBadge } from "@/components/AgentBadge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Search, Filter, Brain, RefreshCw } from "lucide-react";
import type { AgentLog } from "@shared/schema";
import { formatDistanceToNow, format } from "date-fns";
import { useState } from "react";

const agentTypes = [
  { value: "all", label: "Alle Agenten" },
  { value: "strategy", label: "Strategie-Agent" },
  { value: "audit", label: "Audit-Agent" },
  { value: "content", label: "Content-Agent" },
  { value: "fix", label: "Fix-Agent" },
  { value: "ranking", label: "Ranking-Agent" },
];

export default function AgentLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [agentFilter, setAgentFilter] = useState("all");

  const { data: logs, isLoading, refetch, isRefetching } = useQuery<AgentLog[]>({
    queryKey: ["/api/agent-logs"],
    refetchInterval: 5000,
  });

  const filteredLogs = logs?.filter((log) => {
    const matchesSearch =
      !searchQuery ||
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.reasoning?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAgent = agentFilter === "all" || log.agentType === agentFilter;
    
    return matchesSearch && matchesAgent;
  });

  const agentStats = logs?.reduce((acc, log) => {
    acc[log.agentType] = (acc[log.agentType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="p-6 space-y-6" data-testid="page-agent-logs">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Agenten-Aktivität
          </h1>
          <p className="text-muted-foreground">KI-Agenten Gedanken und Aktionen überwachen</p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isRefetching}
          data-testid="button-refresh-logs"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
          Aktualisieren
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {["strategy", "audit", "content", "fix", "ranking"].map((agent) => (
          <Card
            key={agent}
            className={`cursor-pointer hover-elevate ${agentFilter === agent ? "ring-2 ring-primary" : ""}`}
            onClick={() => setAgentFilter(agentFilter === agent ? "all" : agent)}
            data-testid={`filter-agent-${agent}`}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <AgentAvatar agentType={agent as any} size="sm" />
              <div>
                <p className="text-sm font-medium capitalize">{agent}</p>
                <p className="text-xs text-muted-foreground">
                  {agentStats[agent] || 0} Einträge
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Logs durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-logs"
          />
        </div>
        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-48" data-testid="select-agent-filter">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Nach Agent filtern" />
          </SelectTrigger>
          <SelectContent>
            {agentTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Aktivitäts-Stream
            {filteredLogs && (
              <Badge variant="secondary" className="ml-2">
                {filteredLogs.length} Einträge
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredLogs && filteredLogs.length > 0 ? (
            <ScrollArea className="h-[600px]">
              <div className="divide-y">
                {filteredLogs.map((log) => (
                  <LogEntry key={log.id} log={log} />
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="py-16 text-center text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium mb-1">Keine Agenten-Aktivität</p>
              <p className="text-sm">
                {searchQuery || agentFilter !== "all"
                  ? "Keine Logs entsprechen deinen Filtern"
                  : "Starte einen Audit, um KI-Agenten in Aktion zu sehen"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LogEntry({ log }: { log: AgentLog }) {
  return (
    <div className="p-4 hover:bg-muted/30 transition-colors" data-testid={`log-entry-${log.id}`}>
      <div className="flex gap-3">
        <AgentAvatar agentType={log.agentType as any} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <AgentBadge agentType={log.agentType as any} showIcon={false} />
            <span className="text-xs text-muted-foreground">
              {log.createdAt
                ? format(new Date(log.createdAt), "MMM d, h:mm a")
                : "Just now"}
            </span>
            <span className="text-xs text-muted-foreground">
              ({log.createdAt
                ? formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })
                : "just now"})
            </span>
          </div>
          <p className="text-sm text-foreground mb-2">{log.message}</p>
          {log.reasoning && (
            <div className="bg-muted/50 rounded-lg p-3 mb-2">
              <p className="text-xs font-medium text-muted-foreground mb-1">Begründung</p>
              <p className="text-sm text-muted-foreground italic">{log.reasoning}</p>
            </div>
          )}
          {log.action && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Aktion: {log.action}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
