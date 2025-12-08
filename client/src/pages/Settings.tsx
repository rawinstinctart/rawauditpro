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
          Settings
        </h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <nav className="lg:col-span-1">
          <Card>
            <CardContent className="p-2">
              <div className="space-y-1">
                {[
                  { label: "Account", icon: User },
                  { label: "Appearance", icon: Sun },
                  { label: "Notifications", icon: Bell },
                  { label: "AI Agents", icon: Sparkles },
                  { label: "Security", icon: Shield },
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
                Account
              </CardTitle>
              <CardDescription>
                Manage your account information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage 
                    src={user?.profileImageUrl || undefined} 
                    alt={user?.firstName || "User"}
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
                  <Badge variant="secondary" className="mt-1">Free Plan</Badge>
                </div>
              </div>
              <Separator />
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    data-testid="input-email"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email is managed through your authentication provider
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize how SiteScout looks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Toggle between light and dark themes
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
                AI Agent Settings
              </CardTitle>
              <CardDescription>
                Configure how AI agents work on your sites
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Fix Low Risk Issues</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically apply fixes for low-risk SEO issues
                  </p>
                </div>
                <Switch defaultChecked data-testid="switch-auto-fix" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show AI Reasoning</Label>
                  <p className="text-sm text-muted-foreground">
                    Display detailed reasoning for AI suggestions
                  </p>
                </div>
                <Switch defaultChecked data-testid="switch-show-reasoning" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Real-time Agent Logs</Label>
                  <p className="text-sm text-muted-foreground">
                    Show live updates from AI agents during audits
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
                Notifications
              </CardTitle>
              <CardDescription>
                Choose what updates you receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Audit Completion</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when an audit finishes
                  </p>
                </div>
                <Switch defaultChecked data-testid="switch-notify-audit" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Critical Issues</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when critical SEO issues are found
                  </p>
                </div>
                <Switch defaultChecked data-testid="switch-notify-critical" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Reports</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive weekly SEO performance summaries
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
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible account actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" asChild data-testid="button-logout">
                <a href="/api/logout">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
