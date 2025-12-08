import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SeverityBadge } from "./SeverityBadge";
import { InlineDiff } from "./DiffViewer";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Check, X, ChevronDown, ChevronRight, Sparkles, AlertTriangle, Zap } from "lucide-react";
import type { Issue } from "@shared/schema";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface IssueRowProps {
  issue: Issue;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  isLoading?: boolean;
}

const statusConfig = {
  pending: { label: "Pending", className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20" },
  approved: { label: "Approved", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  rejected: { label: "Rejected", className: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20" },
  fixed: { label: "Fixed", className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" },
  auto_fixed: { label: "Auto-Fixed", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
};

const riskConfig = {
  high: { label: "High Risk", className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20", icon: AlertTriangle },
  medium: { label: "Medium Risk", className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20", icon: AlertTriangle },
  low: { label: "Auto-Fix", className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20", icon: Zap },
};

export function IssueRow({ issue, onApprove, onReject, isLoading }: IssueRowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const status = statusConfig[issue.status as keyof typeof statusConfig] || statusConfig.pending;
  const risk = riskConfig[issue.riskLevel as keyof typeof riskConfig] || riskConfig.medium;
  const RiskIcon = risk.icon;

  const isPending = issue.status === "pending";

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <TableRow 
        className={cn("group", isLoading && "opacity-70")}
        data-testid={`row-issue-${issue.id}`}
      >
        <TableCell>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
        </TableCell>
        <TableCell>
          <div className="flex flex-col gap-1">
            <span className="font-medium text-sm">{issue.title}</span>
            <span className="text-xs text-muted-foreground">{issue.category}</span>
          </div>
        </TableCell>
        <TableCell>
          <span className="text-xs font-mono text-muted-foreground truncate max-w-[200px] block">
            {issue.pageUrl}
          </span>
        </TableCell>
        <TableCell>
          <SeverityBadge severity={issue.severity as any} />
        </TableCell>
        <TableCell>
          <Badge variant="outline" className={cn("gap-1 border", risk.className)}>
            <RiskIcon className="h-3 w-3" />
            {risk.label}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge variant="outline" className={cn("border", status.className)}>
            {status.label}
          </Badge>
        </TableCell>
        <TableCell>
          {isPending && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-500/10"
                onClick={() => onApprove?.(issue.id)}
                disabled={isLoading}
                data-testid={`button-approve-${issue.id}`}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-500/10"
                onClick={() => onReject?.(issue.id)}
                disabled={isLoading}
                data-testid={`button-reject-${issue.id}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </TableCell>
      </TableRow>
      <CollapsibleContent asChild>
        <TableRow className="bg-muted/30">
          <TableCell colSpan={7} className="p-4">
            <div className="space-y-4">
              {issue.description && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Description</h4>
                  <p className="text-sm text-muted-foreground">{issue.description}</p>
                </div>
              )}
              
              {(issue.currentValue || issue.suggestedValue) && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Suggested Change</h4>
                  <InlineDiff 
                    before={issue.currentValue || ""} 
                    after={issue.suggestedValue || ""} 
                  />
                </div>
              )}
              
              {issue.aiReasoning && (
                <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-medium">AI Reasoning</h4>
                    {issue.confidence && (
                      <Badge variant="outline" className="ml-auto text-xs">
                        {Math.round((issue.confidence || 0) * 100)}% confidence
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{issue.aiReasoning}</p>
                </div>
              )}

              {isPending && (
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    onClick={() => onApprove?.(issue.id)}
                    disabled={isLoading}
                    data-testid={`button-approve-expanded-${issue.id}`}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve Change
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onReject?.(issue.id)}
                    disabled={isLoading}
                    data-testid={`button-reject-expanded-${issue.id}`}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      </CollapsibleContent>
    </Collapsible>
  );
}
