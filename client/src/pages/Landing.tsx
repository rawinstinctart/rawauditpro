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
      title: "AI-Powered Analysis",
      description: "Advanced multi-agent system that thinks, plans, and optimizes your SEO autonomously.",
    },
    {
      icon: Sparkles,
      title: "Smart Suggestions",
      description: "Get intelligent recommendations for titles, descriptions, and content improvements.",
    },
    {
      icon: Shield,
      title: "Risk Assessment",
      description: "Automatic risk classification ensures critical changes require approval while safe fixes run automatically.",
    },
    {
      icon: Zap,
      title: "Auto-Fix Engine",
      description: "Low-risk issues are fixed automatically with rollback capability for peace of mind.",
    },
    {
      icon: TrendingUp,
      title: "Performance Tracking",
      description: "Monitor your SEO health over time and see the impact of optimizations.",
    },
    {
      icon: Globe,
      title: "Blogger Integration",
      description: "Connect your Blogger account to directly update posts with optimized content.",
    },
  ];

  const steps = [
    { step: 1, title: "Add Your Website", description: "Enter your website URL to start monitoring" },
    { step: 2, title: "Run an Audit", description: "Our AI agents analyze your site for SEO issues" },
    { step: 3, title: "Review & Apply", description: "Approve high-risk changes, auto-fix the rest" },
    { step: 4, title: "Track Progress", description: "Watch your SEO health improve over time" },
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
            <Button asChild data-testid="button-login">
              <a href="/api/login">Sign In</a>
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
              Autonomous SEO Optimization
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 max-w-4xl mx-auto">
              Let AI Agents Optimize Your{" "}
              <span className="text-primary">SEO</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              SiteScout AI uses multiple specialized agents to analyze, plan, and optimize your 
              website's SEO. Smart risk assessment ensures safe, automatic improvements.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild data-testid="button-get-started">
                <a href="/api/login">
                  Get Started Free
                  <ArrowRight className="h-4 w-4 ml-2" />
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="#how-it-works">See How It Works</a>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30" id="features">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Powerful SEO Features</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                A complete toolkit for autonomous SEO optimization powered by AI agents
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
              <h2 className="text-3xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Get your website optimized in four simple steps
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
              <h2 className="text-3xl font-bold mb-4">Multi-Agent System</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Five specialized AI agents work together to optimize your SEO
              </p>
            </div>
            <div className="grid md:grid-cols-5 gap-4 max-w-5xl mx-auto">
              {[
                { name: "Strategy", color: "bg-purple-500", desc: "Plans SEO roadmap" },
                { name: "Audit", color: "bg-blue-500", desc: "Finds issues" },
                { name: "Content", color: "bg-emerald-500", desc: "Writes copy" },
                { name: "Fix", color: "bg-orange-500", desc: "Applies changes" },
                { name: "Ranking", color: "bg-pink-500", desc: "Tracks performance" },
              ].map((agent) => (
                <Card key={agent.name} className="text-center hover-elevate">
                  <CardContent className="p-4">
                    <div className={`h-10 w-10 rounded-full ${agent.color} mx-auto mb-3 flex items-center justify-center`}>
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{agent.name} Agent</h3>
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
              <h2 className="text-3xl font-bold mb-4">Ready to Optimize Your SEO?</h2>
              <p className="text-muted-foreground mb-8">
                Join thousands of website owners who trust SiteScout AI for autonomous SEO optimization.
              </p>
              <Button size="lg" asChild data-testid="button-cta-bottom">
                <a href="/api/login">
                  Start Free Today
                  <ArrowRight className="h-4 w-4 ml-2" />
                </a>
              </Button>
              <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  No credit card required
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Free tier available
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
              Autonomous SEO optimization powered by AI
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
