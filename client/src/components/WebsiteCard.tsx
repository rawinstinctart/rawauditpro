import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HealthScore } from "./HealthScore";
import { MoreVertical, Play, Trash2, ExternalLink, Globe, AlertCircle, Clock } from "lucide-react";
import type { Website } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface WebsiteCardProps {
  website: Website;
  onAudit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (id: string) => void;
  isLoading?: boolean;
}

export function WebsiteCard({ website, onAudit, onDelete, onClick, isLoading }: WebsiteCardProps) {
  const faviconUrl = website.faviconUrl || `https://www.google.com/s2/favicons?domain=${new URL(website.url).hostname}&sz=64`;

  return (
    <Card 
      className={cn(
        "hover-elevate cursor-pointer transition-shadow",
        isLoading && "opacity-70"
      )}
      onClick={() => onClick?.(website.id)}
      data-testid={`card-website-${website.id}`}
    >
      <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
            {faviconUrl ? (
              <img 
                src={faviconUrl} 
                alt="" 
                className="h-6 w-6 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement?.classList.add('items-center', 'justify-center');
                  const icon = document.createElement('div');
                  icon.innerHTML = '<svg class="h-5 w-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
                  e.currentTarget.parentElement?.appendChild(icon);
                }}
              />
            ) : (
              <Globe className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate">{website.name}</h3>
            <p className="text-xs text-muted-foreground truncate">{new URL(website.url).hostname}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" data-testid={`button-website-menu-${website.id}`}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAudit?.(website.id); }}>
              <Play className="h-4 w-4 mr-2" />
              Audit starten
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(website.url, '_blank'); }}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Website besuchen
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); onDelete?.(website.id); }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Entfernen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <HealthScore score={website.healthScore || 0} size="sm" showLabel={false} />
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {website.lastAuditAt 
                    ? `Audit vor ${formatDistanceToNow(new Date(website.lastAuditAt))}`
                    : "Noch nicht geprüft"
                  }
                </span>
              </div>
              {!website.isActive && (
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 w-fit">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Inaktiv
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function WebsiteCardSkeleton() {
  return (
    <Card className="animate-pulse" data-testid="skeleton-website-card">
      <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-muted" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-3 w-24 bg-muted rounded" />
          </div>
        </div>
        <div className="h-8 w-8 bg-muted rounded" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-12 w-12 bg-muted rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}
