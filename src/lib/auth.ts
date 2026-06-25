// Voyle — auth helpers
// Simple HMAC-SHA256 signed cookie token for passcode-based access.

import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "voyle_auth";
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return secret;
}

/** Sign a payload with HMAC-SHA256. Returns "payload.signature" base64url string. */
export function signToken(payload: string): string {
  const sig = createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

/** Verify a signed token. Returns the payload if valid, null otherwise. */
export function verifyToken(token: string): string | null {
  const idx = token.lastIndexOf(".");
  if (idx === -1) return null;
  const payload = token.slice(0, idx);
  const sig = token.slice(idx + 1);

  const expectedSig = createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");

  try {
    if (sig.length !== expectedSig.length) return null;
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Create an auth token with an expiry timestamp. */
export function createAuthToken(): string {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  return signToken(`auth.${expiresAt}`);
}

/** Verify an auth token and check it hasn't expired. */
export function isValidAuthToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const payload = verifyToken(token);
  if (!payload) return false;
  const parts = payload.split(".");
  if (parts.length !== 2 || parts[0] !== "auth") return false;
  const expiresAt = Number(parts[1]);
  if (!expiresAt || Date.now() > expiresAt) return false;
  return true;
}

export { COOKIE_NAME };