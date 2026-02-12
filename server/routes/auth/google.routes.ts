import type { Express } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { storage } from "../../storage";
import crypto from "crypto";

/**
 * Google OAuth Authentication Routes
 * Handles Google login/signup for both Customer and Pro users
 */
export async function registerGoogleAuthRoutes(app: Express): Promise<void> {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback";

  if (!clientID || !clientSecret) {
    console.log("[Google OAuth] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set, skipping Google OAuth setup");
    return;
  }

  // Register Google Strategy
  passport.use(
    "google",
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
        passReqToCallback: true,
      },
      async (req: any, accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value;
          const firstName = profile.name?.givenName || null;
          const lastName = profile.name?.familyName || null;
          const role = req.session?.googleOAuthRole === "pro" ? "hauler" : "customer";

          if (!email) {
            return done(null, false, { message: "No email associated with this Google account" });
          }

          // Check if user exists by googleId
          let user = await storage.getUserByGoogleId(googleId);

          if (!user) {
            // Check if user exists by email
            user = await storage.getUserByEmail(email);

            if (user) {
              // Link Google ID to existing account
              await storage.updateUserGoogleId(user.id, googleId);
            } else {
              // Create new user
              const newUserData: any = {
                id: crypto.randomUUID(),
                username: email,
                email,
                firstName,
                lastName,
                role,
                googleId,
              };

              user = await storage.createUser(newUserData);
            }
          }

          const sessionUser = {
            localAuth: true,
            googleAuth: true,
            userId: user.id,
            role: user.role,
          };

          return done(null, sessionUser);
        } catch (error) {
          console.error("[Google OAuth] Error in strategy callback:", error);
          return done(error);
        }
      }
    )
  );

  // Initiate Google OAuth flow
  app.get("/api/auth/google", (req, res, next) => {
    const role = req.query.role as string;
    if (role === "pro" || role === "customer") {
      (req.session as any).googleOAuthRole = role;
    }

    const doAuth = () => {
      passport.authenticate("google", {
        scope: ["profile", "email"],
      })(req, res, next);
    };

    // Save session before redirect so role persists
    if (typeof (req.session as any).save === "function") {
      (req.session as any).save(doAuth);
    } else {
      doAuth();
    }
  });

  // Google OAuth callback
  app.get("/api/auth/google/callback", (req, res, next) => {
    passport.authenticate("google", (err: any, user: any, info: any) => {
      if (err) {
        console.error("[Google OAuth] Callback error:", err);
        return res.redirect("/login?error=oauth_failed");
      }
      if (!user) {
        return res.redirect("/login?error=oauth_denied");
      }

      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("[Google OAuth] Login error:", loginErr);
          return res.redirect("/login?error=login_failed");
        }

        // Redirect based on role
        if (user.role === "hauler") {
          return res.redirect("/pro/dashboard");
        } else {
          return res.redirect("/dashboard");
        }
      });
    })(req, res, next);
  });

  // Mobile app: verify Google ID token
  app.post("/api/auth/google/token", async (req, res) => {
    try {
      const { idToken, role: requestedRole } = req.body;

      if (!idToken) {
        return res.status(400).json({ error: "idToken is required" });
      }

      // Verify the token with Google
      const { OAuth2Client } = await import("google-auth-library");
      const client = new OAuth2Client(clientID);

      const ticket = await client.verifyIdToken({
        idToken,
        audience: clientID,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        return res.status(400).json({ error: "Invalid Google token" });
      }

      const googleId = payload.sub;
      const email = payload.email;
      const firstName = payload.given_name || null;
      const lastName = payload.family_name || null;
      const role = requestedRole === "pro" ? "hauler" : "customer";

      // Check if user exists by googleId
      let user = await storage.getUserByGoogleId(googleId);

      if (!user) {
        user = await storage.getUserByEmail(email);

        if (user) {
          await storage.updateUserGoogleId(user.id, googleId);
        } else {
          user = await storage.createUser({
            id: crypto.randomUUID(),
            username: email,
            email,
            firstName,
            lastName,
            role,
            googleId,
          } as any);
        }
      }

      const sessionUser = {
        localAuth: true,
        googleAuth: true,
        userId: user.id,
        role: user.role,
      };

      req.login(sessionUser, (loginErr) => {
        if (loginErr) {
          console.error("[Google OAuth] Token login error:", loginErr);
          return res.status(500).json({ error: "Login failed" });
        }

        return res.json({
          success: true,
          message: "Login successful",
          role: user!.role,
          userId: user!.id,
        });
      });
    } catch (error) {
      console.error("[Google OAuth] Token verification error:", error);
      return res.status(401).json({ error: "Invalid or expired Google token" });
    }
  });

  console.log("[Google OAuth] Routes registered successfully");
}
