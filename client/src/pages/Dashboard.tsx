import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WebsiteCard, WebsiteCardSkeleton } from "@/components/WebsiteCard";
import { AgentLogPanel } from "@/components/AgentLogPanel";
import { AddWebsiteDialog } from "@/components/AddWebsiteDialog";
import { HealthScore } from "@/components/HealthScore";
import { SeverityBadge } from "@/components/SeverityBadge";
import { Link } from "wouter";
import {
  Globe,
  Search,
  AlertCircle,
  Clock,
  Plus,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Play,
} from "lucide-react";
import type { Website, Audit, Issue, AgentLog } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { data: websites, isLoading: websitesLoading } = useQuery<Website[]>({
    queryKey: ["/api/websites"],
  });

  const { data: recentAudits, isLoading: auditsLoading } = useQuery<Audit[]>({
    queryKey: ["/api/audits/recent"],
  });

  const { data: pendingIssues, isLoading: issuesLoading } = useQuery<Issue[]>({
    queryKey: ["/api/issues/pending"],
  });

  const { data: agentLogs, isLoading: logsLoading } = useQuery<AgentLog[]>({
    queryKey: ["/api/agent-logs/recent"],
  });

  const stats = {
    totalSites: websites?.length || 0,
    activeAudits: recentAudits?.filter(a => a.status === "running").length || 0,
    pendingChanges: pendingIssues?.length || 0,
    avgScore: websites?.length
      ? Math.round(websites.reduce((sum, w) => sum + (w.healthScore || 0), 0) / websites.length)
      : 0,
  };

  return (
    <div className="p-6 space-y-6" data-testid="page-dashboard">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">Monitor and optimize your websites' SEO</p>
        </div>
        <div className="flex items-center gap-2">
          <AddWebsiteDialog />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Websites"
          value={stats.totalSites}
          icon={Globe}
          loading={websitesLoading}
        />
        <StatCard
          title="Active Audits"
          value={stats.activeAudits}
          icon={Search}
          loading={auditsLoading}
          highlight={stats.activeAudits > 0}
        />
        <StatCard
          title="Pending Changes"
          value={stats.pendingChanges}
          icon={AlertCircle}
          loading={issuesLoading}
          highlight={stats.pendingChanges > 0}
        />
        <Card>
          <CardContent className="p-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Avg. Health Score</p>
              {websitesLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-bold">{stats.avgScore}</p>
              )}
            </div>
            <HealthScore score={stats.avgScore} size="md" showLabel={false} />
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Your Websites
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/websites">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {websitesLoading ? (
                <div className="grid md:grid-cols-2 gap-4">
                  <WebsiteCardSkeleton />
                  <WebsiteCardSkeleton />
                </div>
              ) : websites && websites.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {websites.slice(0, 4).map((website) => (
                    <WebsiteCard
                      key={website.id}
                      website={website}
                      onClick={(id) => window.location.href = `/websites/${id}`}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium mb-2">No websites yet</p>
                  <p className="text-sm mb-4">Add your first website to start optimizing</p>
                  <AddWebsiteDialog
                    trigger={
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Website
                      </Button>
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Pending Changes
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/audits">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {issuesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : pendingIssues && pendingIssues.length > 0 ? (
                <div className="space-y-3">
                  {pendingIssues.slice(0, 5).map((issue) => (
                    <div
                      key={issue.id}
                      className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50 hover-elevate"
                      data-testid={`pending-issue-${issue.id}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{issue.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{issue.pageUrl}</p>
                      </div>
                      <SeverityBadge severity={issue.severity as any} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No pending changes</p>
                  <p className="text-xs mt-1">Run an audit to find optimization opportunities</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <AgentLogPanel
            logs={agentLogs || []}
            maxHeight="h-[400px]"
          />

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Audits
              </CardTitle>
            </CardHeader>
            <CardContent>
              {auditsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : recentAudits && recentAudits.length > 0 ? (
                <div className="space-y-3">
                  {recentAudits.slice(0, 5).map((audit) => (
                    <div
                      key={audit.id}
                      className="flex items-center justify-between gap-4"
                      data-testid={`recent-audit-${audit.id}`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {audit.totalIssues} issues found
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {audit.createdAt
                            ? formatDistanceToNow(new Date(audit.createdAt), { addSuffix: true })
                            : "Recently"}
                        </p>
                      </div>
                      <HealthScore score={audit.score || 0} size="sm" showLabel={false} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Search className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No audits yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm mb-1">Quick Tip</h3>
                  <p className="text-xs text-muted-foreground">
                    Run regular audits to keep your SEO health score high. Our AI agents
                    will find and fix issues automatically.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
  highlight,
}: {
  title: string;
  value: number;
  icon: any;
  loading?: boolean;
  highlight?: boolean;
}) {
  return (
    <Card data-testid={`stat-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold">{value}</p>
            )}
          </div>
          <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
            highlight ? "bg-primary/10" : "bg-muted"
          }`}>
            <Icon className={`h-6 w-6 ${highlight ? "text-primary" : "text-muted-foreground"}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
