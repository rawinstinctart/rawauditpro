import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ModeBadge, ModeQuickSelect } from "./OptimizationModeSelector";
import { DiffViewer } from "./DiffViewer";
import {
  Check,
  X,
  Play,
  Pause,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles,
  Shield,
  Zap,
  Rocket,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Draft } from "@shared/schema";

type OptimizationMode = "safe" | "balanced" | "aggressive";

interface DraftReviewProps {
  auditId: string;
  websiteId: string;
  isPro?: boolean;
}

export function DraftReview({ auditId, websiteId, isPro }: DraftReviewProps) {
  const [selectedDrafts, setSelectedDrafts] = useState<string[]>([]);
  const [expandedDraft, setExpandedDraft] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ drafts: Draft[]; stats: any }>({
    queryKey: ["/api/audits", auditId, "drafts"],
  });

  const approveMutation = useMutation({
    mutationFn: (draftId: string) =>
      apiRequest("POST", `/api/drafts/${draftId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audits", auditId, "drafts"] });
      toast({ title: "Draft genehmigt" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (draftId: string) =>
      apiRequest("POST", `/api/drafts/${draftId}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audits", auditId, "drafts"] });
      toast({ title: "Draft abgelehnt" });
    },
  });

  const applyMutation = useMutation({
    mutationFn: (draftId: string) =>
      apiRequest("POST", `/api/drafts/${draftId}/apply`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audits", auditId, "drafts"] });
      toast({ title: "Draft angewendet", description: "Die Optimierung wurde erfolgreich angewendet." });
    },
    onError: (error: any) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  const bulkApproveMutation = useMutation({
    mutationFn: (draftIds: string[]) =>
      apiRequest("POST", "/api/drafts/bulk-approve", { draftIds }),
    onSuccess: (_, draftIds) => {
      queryClient.invalidateQueries({ queryKey: ["/api/audits", auditId, "drafts"] });
      toast({ title: `${draftIds.length} Drafts genehmigt` });
      setSelectedDrafts([]);
    },
  });

  const bulkApplyMutation = useMutation({
    mutationFn: (draftIds: string[]) =>
      apiRequest("POST", "/api/drafts/bulk-apply", { draftIds }),
    onSuccess: (_, draftIds) => {
      queryClient.invalidateQueries({ queryKey: ["/api/audits", auditId, "drafts"] });
      toast({ title: `${draftIds.length} Drafts angewendet` });
      setSelectedDrafts([]);
    },
    onError: (error: any) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  const updateModeMutation = useMutation({
    mutationFn: ({ draftId, mode }: { draftId: string; mode: string }) =>
      apiRequest("PATCH", `/api/drafts/${draftId}/select-mode`, { mode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audits", auditId, "drafts"] });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const drafts = data?.drafts || [];
  const stats = data?.stats || { total: 0, pending: 0, approved: 0, applied: 0, rejected: 0 };

  const pendingDrafts = drafts.filter((d) => d.status === "pending");
  const approvedDrafts = drafts.filter((d) => d.status === "approved");
  const appliedDrafts = drafts.filter((d) => d.status === "applied");
  const rejectedDrafts = drafts.filter((d) => d.status === "rejected");

  const toggleDraftSelection = (draftId: string) => {
    setSelectedDrafts((prev) =>
      prev.includes(draftId)
        ? prev.filter((id) => id !== draftId)
        : [...prev, draftId]
    );
  };

  const selectAllPending = () => {
    setSelectedDrafts(pendingDrafts.map((d) => d.id));
  };

  const getProposalContent = (draft: Draft, mode: OptimizationMode) => {
    if (mode === "safe") return draft.proposedValueSafe;
    if (mode === "aggressive") return draft.proposedValueAggressive;
    return draft.proposedValueBalanced;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Optimierungsvorschläge
            </CardTitle>
            <CardDescription>
              Prüfe und genehmige die KI-generierten Verbesserungen
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              {stats.pending} Ausstehend
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Check className="h-3 w-3" />
              {stats.approved} Genehmigt
            </Badge>
            <Badge className="gap-1 bg-green-600">
              <CheckCircle className="h-3 w-3" />
              {stats.applied} Angewendet
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="pending" className="w-full">
          <div className="overflow-x-auto -mx-1 px-1 mb-4">
            <TabsList className="w-max min-w-full sm:w-auto">
              <TabsTrigger value="pending" className="gap-1 text-xs sm:text-sm">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                Offen ({stats.pending})
              </TabsTrigger>
              <TabsTrigger value="approved" className="gap-1 text-xs sm:text-sm">
                <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                OK ({stats.approved})
              </TabsTrigger>
              <TabsTrigger value="applied" className="gap-1 text-xs sm:text-sm">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                Fertig ({stats.applied})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="gap-1 text-xs sm:text-sm">
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
                Nein ({stats.rejected})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="pending">
            {pendingDrafts.length > 0 && (
              <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedDrafts.length === pendingDrafts.length && pendingDrafts.length > 0}
                    onCheckedChange={(checked) =>
                      checked ? selectAllPending() : setSelectedDrafts([])
                    }
                    data-testid="select-all-drafts"
                  />
                  <span className="text-sm text-muted-foreground">
                    {selectedDrafts.length} ausgewählt
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={selectedDrafts.length === 0 || bulkApproveMutation.isPending}
                    onClick={() => bulkApproveMutation.mutate(selectedDrafts)}
                    data-testid="bulk-approve-btn"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Alle genehmigen
                  </Button>
                  {isPro && (
                    <Button
                      size="sm"
                      disabled={selectedDrafts.length === 0 || bulkApplyMutation.isPending}
                      onClick={() => bulkApplyMutation.mutate(selectedDrafts)}
                      data-testid="bulk-apply-btn"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Alle anwenden
                    </Button>
                  )}
                </div>
              </div>
            )}
            <DraftList
              drafts={pendingDrafts}
              selectedDrafts={selectedDrafts}
              expandedDraft={expandedDraft}
              onToggleSelection={toggleDraftSelection}
              onToggleExpand={(id) => setExpandedDraft(expandedDraft === id ? null : id)}
              onApprove={(id) => approveMutation.mutate(id)}
              onReject={(id) => rejectMutation.mutate(id)}
              onApply={(id) => applyMutation.mutate(id)}
              onModeChange={(id, mode) => updateModeMutation.mutate({ draftId: id, mode })}
              isPro={isPro}
              showActions
              getProposalContent={getProposalContent}
            />
          </TabsContent>

          <TabsContent value="approved">
            <DraftList
              drafts={approvedDrafts}
              selectedDrafts={[]}
              expandedDraft={expandedDraft}
              onToggleExpand={(id) => setExpandedDraft(expandedDraft === id ? null : id)}
              onApply={(id) => applyMutation.mutate(id)}
              isPro={isPro}
              showApplyButton
              getProposalContent={getProposalContent}
            />
          </TabsContent>

          <TabsContent value="applied">
            <DraftList
              drafts={appliedDrafts}
              selectedDrafts={[]}
              expandedDraft={expandedDraft}
              onToggleExpand={(id) => setExpandedDraft(expandedDraft === id ? null : id)}
              getProposalContent={getProposalContent}
            />
          </TabsContent>

          <TabsContent value="rejected">
            <DraftList
              drafts={rejectedDrafts}
              selectedDrafts={[]}
              expandedDraft={expandedDraft}
              onToggleExpand={(id) => setExpandedDraft(expandedDraft === id ? null : id)}
              getProposalContent={getProposalContent}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface DraftListProps {
  drafts: Draft[];
  selectedDrafts: string[];
  expandedDraft: string | null;
  onToggleSelection?: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onApply?: (id: string) => void;
  onModeChange?: (id: string, mode: string) => void;
  isPro?: boolean;
  showActions?: boolean;
  showApplyButton?: boolean;
  getProposalContent: (draft: Draft, mode: OptimizationMode) => string | null;
}

function DraftList({
  drafts,
  selectedDrafts,
  expandedDraft,
  onToggleSelection,
  onToggleExpand,
  onApprove,
  onReject,
  onApply,
  onModeChange,
  isPro,
  showActions,
  showApplyButton,
  getProposalContent,
}: DraftListProps) {
  if (drafts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Keine Drafts in dieser Kategorie</p>
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-96">
      <div className="space-y-3">
        {drafts.map((draft) => {
          const isExpanded = expandedDraft === draft.id;
          const isSelected = selectedDrafts.includes(draft.id);
          const selectedMode = (draft.selectedProposal || "balanced") as OptimizationMode;
          const proposalContent = getProposalContent(draft, selectedMode);

          return (
            <div
              key={draft.id}
              className={`border rounded-md p-4 transition-colors ${
                isSelected ? "border-primary bg-primary/5" : ""
              }`}
              data-testid={`draft-item-${draft.id}`}
            >
              <div className="flex items-start gap-3">
                {onToggleSelection && (
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleSelection(draft.id)}
                    className="mt-1"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium">{draft.draftType}</span>
                    <ModeBadge mode={selectedMode} />
                    {draft.confidence && draft.confidence > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {Math.round(draft.confidence * 100)}% Vertrauen
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {draft.pageUrl}
                  </p>
                  
                  {onModeChange && draft.status === "pending" && (
                    <div className="mb-2">
                      <ModeQuickSelect
                        selectedMode={selectedMode}
                        onModeChange={(mode) => onModeChange(draft.id, mode)}
                        compact
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleExpand(draft.id)}
                      data-testid={`toggle-draft-${draft.id}`}
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Weniger
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Details
                        </>
                      )}
                    </Button>

                    {showActions && onApprove && onReject && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onApprove(draft.id)}
                          data-testid={`approve-draft-${draft.id}`}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Genehmigen
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onReject(draft.id)}
                          data-testid={`reject-draft-${draft.id}`}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Ablehnen
                        </Button>
                      </>
                    )}

                    {(showApplyButton || (showActions && isPro)) && onApply && (
                      <Button
                        size="sm"
                        onClick={() => onApply(draft.id)}
                        disabled={!isPro}
                        data-testid={`apply-draft-${draft.id}`}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Anwenden
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t">
                  <div className="grid gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Original</h4>
                      <div className="bg-muted p-3 rounded-md text-sm">
                        <code className="text-xs">{draft.currentValue || "Keine Originaldaten"}</code>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Vorschlag ({selectedMode})</h4>
                      <div className="bg-primary/10 p-3 rounded-md text-sm">
                        <code className="text-xs">{proposalContent || "Kein Vorschlag"}</code>
                      </div>
                    </div>
                    {draft.reasoning && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">AI-Begrundung</h4>
                        <p className="text-sm text-muted-foreground">{draft.reasoning}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

export function DraftStats({ auditId }: { auditId: string }) {
  const { data, isLoading } = useQuery<{ drafts: Draft[]; stats: any }>({
    queryKey: ["/api/audits", auditId, "drafts"],
  });

  if (isLoading) {
    return <Skeleton className="h-24 w-full" />;
  }

  const stats = data?.stats || { total: 0, pending: 0, approved: 0, applied: 0, rejected: 0 };
  const progressPercent = stats.total > 0
    ? Math.round(((stats.approved + stats.applied) / stats.total) * 100)
    : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Optimierungsfortschritt
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Progress value={progressPercent} />
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-muted-foreground">{stats.pending}</div>
              <div className="text-xs text-muted-foreground">Ausstehend</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.approved}</div>
              <div className="text-xs text-muted-foreground">Genehmigt</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.applied}</div>
              <div className="text-xs text-muted-foreground">Angewendet</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <div className="text-xs text-muted-foreground">Abgelehnt</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
