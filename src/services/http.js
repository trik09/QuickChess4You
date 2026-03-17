const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

/**
 * Small fetch wrapper that normalizes JSON parsing and error messages.
 * On 401 responses it clears stored auth and fires a "auth:expired" event
 * so the app can redirect to login without hard-coupling to React Router.
 */
export async function apiRequest(endpoint, options = {}, token = null) {
  const config = {
    ...options,
    headers: {
      ...options.headers,
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  if (options.body instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

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

      // Handle expired/invalid token globally
      if (response.status === 401) {
        const code = isJson ? data?.code : null;
        // Only auto-logout for token issues, not for "not a participant" type 401s
        if (!code || code === "TOKEN_EXPIRED" || code === "TOKEN_INVALID" || code === "NO_TOKEN") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          // Fire a global event — AuthContext listens and updates state
          window.dispatchEvent(new CustomEvent("auth:expired", { detail: { message } }));
        }
      }

      throw err;
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError && String(error.message).includes("fetch")) {
      throw new Error(
        "Network error: Could not connect to server. Please check if the backend is running.",
      );
    }
    throw error;
  }
}

