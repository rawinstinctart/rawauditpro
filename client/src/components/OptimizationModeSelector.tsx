import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Shield, Zap, Rocket, Check, AlertTriangle, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type OptimizationMode = "safe" | "balanced" | "aggressive";

interface ModeOption {
  id: OptimizationMode;
  label: string;
  icon: typeof Shield;
  description: string;
  details: string[];
  riskLevel: string;
  badgeVariant: "default" | "secondary" | "destructive";
}

const modeOptions: ModeOption[] = [
  {
    id: "safe",
    label: "Sicher",
    icon: Shield,
    description: "Minimale Risiko-Optimierungen",
    details: [
      "Konservative Keyword-Dichte (0.5-1.5%)",
      "Minimale Inhaltsanderungen",
      "Nur kritische Meta-Tag Fixes",
      "Hohe Auto-Apply-Schwelle (90%)",
    ],
    riskLevel: "Niedrig",
    badgeVariant: "default",
  },
  {
    id: "balanced",
    label: "Ausgewogen",
    icon: Zap,
    description: "Standard SEO-Optimierungen",
    details: [
      "Optimale Keyword-Dichte (1-2%)",
      "Moderate Inhaltsverbesserungen",
      "Vollstandige Meta-Tag Optimierung",
      "Mittlere Auto-Apply-Schwelle (75%)",
    ],
    riskLevel: "Mittel",
    badgeVariant: "secondary",
  },
  {
    id: "aggressive",
    label: "Aggressiv",
    icon: Rocket,
    description: "Maximale SEO-Wirkung",
    details: [
      "Aggressive Keyword-Dichte (1.5-3%)",
      "Umfassende Inhaltsoptimierung",
      "Maximale Meta-Tag Anderungen",
      "Niedrige Auto-Apply-Schwelle (60%)",
    ],
    riskLevel: "Hoch",
    badgeVariant: "destructive",
  },
];

interface OptimizationModeSelectorProps {
  selectedMode: OptimizationMode;
  onModeChange: (mode: OptimizationMode) => void;
  disabled?: boolean;
}

export function OptimizationModeSelector({
  selectedMode,
  onModeChange,
  disabled,
}: OptimizationModeSelectorProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Optimierungsmodus
        </CardTitle>
        <CardDescription>
          Wahlen Sie den Optimierungsmodus fur Ihre SEO-Analyse
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedMode}
          onValueChange={(value) => onModeChange(value as OptimizationMode)}
          disabled={disabled}
          className="grid gap-3"
        >
          {modeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedMode === option.id;

            return (
              <Label
                key={option.id}
                htmlFor={option.id}
                className={`flex items-start gap-4 p-4 rounded-md border cursor-pointer transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover-elevate"
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                data-testid={`mode-option-${option.id}`}
              >
                <RadioGroupItem
                  value={option.id}
                  id={option.id}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{option.label}</span>
                    <Badge variant={option.badgeVariant} className="text-xs">
                      {option.riskLevel}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {option.description}
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {option.details.map((detail, idx) => (
                      <li key={idx} className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-green-500" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </Label>
            );
          })}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}

interface ModeQuickSelectProps {
  selectedMode: OptimizationMode;
  onModeChange: (mode: OptimizationMode) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function ModeQuickSelect({
  selectedMode,
  onModeChange,
  disabled,
  compact,
}: ModeQuickSelectProps) {
  const modeIcons: Record<OptimizationMode, typeof Shield> = {
    safe: Shield,
    balanced: Zap,
    aggressive: Rocket,
  };

  const modeLabels: Record<OptimizationMode, string> = {
    safe: "Sicher",
    balanced: "Ausgewogen",
    aggressive: "Aggressiv",
  };

  return (
    <div className="flex items-center gap-1" data-testid="mode-quick-select">
      {(["safe", "balanced", "aggressive"] as OptimizationMode[]).map((mode) => {
        const Icon = modeIcons[mode];
        const isSelected = selectedMode === mode;

        return (
          <Tooltip key={mode}>
            <TooltipTrigger asChild>
              <Button
                variant={isSelected ? "default" : "ghost"}
                size={compact ? "sm" : "default"}
                onClick={() => onModeChange(mode)}
                disabled={disabled}
                data-testid={`mode-quick-${mode}`}
                className={compact ? "px-2" : ""}
              >
                <Icon className="h-4 w-4" />
                {!compact && <span className="ml-1">{modeLabels[mode]}</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{modeLabels[mode]}</p>
              <p className="text-xs text-muted-foreground">
                {modeOptions.find((o) => o.id === mode)?.description}
              </p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

export function ModeBadge({ mode }: { mode: OptimizationMode }) {
  const config: Record<
    OptimizationMode,
    { icon: typeof Shield; label: string; variant: "default" | "secondary" | "destructive" }
  > = {
    safe: { icon: Shield, label: "Sicher", variant: "default" },
    balanced: { icon: Zap, label: "Ausgewogen", variant: "secondary" },
    aggressive: { icon: Rocket, label: "Aggressiv", variant: "destructive" },
  };

  const { icon: Icon, label, variant } = config[mode];

  return (
    <Badge variant={variant} className="gap-1" data-testid={`mode-badge-${mode}`}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}
