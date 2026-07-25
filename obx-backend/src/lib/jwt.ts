import { createRemoteJWKSet, jwtVerify } from "jose";

export interface SupabaseJWTPayload {
  sub: string; // user id
  email: string;
  role: string;
  aud: string;
  exp: number;
  iat: number;
}

/**
 * Verify a Supabase JWT using the project's JWKS endpoint.
 * ponytail: using JWKS endpoint instead of symmetric secret — upgrade path is to
 * cache the JWKS in KV if latency becomes an issue.
 */
export async function verifySupabaseJWT(
  token: string,
  supabaseUrl: string
): Promise<SupabaseJWTPayload> {
  const JWKS = createRemoteJWKSet(
    new URL(`${supabaseUrl}/auth/v1/jwks`)
  );
  const { payload } = await jwtVerify(token, JWKS, {
    audience: "authenticated",
  });
  return payload as unknown as SupabaseJWTPayload;
}

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}
