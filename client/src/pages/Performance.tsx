import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { HealthScore } from "@/components/HealthScore";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, BarChart3, Target, Zap, Activity } from "lucide-react";
import type { Website, Audit } from "@shared/schema";
import { format } from "date-fns";

export default function Performance() {
  const { data: websites, isLoading: websitesLoading } = useQuery<Website[]>({
    queryKey: ["/api/websites"],
  });

  const { data: audits, isLoading: auditsLoading } = useQuery<Audit[]>({
    queryKey: ["/api/audits"],
  });

  const avgScore = websites?.length
    ? Math.round(websites.reduce((sum, w) => sum + (w.healthScore || 0), 0) / websites.length)
    : 0;

  const totalIssuesFixed = audits?.reduce((sum, a) => {
    const completed = a.status === "completed";
    return sum + (completed ? (a.totalIssues || 0) : 0);
  }, 0) || 0;

  const chartData = audits
    ?.slice()
    .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime())
    .slice(-10)
    .map((audit) => ({
      date: audit.createdAt ? format(new Date(audit.createdAt), "MMM d") : "",
      score: audit.score || 0,
      issues: audit.totalIssues || 0,
    })) || [];

  const isLoading = websitesLoading || auditsLoading;

  return (
    <div className="p-6 space-y-6" data-testid="page-performance">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Performance
          </h1>
          <p className="text-muted-foreground">Track your SEO improvements over time</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="stat-avg-score">
          <CardContent className="p-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Average Score</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-bold">{avgScore}</p>
              )}
            </div>
            <HealthScore score={avgScore} size="md" showLabel={false} />
          </CardContent>
        </Card>
        <Card data-testid="stat-total-sites">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Sites</p>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <p className="text-2xl font-bold">{websites?.length || 0}</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-audits-run">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Audits Run</p>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <p className="text-2xl font-bold">{audits?.length || 0}</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-issues-fixed">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Zap className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Issues Fixed</p>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <p className="text-2xl font-bold">{totalIssuesFixed}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Health Score Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis domain={[0, 100]} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorScore)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <p className="text-sm">No audit data available yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Issues Found Per Audit
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="issues"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--destructive))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <p className="text-sm">No audit data available yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Website Health Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : websites && websites.length > 0 ? (
            <div className="space-y-4">
              {websites.map((website) => (
                <div
                  key={website.id}
                  className="flex items-center justify-between gap-4 p-4 rounded-lg bg-muted/30"
                  data-testid={`website-performance-${website.id}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <HealthScore score={website.healthScore || 0} size="sm" showLabel={false} />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{website.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{website.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendIndicator score={website.healthScore || 0} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <p className="text-sm">No websites to display</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TrendIndicator({ score }: { score: number }) {
  if (score >= 80) {
    return (
      <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 gap-1">
        <TrendingUp className="h-3 w-3" />
        Excellent
      </Badge>
    );
  }
  if (score >= 60) {
    return (
      <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20 gap-1">
        <Minus className="h-3 w-3" />
        Good
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 gap-1">
      <TrendingDown className="h-3 w-3" />
      Needs Work
    </Badge>
  );
}
