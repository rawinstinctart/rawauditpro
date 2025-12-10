import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6 text-center">
          <div className="flex items-center justify-center mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold">Seite nicht gefunden</h1>
          </div>

          <p className="mt-4 text-sm text-muted-foreground mb-6">
            Die angeforderte Seite existiert nicht oder wurde verschoben.
          </p>
          
          <Button asChild>
            <Link href="/">Zurück zur Startseite</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
