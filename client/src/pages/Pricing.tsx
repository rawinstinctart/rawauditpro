import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Zap, Shield, BarChart3 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const PLANS = {
  free: {
    name: "Free",
    price: "0",
    period: "Monat",
    description: "Perfekt zum Ausprobieren",
    features: [
      { text: "5 Audits pro Monat", included: true },
      { text: "Basis SEO-Analyse", included: true },
      { text: "Issue-Liste mit Prioritäten", included: true },
      { text: "Auto-Fix Funktion", included: false },
      { text: "Detaillierte Reports", included: false },
      { text: "Score-Tracking", included: false },
    ],
  },
  pro: {
    name: "Pro",
    price: "19",
    period: "Monat",
    description: "Für professionelle SEO-Optimierung",
    features: [
      { text: "Unbegrenzte Audits", included: true },
      { text: "Erweiterte SEO-Analyse", included: true },
      { text: "Issue-Liste mit Prioritäten", included: true },
      { text: "KI-gestützte Auto-Fixes", included: true },
      { text: "Detaillierte PDF-Reports", included: true },
      { text: "Score-Tracking vorher/nachher", included: true },
    ],
  },
};

export default function Pricing() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: subscription } = useQuery({
    queryKey: ["/api/subscription"],
    enabled: !!user,
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/stripe/create-checkout-session", { plan: "pro" });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error?.message || "Checkout konnte nicht gestartet werden. Bitte Stripe-Produkt konfigurieren.",
        variant: "destructive",
      });
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/stripe/customer-portal");
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });

  const currentTier = subscription?.tier || "free";
  const isPro = currentTier === "pro";

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Wähle deinen Plan</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Starte kostenlos und upgrade jederzeit auf Pro für erweiterte Funktionen
          und KI-gestützte Auto-Fixes.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Card className={currentTier === "free" ? "border-primary" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-2xl">{PLANS.free.name}</CardTitle>
              {currentTier === "free" && (
                <Badge variant="secondary">Aktueller Plan</Badge>
              )}
            </div>
            <CardDescription>{PLANS.free.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <span className="text-4xl font-bold">{PLANS.free.price}</span>
              <span className="text-muted-foreground ml-1">/{PLANS.free.period}</span>
            </div>
            <ul className="space-y-3">
              {PLANS.free.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  {feature.included ? (
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <X className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className={feature.included ? "" : "text-muted-foreground"}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full" 
              disabled
              data-testid="button-select-free"
            >
              {currentTier === "free" ? "Aktueller Plan" : "Kostenlos"}
            </Button>
          </CardFooter>
        </Card>

        <Card className={isPro ? "border-primary" : "border-2 border-primary/50"}>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl">{PLANS.pro.name}</CardTitle>
                <Zap className="h-5 w-5 text-yellow-500" />
              </div>
              {isPro ? (
                <Badge>Aktueller Plan</Badge>
              ) : (
                <Badge variant="secondary">Empfohlen</Badge>
              )}
            </div>
            <CardDescription>{PLANS.pro.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <span className="text-4xl font-bold">{PLANS.pro.price}</span>
              <span className="text-muted-foreground ml-1">/{PLANS.pro.period}</span>
            </div>
            <ul className="space-y-3">
              {PLANS.pro.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            {isPro ? (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => portalMutation.mutate()}
                disabled={portalMutation.isPending}
                data-testid="button-manage-subscription"
              >
                Abo verwalten
              </Button>
            ) : (
              <Button 
                className="w-full"
                onClick={() => checkoutMutation.mutate()}
                disabled={checkoutMutation.isPending}
                data-testid="button-upgrade-pro"
              >
                {checkoutMutation.isPending ? "Wird geladen..." : "Upgrade auf Pro"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      <div className="mt-16 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">Warum Pro?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-yellow-500 mb-2" />
              <CardTitle className="text-lg">KI Auto-Fix</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Lass unsere KI SEO-Probleme automatisch beheben. Wähle zwischen 
                sicheren, empfohlenen oder aggressiven Fixes.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-blue-500 mb-2" />
              <CardTitle className="text-lg">Score-Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Verfolge deinen SEO-Score vor und nach Optimierungen. 
                Sieh den direkten Impact deiner Änderungen.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-green-500 mb-2" />
              <CardTitle className="text-lg">Risk-Kontrolle</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Jeder Fix zeigt dir das Risiko-Level und erklärt mögliche 
                Auswirkungen, bevor du bestätigst.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
