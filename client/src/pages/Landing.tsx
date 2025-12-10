import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Search,
  Sparkles,
  Zap,
  Shield,
  TrendingUp,
  Brain,
  CheckCircle,
  ArrowRight,
  Globe,
} from "lucide-react";

export default function Landing() {
  const features = [
    {
      icon: Brain,
      title: "KI-gestützte Analyse",
      description: "Mehrere spezialisierte KI-Agenten analysieren, planen und optimieren dein SEO automatisch.",
    },
    {
      icon: Sparkles,
      title: "Intelligente Vorschläge",
      description: "Erhalte fundierte Empfehlungen für Titel, Beschreibungen und Inhaltsverbesserungen.",
    },
    {
      icon: Shield,
      title: "Risikobewertung",
      description: "Automatische Risikoklassifizierung sorgt dafür, dass kritische Änderungen geprüft werden.",
    },
    {
      icon: Zap,
      title: "Automatische Korrekturen",
      description: "Unkritische Probleme werden automatisch behoben – mit Rollback-Option bei Bedarf.",
    },
    {
      icon: TrendingUp,
      title: "Performance-Tracking",
      description: "Beobachte die Entwicklung deiner SEO-Gesundheit und den Impact der Optimierungen.",
    },
    {
      icon: Globe,
      title: "Blogger-Integration",
      description: "Verbinde deinen Blogger-Account und aktualisiere Beiträge direkt mit optimierten Inhalten.",
    },
  ];

  const steps = [
    { step: 1, title: "Website hinzufügen", description: "Gib deine Website-URL ein, um mit dem Monitoring zu starten" },
    { step: 2, title: "Audit starten", description: "Unsere KI-Agenten analysieren deine Seite auf SEO-Probleme" },
    { step: 3, title: "Prüfen und anwenden", description: "Genehmige kritische Änderungen, der Rest läuft automatisch" },
    { step: 4, title: "Fortschritt verfolgen", description: "Beobachte, wie sich dein SEO-Score verbessert" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Search className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">SiteScout AI</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" asChild data-testid="button-login">
              <a href="/login">Anmelden</a>
            </Button>
            <Button asChild data-testid="button-register">
              <a href="/register">Registrieren</a>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="py-20 md:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
          <div className="container mx-auto px-4 text-center relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Autonome SEO-Optimierung
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 max-w-4xl mx-auto">
              KI-Agenten optimieren dein{" "}
              <span className="text-primary">SEO</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              SiteScout AI nutzt mehrere spezialisierte Agenten, um das SEO deiner Website zu analysieren 
              und zu optimieren. Intelligente Risikobewertung sorgt für sichere, automatische Verbesserungen.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild data-testid="button-get-started">
                <a href="/register">
                  Kostenlos starten
                  <ArrowRight className="h-4 w-4 ml-2" />
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="#how-it-works">So funktioniert's</a>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30" id="features">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Leistungsstarke SEO-Funktionen</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Das komplette Toolkit für autonome SEO-Optimierung mit KI-Agenten
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <Card key={feature.title} className="hover-elevate">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20" id="how-it-works">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">So funktioniert SiteScout AI</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                In vier einfachen Schritten zur optimierten Website
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {steps.map((item, index) => (
                <div key={item.step} className="relative text-center">
                  <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground font-bold text-xl flex items-center justify-center mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-7 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-border" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Multi-Agenten-System</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Fünf spezialisierte KI-Agenten arbeiten zusammen, um dein SEO zu optimieren
              </p>
            </div>
            <div className="grid md:grid-cols-5 gap-4 max-w-5xl mx-auto">
              {[
                { name: "Strategie", color: "bg-purple-500", desc: "Plant SEO-Roadmap" },
                { name: "Audit", color: "bg-blue-500", desc: "Findet Probleme" },
                { name: "Content", color: "bg-emerald-500", desc: "Schreibt Texte" },
                { name: "Fix", color: "bg-orange-500", desc: "Wendet Fixes an" },
                { name: "Ranking", color: "bg-pink-500", desc: "Trackt Performance" },
              ].map((agent) => (
                <Card key={agent.name} className="text-center hover-elevate">
                  <CardContent className="p-4">
                    <div className={`h-10 w-10 rounded-full ${agent.color} mx-auto mb-3 flex items-center justify-center`}>
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{agent.name}-Agent</h3>
                    <p className="text-xs text-muted-foreground">{agent.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">Bereit für besseres SEO?</h2>
              <p className="text-muted-foreground mb-8">
                Schließe dich Tausenden von Website-Betreibern an, die auf SiteScout AI für autonome SEO-Optimierung vertrauen.
              </p>
              <Button size="lg" asChild data-testid="button-cta-bottom">
                <a href="/register">
                  Jetzt kostenlos starten
                  <ArrowRight className="h-4 w-4 ml-2" />
                </a>
              </Button>
              <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Keine Kreditkarte erforderlich
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Kostenloser Tarif verfügbar
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              <span className="font-semibold">SiteScout AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Autonome SEO-Optimierung mit KI
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
