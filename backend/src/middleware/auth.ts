import { NextFunction, Request, Response } from 'express';
import { createRemoteJWKSet, errors, jwtVerify, JWTPayload } from 'jose';

type TokenRole = 'user' | 'admin';

export type AuthenticatedRequest = Request & {
  auth?: {
    email: string;
    tokenRole: TokenRole;
    claims: JWTPayload;
  };
};

type TokenClaims = JWTPayload & {
  email?: string;
  preferred_username?: string;
  upn?: string;
  username?: string;
  'http://wso2.org/claims/emailaddress'?: string;
  'http://wso2.org/claims/username'?: string;
  role?: string;
  roles?: string[];
  groups?: string[];
};

const extractBearerToken = (header: string | undefined): string | null => {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
};

type OIDCConfiguration = {
  issuer: string;
  jwks_uri: string;
};

type AsgardeoVerifier = {
  issuer: string;
  audience: string;
  jwks: ReturnType<typeof createRemoteJWKSet>;
};

let verifierPromise: Promise<AsgardeoVerifier> | null = null;

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const loadOIDCConfiguration = async (baseUrl: string): Promise<OIDCConfiguration> => {
  const normalizedBaseUrl = trimTrailingSlash(baseUrl);

  const candidates = [
    `${normalizedBaseUrl}/oauth2/token/.well-known/openid-configuration`,
    `${normalizedBaseUrl}/oauth2/.well-known/openid-configuration`,
    `${normalizedBaseUrl}/.well-known/openid-configuration`,
  ];

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate);

      if (!response.ok) {
        continue;
      }

      const parsed = (await response.json()) as Partial<OIDCConfiguration>;
      if (parsed.issuer && parsed.jwks_uri) {
        return {
          issuer: parsed.issuer,
          jwks_uri: parsed.jwks_uri,
        };
      }
    } catch {
      // Try the next known discovery URL.
    }
  }

  throw new Error(`Unable to load OIDC discovery metadata for ASGARDEO_BASE_URL=${baseUrl}`);
};

const getAsgardeoVerifier = async (): Promise<AsgardeoVerifier> => {
  const baseUrl = process.env.ASGARDEO_BASE_URL;
  const clientId = process.env.ASGARDEO_CLIENT_ID;

  if (!baseUrl || !clientId) {
    throw new Error('ASGARDEO_BASE_URL and ASGARDEO_CLIENT_ID must be configured');
  }

  if (!verifierPromise) {
    verifierPromise = (async () => {
      const config = await loadOIDCConfiguration(baseUrl);

      return {
        issuer: config.issuer,
        audience: clientId,
        jwks: createRemoteJWKSet(new URL(config.jwks_uri)),
      };
    })();

    verifierPromise.catch(() => {
      verifierPromise = null;
    });
  }

  return verifierPromise;
};

const getEmailFromClaims = (claims: TokenClaims): string | null => {
  const email =
    claims.email ??
    claims.preferred_username ??
    claims.upn ??
    claims.username ??
    claims['http://wso2.org/claims/emailaddress'] ??
    claims['http://wso2.org/claims/username'];

  if (typeof email === 'string' && email.trim()) {
    return email.trim().toLowerCase();
  }

  if (typeof claims.sub === 'string' && claims.sub.includes('@')) {
    return claims.sub.trim().toLowerCase();
  }

  return null;
};

const getRoleFromClaims = (claims: TokenClaims): TokenRole => {
  const roleSources: string[] = [];

  if (typeof claims.role === 'string') roleSources.push(claims.role);
  if (Array.isArray(claims.roles)) roleSources.push(...claims.roles);
  if (Array.isArray(claims.groups)) roleSources.push(...claims.groups);

  const normalized = roleSources.map((value) => value.toLowerCase());
  return normalized.includes('admin') ? 'admin' : 'user';
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    res.status(401).json({ message: 'Missing or invalid Authorization header' });
    return;
  }

  try {
    const verifier = await getAsgardeoVerifier();
    const verified = await jwtVerify(token, verifier.jwks, {
      issuer: verifier.issuer,
      audience: verifier.audience,
      algorithms: ['RS256'],
    });

    const claims = verified.payload as TokenClaims;
    const email = getEmailFromClaims(claims);

    if (!email) {
      res.status(401).json({ message: 'JWT does not contain an email claim' });
      return;
    }

    const authReq = req as AuthenticatedRequest;

    authReq.auth = {
      email,
      tokenRole: getRoleFromClaims(claims),
      claims,
    };

    next();
  } catch (error) {
    if (error instanceof Error && error.message.includes('ASGARDEO_BASE_URL')) {
      res.status(500).json({ message: error.message });
      return;
    }

    if (error instanceof errors.JWTExpired) {
      res.status(401).json({ message: 'JWT has expired' });
      return;
    }

    if (error instanceof errors.JWTClaimValidationFailed) {
      res.status(401).json({ message: `JWT claim validation failed: ${error.claim}` });
      return;
    }

    res.status(401).json({
      message: 'Invalid or expired JWT',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
