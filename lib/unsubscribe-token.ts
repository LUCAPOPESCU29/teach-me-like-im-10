import { createHmac, timingSafeEqual } from "crypto";

/**
 * Returns a deterministic HMAC token for a given userId + type.
 * Used to sign unsubscribe links so they can't be forged for other users.
 */
export function generateUnsubToken(userId: string, type: string): string {
  const secret =
    process.env.CRON_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "no-secret-set";
  return createHmac("sha256", secret)
    .update(`${userId}:${type}`)
    .digest("hex");
}

/**
 * Verifies an unsubscribe token using timing-safe comparison.
 * Returns false if the token is missing, malformed, or doesn't match.
 */
export function verifyUnsubToken(
  userId: string,
  type: string,
  token: string
): boolean {
  try {
    if (!token || token.length !== 64) return false;
    const expected = generateUnsubToken(userId, type);
    const expectedBuf = Buffer.from(expected, "hex");
    const tokenBuf = Buffer.from(token, "hex");
    if (expectedBuf.length !== tokenBuf.length) return false;
    return timingSafeEqual(expectedBuf, tokenBuf);
  } catch {
    return false;
  }
}
