import jwt from "jsonwebtoken";

let warnedMissingSecret = false;

const getSecret = () => {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is required in production");
  }

  if (!warnedMissingSecret) {
    console.warn(
      "JWT_SECRET is missing. Using temporary dev/test secret. Set JWT_SECRET in backend/.env."
    );
    warnedMissingSecret = true;
  }
  return "healthyai_dev_fallback_secret";
};

const getRefreshSecret = () => {
  if (process.env.JWT_REFRESH_SECRET) return process.env.JWT_REFRESH_SECRET;

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_REFRESH_SECRET is required in production");
  }

  if (!warnedMissingSecret) {
    console.warn(
      "JWT_REFRESH_SECRET is missing. Using temporary dev/test secret. Set JWT_REFRESH_SECRET in backend/.env."
    );
    warnedMissingSecret = true;
  }
  return "healthyai_refresh_dev_fallback_secret";
};

export const signToken = (payload) => {
  const secret = getSecret();

  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m", // Shorter access token
  });
};

export const signRefreshToken = (payload) => {
  const refreshSecret = getRefreshSecret();

  return jwt.sign(payload, refreshSecret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d", // Longer refresh token
  });
};

export const verifyToken = (token) => {
  const secret = getSecret();

  return jwt.verify(token, secret);
};

export const verifyRefreshToken = (token) => {
  const refreshSecret = getRefreshSecret();

  return jwt.verify(token, refreshSecret);
};
