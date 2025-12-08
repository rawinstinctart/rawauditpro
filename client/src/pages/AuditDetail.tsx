import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { HealthScore } from "@/components/HealthScore";
import { SeverityBadge } from "@/components/SeverityBadge";
import { DiffViewer } from "@/components/DiffViewer";
import { AgentLogPanel } from "@/components/AgentLogPanel";
import { IssueRow } from "@/components/IssueRow";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  AlertCircle,
  XCircle,
  Clock,
  Sparkles,
  Check,
  X,
  Zap,
} from "lucide-react";
import type { Audit, Issue, AgentLog, Website } from "@shared/schema";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export default function AuditDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const { data: audit, isLoading: auditLoading } = useQuery<Audit & { website?: Website }>({
    queryKey: ["/api/audits", id],
  });

  const { data: issues, isLoading: issuesLoading } = useQuery<Issue[]>({
    queryKey: ["/api/audits", id, "issues"],
    enabled: !!id,
  });

  const { data: agentLogs } = useQuery<AgentLog[]>({
    queryKey: ["/api/audits", id, "logs"],
    enabled: !!id,
    refetchInterval: audit?.status === "running" ? 2000 : false,
  });

  const approveMutation = useMutation({
    mutationFn: async (issueId: string) => {
      return apiRequest("POST", `/api/issues/${issueId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audits", id, "issues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/issues/pending"] });
      toast({
        title: "Change approved",
        description: "The fix has been queued for application.",
      });
      setSelectedIssue(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve change",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (issueId: string) => {
      return apiRequest("POST", `/api/issues/${issueId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audits", id, "issues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/issues/pending"] });
      toast({
        title: "Change rejected",
        description: "The suggested change has been dismissed.",
      });
      setSelectedIssue(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject change",
        variant: "destructive",
      });
    },
  });

  const autoFixMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/audits/${id}/auto-fix`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audits", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/audits", id, "issues"] });
      toast({
        title: "Auto-fix started",
        description: "Low-risk issues are being fixed automatically.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start auto-fix",
        variant: "destructive",
      });
    },
  });

  const statusConfig = {
    pending: { label: "Pending", icon: Clock, className: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20", animated: false },
    queued: { label: "Queued", icon: Clock, className: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20", animated: false },
    running: { label: "Running", icon: Loader2, className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", animated: true },
    completed: { label: "Completed", icon: CheckCircle, className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20", animated: false },
    failed: { label: "Failed", icon: XCircle, className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20", animated: false },
  };

  if (auditLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-16 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <h3 className="font-medium mb-1">Audit not found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The requested audit could not be found
            </p>
            <Button asChild>
              <Link href="/audits">Back to Audits</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = statusConfig[audit.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = status.icon;
  const pendingIssues = issues?.filter(i => i.status === "pending") || [];
  const lowRiskIssues = pendingIssues.filter(i => i.riskLevel === "low");

  return (
    <div className="p-6 space-y-6" data-testid="page-audit-detail">
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/audits">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold">{audit.website?.name || "Audit"}</h1>
            <Badge variant="outline" className={cn("gap-1 border", status.className)}>
              <StatusIcon className={cn("h-3 w-3", status.animated && "animate-spin")} />
              {status.label}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">{audit.website?.url}</p>
        </div>
        <div className="flex items-center gap-2">
          {audit.status === "completed" && (
            <Button variant="outline" asChild data-testid="button-view-report">
              <Link href={`/audits/${id}/report`}>
                Report anzeigen
              </Link>
            </Button>
          )}
          {lowRiskIssues.length > 0 && (
            <Button
              onClick={() => autoFixMutation.mutate()}
              disabled={autoFixMutation.isPending}
              data-testid="button-auto-fix"
            >
              {autoFixMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Auto-Fix {lowRiskIssues.length} Issues
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <HealthScore score={audit.score || 0} size="md" showLabel={false} />
            <div>
              <p className="text-sm text-muted-foreground">Health Score</p>
              <p className="text-xl font-bold">{audit.score || 0}/100</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Issues</p>
            <p className="text-2xl font-bold">{audit.totalIssues || 0}</p>
            <div className="flex items-center gap-2 mt-2">
              {(audit.criticalCount ?? 0) > 0 && <SeverityBadge severity="critical" showIcon={false} />}
              {(audit.highCount ?? 0) > 0 && <SeverityBadge severity="high" showIcon={false} />}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Pages Scanned</p>
            <p className="text-2xl font-bold">{audit.pagesScanned || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Pending Changes</p>
            <p className="text-2xl font-bold">{pendingIssues.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All Issues ({issues?.length || 0})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({pendingIssues.length})</TabsTrigger>
              <TabsTrigger value="critical">Critical ({audit.criticalCount || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <IssueTable
                issues={issues || []}
                isLoading={issuesLoading}
                onApprove={(id) => approveMutation.mutate(id)}
                onReject={(id) => rejectMutation.mutate(id)}
                onViewDetails={setSelectedIssue}
              />
            </TabsContent>
            <TabsContent value="pending" className="mt-4">
              <IssueTable
                issues={pendingIssues}
                isLoading={issuesLoading}
                onApprove={(id) => approveMutation.mutate(id)}
                onReject={(id) => rejectMutation.mutate(id)}
                onViewDetails={setSelectedIssue}
              />
            </TabsContent>
            <TabsContent value="critical" className="mt-4">
              <IssueTable
                issues={issues?.filter(i => i.severity === "critical") || []}
                isLoading={issuesLoading}
                onApprove={(id) => approveMutation.mutate(id)}
                onReject={(id) => rejectMutation.mutate(id)}
                onViewDetails={setSelectedIssue}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <AgentLogPanel
            logs={agentLogs || []}
            maxHeight="h-[600px]"
          />
        </div>
      </div>

      <Dialog open={!!selectedIssue} onOpenChange={() => setSelectedIssue(null)}>
        <DialogContent className="max-w-2xl">
          {selectedIssue && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedIssue.title}
                  <SeverityBadge severity={selectedIssue.severity as any} />
                </DialogTitle>
                <DialogDescription>
                  {selectedIssue.pageUrl}
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-4 py-4">
                  {selectedIssue.description && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Description</h4>
                      <p className="text-sm text-muted-foreground">{selectedIssue.description}</p>
                    </div>
                  )}
                  
                  {(selectedIssue.currentValue || selectedIssue.suggestedValue) && (
                    <DiffViewer
                      before={selectedIssue.currentValue || ""}
                      after={selectedIssue.suggestedValue || ""}
                      title="Suggested Change"
                    />
                  )}
                  
                  {selectedIssue.aiReasoning && (
                    <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <h4 className="text-sm font-medium">AI Reasoning</h4>
                        {selectedIssue.confidence && (
                          <Badge variant="outline" className="ml-auto text-xs">
                            {Math.round((selectedIssue.confidence || 0) * 100)}% confidence
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{selectedIssue.aiReasoning}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
              {selectedIssue.status === "pending" && (
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => rejectMutation.mutate(selectedIssue.id)}
                    disabled={rejectMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => approveMutation.mutate(selectedIssue.id)}
                    disabled={approveMutation.isPending}
                  >
                    {approveMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-1" />
                    )}
                    Approve Change
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function IssueTable({
  issues,
  isLoading,
  onApprove,
  onReject,
  onViewDetails,
}: {
  issues: Issue[];
  isLoading: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onViewDetails: (issue: Issue) => void;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (issues.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500/50" />
          <h3 className="font-medium mb-1">No issues found</h3>
          <p className="text-sm text-muted-foreground">
            Great job! No issues in this category.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            <TableHead>Issue</TableHead>
            <TableHead>Page</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Risk</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-20"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {issues.map((issue) => (
            <IssueRow
              key={issue.id}
              issue={issue}
              onApprove={onApprove}
              onReject={onReject}
            />
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
