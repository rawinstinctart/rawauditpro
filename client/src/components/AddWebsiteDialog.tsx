import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Globe, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const addWebsiteSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich").max(100, "Name ist zu lang"),
  url: z.string().url("Bitte gib eine gültige URL ein").min(1, "URL ist erforderlich"),
});

type AddWebsiteFormData = z.infer<typeof addWebsiteSchema>;

interface AddWebsiteDialogProps {
  trigger?: React.ReactNode;
}

export function AddWebsiteDialog({ trigger }: AddWebsiteDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<AddWebsiteFormData>({
    resolver: zodResolver(addWebsiteSchema),
    defaultValues: {
      name: "",
      url: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: AddWebsiteFormData) => {
      return apiRequest("POST", "/api/websites", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/websites"] });
      toast({
        title: "Website hinzugefügt",
        description: "Deine Website wurde erfolgreich hinzugefügt.",
      });
      form.reset();
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler",
        description: error.message || "Website konnte nicht hinzugefügt werden",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddWebsiteFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button data-testid="button-add-website">
            <Plus className="h-4 w-4 mr-2" />
            Website hinzufügen
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" data-testid="dialog-add-website">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Website hinzufügen
          </DialogTitle>
          <DialogDescription>
            Gib die Details der Website ein, die du überwachen und optimieren möchtest.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website-Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Mein Blog"
                      {...field}
                      data-testid="input-website-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website-URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com"
                      type="url"
                      {...field}
                      data-testid="input-website-url"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={mutation.isPending} data-testid="button-submit-website">
                {mutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Hinzufügen...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Website hinzufügen
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
