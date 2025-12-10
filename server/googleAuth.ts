import { Express } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { storage } from "./storage";

export function setupGoogleAuth(app: Express) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  // Fail-fast: Check if Google OAuth is configured
  if (!clientId || !clientSecret) {
    console.log("Google OAuth: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set, skipping Google auth setup");
    return;
  }

  // Validate that clientId is a non-empty string (the exact error we're fixing)
  if (typeof clientId !== "string" || clientId.trim() === "") {
    throw new Error("GOOGLE_CLIENT_ID must be a non-empty string");
  }
  if (typeof clientSecret !== "string" || clientSecret.trim() === "") {
    throw new Error("GOOGLE_CLIENT_SECRET must be a non-empty string");
  }

  // Default callback URL if not specified
  const callbackURL = redirectUri || "/api/auth/callback/google";

  async function upsertUser(profile: Profile) {
    const email = profile.emails?.[0]?.value || "";
    const firstName = profile.name?.givenName || "";
    const lastName = profile.name?.familyName || "";
    const profileImageUrl = profile.photos?.[0]?.value || null;

    await storage.upsertUser({
      id: `google-${profile.id}`,
      email,
      firstName,
      lastName,
      profileImageUrl,
    });
  }

  const strategy = new GoogleStrategy(
    {
      clientID: clientId,
      clientSecret: clientSecret,
      callbackURL: callbackURL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        await upsertUser(profile);

        const email = profile.emails?.[0]?.value || "";
        const firstName = profile.name?.givenName || "";
        const lastName = profile.name?.familyName || "";
        const profileImageUrl = profile.photos?.[0]?.value || null;

        const user = {
          id: `google-${profile.id}`,
          email,
          firstName,
          lastName,
          profileImageUrl,
          claims: {
            sub: `google-${profile.id}`,
            email,
            first_name: firstName,
            last_name: lastName,
            profile_image_url: profileImageUrl,
          },
          accessToken,
          refreshToken,
          expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 7,
        };

        done(null, user);
      } catch (err) {
        done(err as Error);
      }
    }
  );

  passport.use("google", strategy);

  // Login route - initiates Google OAuth flow
  app.get(
    "/api/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  // Callback route - handles OAuth callback from Google
  app.get(
    "/api/auth/callback/google",
    passport.authenticate("google", {
      successReturnToOrRedirect: "/",
      failureRedirect: "/login",
    })
  );

  console.log("Google OAuth configured successfully with callback:", callbackURL);
}
