const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

/**
 * Small fetch wrapper that normalizes JSON parsing and error messages.
 * It intentionally does not perform navigation/redirects.
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
      err.data = isJson ? data : undefined;
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

