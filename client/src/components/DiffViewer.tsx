import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DiffViewerProps {
  before: string;
  after: string;
  title?: string;
  className?: string;
}

export function DiffViewer({ before, after, title, className }: DiffViewerProps) {
  return (
    <Card className={cn("overflow-hidden", className)} data-testid="diff-viewer">
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div className="grid grid-cols-2 divide-x divide-border">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
                Aktuell
              </Badge>
            </div>
            <div className="font-mono text-sm bg-red-500/5 rounded-md p-3 border border-red-500/10 min-h-[80px] whitespace-pre-wrap break-words">
              {before || <span className="text-muted-foreground italic">Leer</span>}
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                Vorgeschlagen
              </Badge>
            </div>
            <div className="font-mono text-sm bg-green-500/5 rounded-md p-3 border border-green-500/10 min-h-[80px] whitespace-pre-wrap break-words">
              {after || <span className="text-muted-foreground italic">Leer</span>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface InlineDiffProps {
  before: string;
  after: string;
  compact?: boolean;
}

export function InlineDiff({ before, after, compact = false }: InlineDiffProps) {
  return (
    <div className={cn("flex flex-col gap-1 font-mono text-sm", compact ? "" : "gap-2")} data-testid="inline-diff">
      {before && (
        <div className="flex items-start gap-2">
          <span className="text-red-500 font-bold select-none">-</span>
          <span className="bg-red-500/10 text-red-700 dark:text-red-300 px-1 rounded break-all">
            {before}
          </span>
        </div>
      )}
      {after && (
        <div className="flex items-start gap-2">
          <span className="text-green-500 font-bold select-none">+</span>
          <span className="bg-green-500/10 text-green-700 dark:text-green-300 px-1 rounded break-all">
            {after}
          </span>
        </div>
      )}
    </div>
  );
}
