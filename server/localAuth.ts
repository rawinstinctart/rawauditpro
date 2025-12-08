import bcrypt from "bcryptjs";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function setupLocalAuth(app: Express) {
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email und Passwort sind erforderlich" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Passwort muss mindestens 6 Zeichen lang sein" });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Ungültige Email-Adresse" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "Diese Email-Adresse wird bereits verwendet" });
      }

      const passwordHash = await hashPassword(password);
      const userId = crypto.randomUUID();

      await storage.upsertUser({
        id: userId,
        email,
        passwordHash,
        firstName: firstName || null,
        lastName: lastName || null,
      });

      const user = await storage.getUser(userId);
      
      (req as any).login({ 
        claims: { sub: userId },
        localAuth: true,
        expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
      }, (err: any) => {
        if (err) {
          console.error("Login error after registration:", err);
          return res.status(500).json({ message: "Registrierung erfolgreich, aber Login fehlgeschlagen" });
        }
        const { passwordHash, ...safeUser } = user!;
        return res.status(201).json(safeUser);
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Registrierung fehlgeschlagen" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email und Passwort sind erforderlich" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Email oder Passwort ist falsch" });
      }

      if (!user.passwordHash) {
        return res.status(401).json({ message: "Dieses Konto verwendet Replit-Anmeldung. Bitte mit Replit anmelden." });
      }

      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Email oder Passwort ist falsch" });
      }

      (req as any).login({ 
        claims: { sub: user.id },
        localAuth: true,
        expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
      }, (err: any) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ message: "Login fehlgeschlagen" });
        }
        const { passwordHash: _, ...safeUser } = user;
        return res.json(safeUser);
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Login fehlgeschlagen" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout fehlgeschlagen" });
      }
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
        }
        res.json({ message: "Erfolgreich abgemeldet" });
      });
    });
  });
}

export const isAuthenticatedLocal: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (user?.localAuth) {
    const now = Math.floor(Date.now() / 1000);
    if (user.expires_at && now <= user.expires_at) {
      return next();
    }
    return res.status(401).json({ message: "Session expired" });
  }

  if (user?.expires_at) {
    const now = Math.floor(Date.now() / 1000);
    if (now <= user.expires_at) {
      return next();
    }
  }

  return res.status(401).json({ message: "Unauthorized" });
};
