// Token utilities
export const TOKEN_KEYS = {
  ACCESS_TOKEN: "sportify_access_token",
  REFRESH_TOKEN: "sportify_refresh_token",
  USER_INFO: "sportify_user_info",
};

export const getAccessToken = () => localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
export const getRefreshToken = () => localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
export const getUserInfo = () => {
  const raw = localStorage.getItem(TOKEN_KEYS.USER_INFO);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setTokens = (accessToken, refreshToken) => {
  if (accessToken) localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
  if (refreshToken) localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);
};

export const setUserInfo = (user) => {
  localStorage.setItem(TOKEN_KEYS.USER_INFO, JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(TOKEN_KEYS.USER_INFO);
};
