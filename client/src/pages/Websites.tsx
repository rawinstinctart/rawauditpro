import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WebsiteCard, WebsiteCardSkeleton } from "@/components/WebsiteCard";
import { AddWebsiteDialog } from "@/components/AddWebsiteDialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Globe, Search, Plus } from "lucide-react";
import type { Website } from "@shared/schema";
import { useLocation } from "wouter";

export default function Websites() {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: websites, isLoading } = useQuery<Website[]>({
    queryKey: ["/api/websites"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/websites/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/websites"] });
      toast({
        title: "Website removed",
        description: "The website has been removed from your account.",
      });
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove website",
        variant: "destructive",
      });
    },
  });

  const auditMutation = useMutation({
    mutationFn: async (websiteId: string) => {
      return apiRequest("POST", `/api/audits`, { websiteId });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/websites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/audits"] });
      toast({
        title: "Audit started",
        description: "The SEO audit is now running. Check the agent logs for progress.",
      });
      if (data?.id) {
        setLocation(`/audits/${data.id}`);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start audit",
        variant: "destructive",
      });
    },
  });

  const filteredWebsites = websites?.filter(
    (w) =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6" data-testid="page-websites">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Websites</h1>
          <p className="text-muted-foreground">Manage your monitored websites</p>
        </div>
        <AddWebsiteDialog />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search websites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-websites"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <WebsiteCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredWebsites && filteredWebsites.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWebsites.map((website) => (
            <WebsiteCard
              key={website.id}
              website={website}
              onClick={(id) => setLocation(`/websites/${id}`)}
              onAudit={(id) => auditMutation.mutate(id)}
              onDelete={(id) => setDeleteId(id)}
              isLoading={auditMutation.isPending}
            />
          ))}
        </div>
      ) : websites && websites.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Globe className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h2 className="text-xl font-semibold mb-2">No websites yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Add your first website to start monitoring and optimizing its SEO
              with our AI-powered analysis.
            </p>
            <AddWebsiteDialog
              trigger={
                <Button size="lg" data-testid="button-add-first-website">
                  <Plus className="h-5 w-5 mr-2" />
                  Add Your First Website
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <h3 className="font-medium mb-1">No results found</h3>
            <p className="text-sm text-muted-foreground">
              No websites match your search query
            </p>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Website</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this website? This will delete all
              associated audits, issues, and optimization history. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
