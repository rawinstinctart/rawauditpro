import { Express } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { storage } from "./storage";

export function setupGoogleAuth(app: Express) {
  if (!process.env.GOOGLE_CLIENT_ID) {
    console.log("Google OAuth: GOOGLE_CLIENT_ID not set, skipping Google auth setup");
    return;
  }
  if (!process.env.GOOGLE_CLIENT_SECRET) {
    console.log("Google OAuth: GOOGLE_CLIENT_SECRET not set, skipping Google auth setup");
    return;
  }
  if (!process.env.GOOGLE_REDIRECT_URI) {
    console.log("Google OAuth: GOOGLE_REDIRECT_URI not set, skipping Google auth setup");
    return;
  }

  async function upsertUser(profile: any) {
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
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URI,
      scope: ["profile", "email"],
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

  app.get(
    "/api/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", {
      successReturnToOrRedirect: "/",
      failureRedirect: "/login",
    })
  );

  console.log("Google OAuth configured successfully");
}
