const accessTokenBlacklist = new Map();
const refreshTokenStore = new Map();
const passwordResetTokenStore = new Map();

const nowMs = () => Date.now();

const cleanupExpired = (store) => {
  const current = nowMs();
  for (const [token, data] of store.entries()) {
    if (!data?.expiresAt || data.expiresAt <= current) {
      store.delete(token);
    }
  }
};

export class TokenStore {
  static blacklistAccessToken(token, expiresAt) {
    cleanupExpired(accessTokenBlacklist);
    accessTokenBlacklist.set(token, { expiresAt });
  }

  static isAccessTokenBlacklisted(token) {
    cleanupExpired(accessTokenBlacklist);
    return accessTokenBlacklist.has(token);
  }

  static saveRefreshToken(token, userId, expiresAt) {
    cleanupExpired(refreshTokenStore);
    refreshTokenStore.set(token, { userId, expiresAt, revoked: false });
  }

  static revokeRefreshToken(token) {
    const current = refreshTokenStore.get(token);
    if (!current) {
      return false;
    }
    refreshTokenStore.set(token, { ...current, revoked: true });
    return true;
  }

  static getRefreshToken(token) {
    cleanupExpired(refreshTokenStore);
    const current = refreshTokenStore.get(token);
    if (!current || current.revoked) {
      return null;
    }
    return current;
  }

  static savePasswordResetToken(token, userId, expiresAt) {
    cleanupExpired(passwordResetTokenStore);
    passwordResetTokenStore.set(token, { userId, expiresAt, used: false });
  }

  static consumePasswordResetToken(token) {
    cleanupExpired(passwordResetTokenStore);
    const current = passwordResetTokenStore.get(token);
    if (!current || current.used) {
      return null;
    }
    passwordResetTokenStore.set(token, { ...current, used: true });
    return current;
  }

  static hasPasswordResetToken(token) {
    cleanupExpired(passwordResetTokenStore);
    const current = passwordResetTokenStore.get(token);
    return !!current && !current.used;
  }
}

