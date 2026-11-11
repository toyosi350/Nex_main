import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

/*
|--------------------------------------------------------------------
| Claims: `{ userId, role, vendorId }` so role/tenant middleware can
| decide without a database lookup. `claims` is optional to keep
| existing call sites working; `remember` stretches the access token
| to 7 days the way the mock's remember-me did.
|--------------------------------------------------------------------
*/

export const generateAccessToken = (userId, claims = {}, remember = false) => {
  return jwt.sign(
    {
      userId,
      ...claims,
    },
    env.jwtAccessSecret,
    {
      expiresIn: remember ? "7d" : env.jwtAccessExpiresIn,
    }
  );
};

export const generateRefreshToken = (userId) => {
  return jwt.sign(
    {
      userId,
    },
    env.jwtRefreshSecret,
    {
      expiresIn: env.jwtRefreshExpiresIn,
    }
  );
};

export const verifyAccessToken = (token) => {
  return jwt.verify(
    token,
    env.jwtAccessSecret
  );
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(
    token,
    env.jwtRefreshSecret
  );
};

/*
|--------------------------------------------------------------------
| Storefront shoppers are a *separate identity space* from ERP users:
| the token carries `typ: 'shopper'` so the user middleware never
| resolves one as an account (and vice versa). `decodeToken` returns
| the claims or null instead of throwing — caller-side null checks.
|--------------------------------------------------------------------
*/

export const signShopperToken = (shopperId) => {
  return jwt.sign(
    {
      userId: shopperId,
      typ: "shopper",
    },
    env.jwtAccessSecret,
    {
      expiresIn: "30d",
    }
  );
};

export const decodeToken = (token) => {
  if (!token) return null;
  try {
    return jwt.verify(token, env.jwtAccessSecret);
  } catch {
    return null;
  }
};