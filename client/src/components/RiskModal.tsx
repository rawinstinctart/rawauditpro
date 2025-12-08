import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Shield, Zap, Lock } from "lucide-react";
import type { Issue } from "@shared/schema";

interface RiskModalProps {
  issue: Issue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPro: boolean;
}

type FixVariant = "safe" | "recommended" | "aggressive";

export function RiskModal({ issue, open, onOpenChange, isPro }: RiskModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<FixVariant>("recommended");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateFixMutation = useMutation({
    mutationFn: async (issueId: string) => {
      const response = await apiRequest("POST", `/api/issues/${issueId}/fix`);
      return response.json();
    },
  });

  const confirmFixMutation = useMutation({
    mutationFn: async ({ issueId, variant }: { issueId: string; variant: FixVariant }) => {
      const response = await apiRequest("POST", `/api/issues/${issueId}/confirm-fix`, { variant });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Fix angewendet",
        description: `Der SEO-Score wurde auf ${data.scoreAfter} aktualisiert.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/audits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/issues"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Fix konnte nicht angewendet werden.",
        variant: "destructive",
      });
    },
  });

  if (!issue) return null;

  const fixData = generateFixMutation.data;
  const hasFixData = !!issue.aiFixProposalSafe || !!fixData?.safeFix;

  const getRiskColor = (risk: string | null) => {
    switch (risk) {
      case "high": return "text-red-500";
      case "medium": return "text-yellow-500";
      case "low": return "text-green-500";
      default: return "text-muted-foreground";
    }
  };

  const getRiskIcon = (risk: string | null) => {
    switch (risk) {
      case "high": return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "medium": return <Shield className="h-5 w-5 text-yellow-500" />;
      case "low": return <Zap className="h-5 w-5 text-green-500" />;
      default: return null;
    }
  };

  const getVariantDescription = (variant: FixVariant) => {
    switch (variant) {
      case "safe": return "Minimale Änderungen, geringes Risiko";
      case "recommended": return "Ausgewogene Optimierung (empfohlen)";
      case "aggressive": return "Maximale SEO-Wirkung, höheres Risiko";
    }
  };

  const getVariantContent = (variant: FixVariant) => {
    if (fixData) {
      switch (variant) {
        case "safe": return fixData.safeFix;
        case "recommended": return fixData.recommendedFix;
        case "aggressive": return fixData.aggressiveFix;
      }
    }
    switch (variant) {
      case "safe": return issue.aiFixProposalSafe;
      case "recommended": return issue.aiFixProposalRecommended;
      case "aggressive": return issue.aiFixProposalAggressive;
    }
  };

  const confidenceScore = fixData?.confidenceScore || issue.confidenceScore || 75;
  const riskExplanation = fixData?.riskExplanation || issue.riskExplanation;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getRiskIcon(issue.riskLevel)}
            <span>{issue.title}</span>
          </DialogTitle>
          <DialogDescription>
            {issue.pageUrl}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <h4 className="font-medium mb-2">Problem</h4>
            <p className="text-sm text-muted-foreground">{issue.message || issue.description}</p>
            {issue.codeSnippet && (
              <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-x-auto font-mono">
                {issue.codeSnippet}
              </pre>
            )}
          </div>

          <div className="flex items-center gap-4">
            <Badge variant={issue.riskLevel === "high" ? "destructive" : issue.riskLevel === "medium" ? "secondary" : "outline"}>
              {issue.riskLevel === "high" ? "Hohes Risiko" : issue.riskLevel === "medium" ? "Mittleres Risiko" : "Niedriges Risiko"}
            </Badge>
            <Badge variant="outline">
              Confidence: {confidenceScore}%
            </Badge>
          </div>

          {riskExplanation && (
            <Card>
              <CardContent className="pt-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Risiko-Erklärung
                </h4>
                <p className="text-sm text-muted-foreground">{riskExplanation}</p>
              </CardContent>
            </Card>
          )}

          <div>
            <h4 className="font-medium mb-3">KI-Vorschlag wählen</h4>
            {!hasFixData && !generateFixMutation.isPending && (
              <Button 
                variant="outline" 
                onClick={() => generateFixMutation.mutate(issue.id)}
                className="mb-4"
                data-testid="button-generate-fixes"
              >
                Fix-Varianten generieren
              </Button>
            )}
            {generateFixMutation.isPending && (
              <p className="text-sm text-muted-foreground mb-4">Generiere Fix-Varianten...</p>
            )}
            {hasFixData && (
              <RadioGroup
                value={selectedVariant}
                onValueChange={(v) => setSelectedVariant(v as FixVariant)}
                className="space-y-3"
              >
                {(["safe", "recommended", "aggressive"] as const).map((variant) => (
                  <div key={variant} className="flex items-start space-x-3">
                    <RadioGroupItem value={variant} id={variant} className="mt-1" />
                    <Label htmlFor={variant} className="flex-1 cursor-pointer">
                      <div className="font-medium capitalize flex items-center gap-2">
                        {variant === "safe" && "Sicher"}
                        {variant === "recommended" && "Empfohlen"}
                        {variant === "aggressive" && "Aggressiv"}
                        {variant === "recommended" && (
                          <Badge variant="secondary" className="text-xs">Standard</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getVariantDescription(variant)}
                      </p>
                      <div className="mt-2 p-2 bg-muted rounded text-xs">
                        {getVariantContent(variant) || "Noch nicht generiert"}
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {!isPro ? (
            <div className="flex items-center gap-2 w-full justify-center text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span className="text-sm">Auto-Fix ist nur im Pro-Plan verfügbar</span>
            </div>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={() => confirmFixMutation.mutate({ issueId: issue.id, variant: selectedVariant })}
                disabled={confirmFixMutation.isPending || !hasFixData}
                data-testid="button-apply-fix"
              >
                {confirmFixMutation.isPending ? "Wird angewendet..." : "Fix anwenden"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
