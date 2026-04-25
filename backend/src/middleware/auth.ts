import { expressjwt as jwt } from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import dotenv from 'dotenv';

dotenv.config();

export const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `${process.env.ASGARDEO_BASE_URL}/oauth2/jwks`
  }) as any,

  // Validate the audience and the issuer.
  audience: process.env.ASGARDEO_CLIENT_ID,
  issuer: `${process.env.ASGARDEO_BASE_URL}/oauth2/token`,
  algorithms: ['RS256']
});