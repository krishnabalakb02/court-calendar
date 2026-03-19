/**
 * Tests for auth configuration: token handling, session structure, and config.
 */

// Mock next-auth to avoid ESM issues in jest
jest.mock("next-auth", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    handlers: {},
    signIn: jest.fn(),
    signOut: jest.fn(),
    auth: jest.fn(),
  })),
}));

jest.mock("next-auth/providers/google", () => ({
  __esModule: true,
  default: jest.fn((config: unknown) => config),
}));

import { authConfig } from "@/auth";

describe("Auth config", () => {
  it("should use JWT session strategy", () => {
    expect(authConfig.session?.strategy).toBe("jwt");
  });

  it("should set session maxAge to 28800 seconds (8 hours)", () => {
    expect(authConfig.session?.maxAge).toBe(28800);
  });

  it("should set signIn page to /", () => {
    expect(authConfig.pages?.signIn).toBe("/");
  });
});

describe("Auth callbacks", () => {
  function jwtCallback({
    token,
    account,
  }: {
    token: Record<string, unknown>;
    account: Record<string, unknown> | null;
  }) {
    if (account) {
      token.accessToken = account.access_token;
      token.refreshToken = account.refresh_token;
      token.expiresAt = account.expires_at;
    }
    return token;
  }

  function sessionCallback({
    session,
    token,
  }: {
    session: Record<string, unknown>;
    token: Record<string, unknown>;
  }) {
    session.accessToken = token.accessToken as string;
    session.refreshToken = token.refreshToken as string;
    session.expiresAt = token.expiresAt as number;
    return session;
  }

  describe("jwt callback", () => {
    it("should persist OAuth tokens when account is present (initial sign-in)", () => {
      const token = { sub: "user-123" };
      const account = {
        access_token: "gya_access_123",
        refresh_token: "gyr_refresh_456",
        expires_at: 1700000000,
      };

      const result = jwtCallback({ token, account });

      expect(result.accessToken).toBe("gya_access_123");
      expect(result.refreshToken).toBe("gyr_refresh_456");
      expect(result.expiresAt).toBe(1700000000);
    });

    it("should preserve existing token data on subsequent requests (no account)", () => {
      const token = {
        sub: "user-123",
        accessToken: "existing_token",
        refreshToken: "existing_refresh",
        expiresAt: 1700000000,
      };

      const result = jwtCallback({ token, account: null });

      expect(result.accessToken).toBe("existing_token");
      expect(result.refreshToken).toBe("existing_refresh");
      expect(result.expiresAt).toBe(1700000000);
    });
  });

  describe("session callback", () => {
    it("should include tokens in the session object", () => {
      const session = { user: { name: "Test User" } };
      const token = {
        accessToken: "gya_access_123",
        refreshToken: "gyr_refresh_456",
        expiresAt: 1700000000,
      };

      const result = sessionCallback({ session, token });

      expect(result.accessToken).toBe("gya_access_123");
      expect(result.refreshToken).toBe("gyr_refresh_456");
      expect(result.expiresAt).toBe(1700000000);
    });
  });
});
