import { getUserToken, setUserToken, clearUserAuth } from "./authStorage";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

// Prevent multiple simultaneous refresh calls (token refresh lock)
let isRefreshing = false;
let refreshSubscribers = []; // callbacks waiting for the new token

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshDone(newToken) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

/**
 * Call /user/refresh using the httpOnly cookie.
 * Returns the new access token string, or throws on failure.
 */
async function doRefresh() {
  const response = await fetch(`${API_BASE_URL}/user/refresh`, {
    method: "POST",
    credentials: "include", // send the httpOnly cookie
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error("Refresh failed");
  }

  const data = await response.json();
  return data.token; // new access token
}

/**
 * Core fetch wrapper.
 * - Attaches Authorization header automatically from localStorage
 * - On 401: silently calls /user/refresh, updates the stored token, retries once
 * - On second 401 (refresh also failed): fires auth:expired → AuthContext logs user out
 */
export async function apiRequest(endpoint, options = {}, token = null) {
  // Use the provided token, or fall back to whatever is in storage
  const resolvedToken = token ?? getUserToken();

  const buildConfig = (t) => {
    const config = {
      ...options,
      credentials: "include", // always include cookies (needed for refresh token cookie)
      headers: {
        ...options.headers,
        "Content-Type": "application/json",
        ...(t && { Authorization: `Bearer ${t}` }),
      },
    };

    // Don't set Content-Type for FormData — browser sets it with boundary
    if (options.body instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  };

  const executeRequest = async (t) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, buildConfig(t));

    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const message =
        (isJson && (data?.message || data?.error)) ||
        (!isJson && data) ||
        "An error occurred";
      const err = new Error(message);
      err.status = response.status;
      err.code = isJson ? data?.code : undefined;
      err.data = isJson ? data : undefined;
      throw err;
    }

    return data;
  };

  try {
    return await executeRequest(resolvedToken);
  } catch (error) {
    // Only attempt refresh on 401 for user token requests
    // Skip refresh for admin token requests and for the refresh/login endpoints themselves
    const isAuthEndpoint =
      endpoint.includes("/user/refresh") ||
      endpoint.includes("/user/login") ||
      endpoint.includes("/user/verify-otp") ||
      endpoint.includes("/user/verify-signup-otp") ||
      endpoint.includes("/user/google-auth");

    const isUserToken = resolvedToken === getUserToken();

    if (error.status === 401 && isUserToken && !isAuthEndpoint) {
      // --- Token refresh logic ---
      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const newToken = await doRefresh();
          setUserToken(newToken); // persist new access token
          isRefreshing = false;
          onRefreshDone(newToken); // unblock any queued requests

          // Retry the original request with the new token
          return await executeRequest(newToken);
        } catch (refreshError) {
          isRefreshing = false;
          onRefreshDone(null);

          // Refresh failed — session is truly expired, force logout
          clearUserAuth();
          window.dispatchEvent(
            new CustomEvent("auth:expired", {
              detail: { message: "Session expired. Please log in again." },
            })
          );
          throw refreshError;
        }
      } else {
        // Another request is already refreshing — queue this one
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((newToken) => {
            if (!newToken) {
              reject(error);
              return;
            }
            executeRequest(newToken).then(resolve).catch(reject);
          });
        });
      }
    }

    // For non-401 errors or admin token errors, just throw
    throw error;
  }
}
