import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { HealthScore } from "@/components/HealthScore";
import { SeverityBadge } from "@/components/SeverityBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import {
  Search,
  Clock,
  CheckCircle,
  Loader2,
  AlertCircle,
  XCircle,
  ArrowRight,
  Globe,
} from "lucide-react";
import type { Audit, Website } from "@shared/schema";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";

const statusConfig = {
  pending: { label: "Ausstehend", icon: Clock, className: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20" },
  running: { label: "Läuft", icon: Loader2, className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", animated: true },
  completed: { label: "Abgeschlossen", icon: CheckCircle, className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" },
  failed: { label: "Fehlgeschlagen", icon: XCircle, className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" },
};

export default function Audits() {
  const { data: audits, isLoading: auditsLoading } = useQuery<(Audit & { website?: Website })[]>({
    queryKey: ["/api/audits"],
  });

  const runningAudits = audits?.filter(a => a.status === "running") || [];
  const completedAudits = audits?.filter(a => a.status === "completed") || [];
  const failedAudits = audits?.filter(a => a.status === "failed") || [];

  return (
    <div className="p-6 space-y-6" data-testid="page-audits">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Audits</h1>
          <p className="text-muted-foreground">SEO-Audits ansehen und verwalten</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="stat-running-audits">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Laufend</p>
              <p className="text-2xl font-bold">{runningAudits.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-completed-audits">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Abgeschlossen</p>
              <p className="text-2xl font-bold">{completedAudits.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-failed-audits">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fehlgeschlagen</p>
              <p className="text-2xl font-bold">{failedAudits.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Alle Audits</TabsTrigger>
          <TabsTrigger value="running">Laufend ({runningAudits.length})</TabsTrigger>
          <TabsTrigger value="completed">Abgeschlossen ({completedAudits.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <AuditTable audits={audits || []} isLoading={auditsLoading} />
        </TabsContent>
        <TabsContent value="running" className="mt-4">
          <AuditTable audits={runningAudits} isLoading={auditsLoading} />
        </TabsContent>
        <TabsContent value="completed" className="mt-4">
          <AuditTable audits={completedAudits} isLoading={auditsLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AuditTable({ audits, isLoading }: { audits: (Audit & { website?: Website })[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (audits.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Search className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <h3 className="font-medium mb-1">Keine Audits gefunden</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Starte einen Audit auf einer deiner Websites, um loszulegen
          </p>
          <Button asChild>
            <Link href="/websites">Zu den Websites</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Website</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Probleme</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Datum</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {audits.map((audit) => {
            const status = statusConfig[audit.status as keyof typeof statusConfig] || statusConfig.pending;
            const StatusIcon = status.icon;

            return (
              <TableRow key={audit.id} data-testid={`row-audit-${audit.id}`}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="font-medium text-sm">
                      {audit.website?.name || "Unbekannt"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("gap-1 border", status.className)}>
                    <StatusIcon className={cn("h-3 w-3", status.animated && "animate-spin")} />
                    {status.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {audit.criticalCount > 0 && (
                      <SeverityBadge severity="critical" showIcon={false} />
                    )}
                    {audit.highCount > 0 && (
                      <span className="text-sm text-muted-foreground">
                        +{audit.highCount} hoch
                      </span>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {audit.totalIssues || 0} gesamt
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <HealthScore score={audit.score || 0} size="sm" showLabel={false} />
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {audit.createdAt
                      ? format(new Date(audit.createdAt), "MMM d, yyyy")
                      : "-"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {audit.createdAt
                      ? formatDistanceToNow(new Date(audit.createdAt), { addSuffix: true })
                      : ""}
                  </div>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/audits/${audit.id}`}>
                      Ansehen <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
