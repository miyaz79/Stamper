import { createRemoteJWKSet, JWTPayload, jwtVerify } from "jose";
import type { Env } from "./env";

let jwksCache: ReturnType<typeof createRemoteJWKSet> | undefined;

function getRemoteJwks(env: Env) {
  if (jwksCache) return jwksCache;
  const jwksUri = new URL(`${env.issuer}/.well-known/jwks.json`);
  jwksCache = createRemoteJWKSet(jwksUri);
  return jwksCache;
}

export async function verifyAccessToken(token: string, env: Env): Promise<JWTPayload> {
  const JWKS = getRemoteJwks(env);
  const result = await jwtVerify(token, JWKS, {
    issuer: env.issuer,
    audience: env.audience
  });
  return result.payload;
}
