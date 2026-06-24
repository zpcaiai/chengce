// Stateless signed-cookie sessions. HMAC-SHA256 over a base64url JSON payload —
// no external dependency. Set AUTH_SECRET in production.
import crypto from "node:crypto";

const SECRET = process.env.AUTH_SECRET || "dev-insecure-secret-change-me";
const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
export const SESSION_COOKIE = "chengce_session";

const b64url = (b: Buffer) => b.toString("base64url");
const fromB64url = (s: string) => Buffer.from(s, "base64url");

interface SessionPayload {
  uid: string;
  exp: number; // epoch seconds
}

export function signSession(userId: string): string {
  const payload: SessionPayload = { uid: userId, exp: Math.floor(Date.now() / 1000) + TTL_SECONDS };
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  const sig = b64url(crypto.createHmac("sha256", SECRET).update(body).digest());
  return `${body}.${sig}`;
}

export function verifySession(token: string | undefined | null): string | null {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const expected = b64url(crypto.createHmac("sha256", SECRET).update(body).digest());
  const a = fromB64url(sig);
  const b = fromB64url(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(fromB64url(body).toString()) as SessionPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload.uid;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: TTL_SECONDS,
};
