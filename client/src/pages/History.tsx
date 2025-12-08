import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InlineDiff } from "@/components/DiffViewer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History, CheckCircle, XCircle, RotateCcw, Zap } from "lucide-react";
import type { Change } from "@shared/schema";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";

const statusConfig = {
  pending: { label: "Pending", className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20" },
  applied: { label: "Applied", className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" },
  rolled_back: { label: "Rolled Back", className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20" },
  failed: { label: "Failed", className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" },
};

export default function HistoryPage() {
  const { data: changes, isLoading } = useQuery<Change[]>({
    queryKey: ["/api/changes"],
  });

  const appliedChanges = changes?.filter(c => c.status === "applied") || [];
  const pendingChanges = changes?.filter(c => c.status === "pending") || [];
  const rolledBackChanges = changes?.filter(c => c.status === "rolled_back") || [];

  return (
    <div className="p-6 space-y-6" data-testid="page-history">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <History className="h-6 w-6" />
            Change History
          </h1>
          <p className="text-muted-foreground">Track all SEO changes and rollbacks</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="stat-applied-changes">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Applied</p>
              <p className="text-2xl font-bold">{appliedChanges.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-pending-changes">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Zap className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{pendingChanges.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-rolled-back">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <RotateCcw className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rolled Back</p>
              <p className="text-2xl font-bold">{rolledBackChanges.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Changes ({changes?.length || 0})</TabsTrigger>
          <TabsTrigger value="applied">Applied ({appliedChanges.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingChanges.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <ChangeTable changes={changes || []} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="applied" className="mt-4">
          <ChangeTable changes={appliedChanges} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="pending" className="mt-4">
          <ChangeTable changes={pendingChanges} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ChangeTable({ changes, isLoading }: { changes: Change[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (changes.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <History className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <h3 className="font-medium mb-1">No changes found</h3>
          <p className="text-sm text-muted-foreground">
            Applied SEO changes will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <ScrollArea className="h-[600px]">
        <div className="divide-y">
          {changes.map((change) => (
            <ChangeEntry key={change.id} change={change} />
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}

function ChangeEntry({ change }: { change: Change }) {
  const status = statusConfig[change.status as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <div className="p-4 hover:bg-muted/30 transition-colors" data-testid={`change-entry-${change.id}`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{change.changeType}</span>
            <Badge variant="outline" className={cn("border", status.className)}>
              {status.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-mono">{change.pageUrl}</p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          {change.appliedAt
            ? format(new Date(change.appliedAt), "MMM d, h:mm a")
            : change.createdAt
              ? format(new Date(change.createdAt), "MMM d, h:mm a")
              : "-"}
        </div>
      </div>
      {(change.beforeValue || change.afterValue) && (
        <InlineDiff
          before={change.beforeValue || ""}
          after={change.afterValue || ""}
          compact
        />
      )}
    </div>
  );
}
