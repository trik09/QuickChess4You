const KEYS = {
  user: "user",
  token: "token",
  admin: "admin",
  atoken: "atoken",
};

function safeJsonParse(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function getUser() {
  return safeJsonParse(localStorage.getItem(KEYS.user));
}

export function setUser(user) {
  localStorage.setItem(KEYS.user, JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem(KEYS.user);
}

export function getAdmin() {
  return safeJsonParse(localStorage.getItem(KEYS.admin));
}

export function setAdmin(admin) {
  localStorage.setItem(KEYS.admin, JSON.stringify(admin));
}

export function clearAdmin() {
  localStorage.removeItem(KEYS.admin);
}

export function getUserToken() {
  return localStorage.getItem(KEYS.token) || null;
}

export function setUserToken(token) {
  if (token == null) localStorage.removeItem(KEYS.token);
  else localStorage.setItem(KEYS.token, token);
}

export function clearUserToken() {
  localStorage.removeItem(KEYS.token);
}

export function getAdminToken() {
  return localStorage.getItem(KEYS.atoken) || null;
}

export function setAdminToken(token) {
  if (token == null) localStorage.removeItem(KEYS.atoken);
  else localStorage.setItem(KEYS.atoken, token);
}

export function clearAdminToken() {
  localStorage.removeItem(KEYS.atoken);
}

export function clearUserAuth() {
  clearUser();
  clearUserToken();
}

export function clearAdminAuth() {
  clearAdmin();
  clearAdminToken();
}

/**
 * Keep existing behavior: admin token wins if present.
 */
export function getPreferredAuthHeader() {
  const atoken = getAdminToken();
  if (atoken) return { Authorization: `Bearer ${atoken}` };
  const token = getUserToken();
  if (token) return { Authorization: `Bearer ${token}` };
  return {};
}

