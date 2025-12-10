import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useThemeContext } from "@/components/ThemeProvider";
import {
  Settings,
  User,
  Moon,
  Sun,
  Bell,
  Shield,
  Sparkles,
  ExternalLink,
  LogOut,
} from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useThemeContext();

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.[0] || "";
    const last = lastName?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  return (
    <div className="p-6 space-y-6" data-testid="page-settings">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Einstellungen
        </h1>
        <p className="text-muted-foreground">Verwalte dein Konto und deine Präferenzen</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <nav className="lg:col-span-1">
          <Card>
            <CardContent className="p-2">
              <div className="space-y-1">
                {[
                  { label: "Konto", icon: User },
                  { label: "Darstellung", icon: Sun },
                  { label: "Benachrichtigungen", icon: Bell },
                  { label: "KI-Agenten", icon: Sparkles },
                  { label: "Sicherheit", icon: Shield },
                ].map((item) => (
                  <Button
                    key={item.label}
                    variant="ghost"
                    className="w-full justify-start gap-2"
                    data-testid={`nav-settings-${item.label.toLowerCase()}`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </nav>

        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Konto
              </CardTitle>
              <CardDescription>
                Verwalte deine Kontoinformationen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage 
                    src={user?.profileImageUrl || undefined} 
                    alt={user?.firstName || "Benutzer"}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {getInitials(user?.firstName, user?.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-muted-foreground">{user?.email}</p>
                  <Badge variant="secondary" className="mt-1">Kostenlos</Badge>
                </div>
              </div>
              <Separator />
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">E-Mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    data-testid="input-email"
                  />
                  <p className="text-xs text-muted-foreground">
                    Die E-Mail wird über deinen Authentifizierungsanbieter verwaltet
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="h-5 w-5" />
                Darstellung
              </CardTitle>
              <CardDescription>
                Passe das Aussehen von SiteScout an
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dunkelmodus</Label>
                  <p className="text-sm text-muted-foreground">
                    Wechsle zwischen hellem und dunklem Design
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-muted-foreground" />
                  <Switch
                    checked={theme === "dark"}
                    onCheckedChange={toggleTheme}
                    data-testid="switch-dark-mode"
                  />
                  <Moon className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                KI-Agenten-Einstellungen
              </CardTitle>
              <CardDescription>
                Konfiguriere, wie KI-Agenten deine Websites optimieren
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Automatische Korrekturen</Label>
                  <p className="text-sm text-muted-foreground">
                    Unkritische SEO-Probleme automatisch beheben
                  </p>
                </div>
                <Switch defaultChecked data-testid="switch-auto-fix" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>KI-Begründungen anzeigen</Label>
                  <p className="text-sm text-muted-foreground">
                    Detaillierte Begründungen für KI-Vorschläge anzeigen
                  </p>
                </div>
                <Switch defaultChecked data-testid="switch-show-reasoning" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Echtzeit-Agenten-Logs</Label>
                  <p className="text-sm text-muted-foreground">
                    Live-Updates von KI-Agenten während Audits anzeigen
                  </p>
                </div>
                <Switch defaultChecked data-testid="switch-realtime-logs" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Benachrichtigungen
              </CardTitle>
              <CardDescription>
                Wähle aus, welche Updates du erhalten möchtest
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Audit abgeschlossen</Label>
                  <p className="text-sm text-muted-foreground">
                    Benachrichtigung wenn ein Audit fertig ist
                  </p>
                </div>
                <Switch defaultChecked data-testid="switch-notify-audit" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Kritische Probleme</Label>
                  <p className="text-sm text-muted-foreground">
                    Benachrichtigung bei kritischen SEO-Problemen
                  </p>
                </div>
                <Switch defaultChecked data-testid="switch-notify-critical" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Wöchentliche Berichte</Label>
                  <p className="text-sm text-muted-foreground">
                    Wöchentliche SEO-Performance-Zusammenfassungen erhalten
                  </p>
                </div>
                <Switch data-testid="switch-notify-weekly" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Shield className="h-5 w-5" />
                Gefahrenzone
              </CardTitle>
              <CardDescription>
                Nicht rückgängig zu machende Aktionen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" asChild data-testid="button-logout">
                <a href="/api/logout">
                  <LogOut className="h-4 w-4 mr-2" />
                  Abmelden
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
