import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 28800, // 8 hours
  },
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, account }: any) {
      // First login — store tokens from Google
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
        };
      }

      // Token still valid (with 60s buffer) — return as-is
      if (Date.now() < (token.expiresAt as number) * 1000 - 60_000) {
        return token;
      }

      // Token expired — refresh using the refresh token
      try {
        const response = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            grant_type: "refresh_token",
            refresh_token: token.refreshToken as string,
          }),
        });

        if (!response.ok) throw new Error("Token refresh failed");

        const data = await response.json();
        return {
          ...token,
          accessToken: data.access_token,
          expiresAt: Math.floor(Date.now() / 1000) + (data.expires_in as number),
          error: undefined,
        };
      } catch {
        // Refresh failed — flag the session so the client can prompt re-login
        return { ...token, error: "RefreshAccessTokenError" };
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      session.expiresAt = token.expiresAt as number;
      session.error = token.error as string | undefined;
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
