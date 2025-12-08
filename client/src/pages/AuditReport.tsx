import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { SeverityBadge } from "@/components/SeverityBadge";
import { HealthScore } from "@/components/HealthScore";
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Target,
  BarChart3,
  FileText,
  Download,
  Image as ImageIcon,
  Zap,
} from "lucide-react";
import type { Audit, Issue, Website } from "@shared/schema";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface ImageStats {
  totalImages: number;
  imagesWithIssues: number;
  totalOriginalSizeKB: number;
  potentialSavingsPercent: number;
  estimatedSavingsKB: number;
  imageIssuesCount: number;
}

interface ReportData {
  audit: Audit & { website?: Website };
  scoreBefore: number;
  scoreAfter: number;
  totalIssues: number;
  fixedCount: number;
  pendingCount: number;
  topIssues: Issue[];
  allIssues: Issue[];
  imageStats?: ImageStats | null;
}

function ScoreComparison({ before, after }: { before: number; after: number }) {
  const improvement = after - before;
  const improvementPercent = before > 0 ? Math.round((improvement / before) * 100) : 0;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          SEO-Score Entwicklung
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-muted-foreground">{before}</div>
            <div className="text-sm text-muted-foreground">Vorher</div>
          </div>
          <div className="text-center flex flex-col items-center justify-center">
            <div className={`text-2xl font-bold ${improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {improvement >= 0 ? '+' : ''}{improvement}
            </div>
            <div className="text-xs text-muted-foreground">
              {improvementPercent >= 0 ? '+' : ''}{improvementPercent}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{after}</div>
            <div className="text-sm text-muted-foreground">Nachher</div>
          </div>
        </div>
        <Progress value={after} className="mt-4" />
      </CardContent>
    </Card>
  );
}

function IssueBreakdown({ issues }: { issues: Issue[] }) {
  const bySeverity = {
    critical: issues.filter(i => i.severity === 'critical').length,
    high: issues.filter(i => i.severity === 'high').length,
    medium: issues.filter(i => i.severity === 'medium').length,
    low: issues.filter(i => i.severity === 'low').length,
  };
  
  const byCategory: Record<string, number> = {};
  issues.forEach(issue => {
    byCategory[issue.category] = (byCategory[issue.category] || 0) + 1;
  });
  
  const sortedCategories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Nach Schweregrad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm">Kritisch</span>
            </div>
            <Badge variant="destructive">{bySeverity.critical}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-sm">Hoch</span>
            </div>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">{bySeverity.high}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-sm">Mittel</span>
            </div>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">{bySeverity.medium}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm">Niedrig</span>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">{bySeverity.low}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Nach Kategorie
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedCategories.map(([category, count]) => (
            <div key={category} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{category}</span>
                <span className="text-muted-foreground">{count}</span>
              </div>
              <Progress value={(count / issues.length) * 100} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function TopIssuesList({ issues }: { issues: Issue[] }) {
  if (issues.length === 0) return null;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Top-Prioritäts-Issues
        </CardTitle>
        <CardDescription>
          Die wichtigsten Optimierungspunkte basierend auf Impact und Schweregrad
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {issues.map((issue, index) => (
            <div key={issue.id} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-sm">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{issue.title}</span>
                  <SeverityBadge severity={issue.severity || 'medium'} />
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{issue.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>{issue.category}</span>
                  <span className="truncate max-w-[200px]">{issue.pageUrl}</span>
                </div>
              </div>
              {issue.status === 'fixed' || issue.status === 'auto_fixed' ? (
                <Badge variant="default" className="bg-green-600 flex-shrink-0">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Behoben
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex-shrink-0">
                  <Clock className="h-3 w-3 mr-1" />
                  Ausstehend
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ImageOptimizationCard({ stats }: { stats: ImageStats }) {
  const optimizationPercent = stats.totalImages > 0 
    ? Math.round(((stats.totalImages - stats.imagesWithIssues) / stats.totalImages) * 100)
    : 100;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-primary" />
          Bild-Optimierung
        </CardTitle>
        <CardDescription>
          Analyse der Bilder auf Ihrer Website
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{stats.totalImages}</div>
            <div className="text-xs text-muted-foreground">Bilder gefunden</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-orange-600">{stats.imagesWithIssues}</div>
            <div className="text-xs text-muted-foreground">Mit Problemen</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{stats.totalOriginalSizeKB}KB</div>
            <div className="text-xs text-muted-foreground">Gesamtgr.</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
            <div className="text-2xl font-bold text-green-600">{stats.estimatedSavingsKB}KB</div>
            <div className="text-xs text-muted-foreground">Einsparpotenzial</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Optimierungsfortschritt</span>
            <span>{optimizationPercent}%</span>
          </div>
          <Progress value={optimizationPercent} className="h-2" />
        </div>
        
        {stats.potentialSavingsPercent > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-start gap-3">
            <Zap className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-blue-900 dark:text-blue-100">Optimierungspotenzial</div>
              <p className="text-blue-700 dark:text-blue-300">
                Durch Bildoptimierung k{"\u00F6"}nnen Sie bis zu {stats.potentialSavingsPercent}% der Bildgr{"\u00F6"}{"\u00DF"}e einsparen 
                und die Ladezeit Ihrer Website verbessern.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AuditReport() {
  const { id } = useParams<{ id: string }>();

  const { data: report, isLoading, error } = useQuery<ReportData>({
    queryKey: ["/api/audits", id, "report"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Report nicht gefunden</h3>
            <p className="text-muted-foreground mb-4">
              Der angeforderte Audit-Report konnte nicht geladen werden.
            </p>
            <Button asChild>
              <Link href="/audits">Zurück zu Audits</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { audit, scoreBefore, scoreAfter, totalIssues, fixedCount, pendingCount, topIssues, allIssues, imageStats } = report;
  const fixedPercent = totalIssues > 0 ? Math.round((fixedCount / totalIssues) * 100) : 0;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/audits/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              SEO-Audit Report
            </h1>
            <p className="text-muted-foreground">
              {audit.website?.name || audit.website?.url} - {format(new Date(audit.createdAt!), "PPP", { locale: de })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/audits/${id}`}>
              Details anzeigen
            </Link>
          </Button>
          <Button variant="outline" data-testid="button-download-report">
            <Download className="h-4 w-4 mr-2" />
            PDF Export
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalIssues}</div>
                <div className="text-sm text-muted-foreground">Gefundene Issues</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{fixedCount}</div>
                <div className="text-sm text-muted-foreground">Behoben ({fixedPercent}%)</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{pendingCount}</div>
                <div className="text-sm text-muted-foreground">Ausstehend</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{audit.pagesScanned || 0}</div>
                <div className="text-sm text-muted-foreground">Seiten gescannt</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ScoreComparison before={scoreBefore} after={scoreAfter} />

      <IssueBreakdown issues={allIssues} />

      {imageStats && <ImageOptimizationCard stats={imageStats} />}

      <TopIssuesList issues={topIssues} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Zusammenfassung</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>
            Der SEO-Audit für <strong>{audit.website?.name || audit.website?.url}</strong> wurde 
            am {format(new Date(audit.createdAt!), "PPP 'um' HH:mm 'Uhr'", { locale: de })} abgeschlossen.
          </p>
          <p>
            Insgesamt wurden <strong>{totalIssues} Issues</strong> auf {audit.pagesScanned || 0} Seiten identifiziert.
            Davon wurden bereits <strong>{fixedCount} ({fixedPercent}%)</strong> behoben, 
            während <strong>{pendingCount}</strong> noch auf Bearbeitung warten.
          </p>
          {scoreAfter > scoreBefore && (
            <p>
              Der SEO-Score hat sich von <strong>{scoreBefore}</strong> auf <strong>{scoreAfter}</strong> verbessert - 
              eine Steigerung um <strong>{scoreAfter - scoreBefore} Punkte</strong>.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
