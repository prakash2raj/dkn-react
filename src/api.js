const API_URL = (
  import.meta.env.VITE_API_URL || "https://dkn.hostbala.com"
).replace(/\/$/, "");

let onUnauthorized = null;

const buildUrl = (path) => {
  if (path.startsWith("http")) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (API_URL.endsWith("/api") && normalizedPath.startsWith("/api/")) {
    return `${API_URL}${normalizedPath.slice(4)}`;
  }
  return `${API_URL}${normalizedPath}`;
};

export const apiRequest = async (
  path,
  method = "GET",
  body,
  extraHeadersOrToken = {}
) => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(typeof extraHeadersOrToken === "string"
      ? { Authorization: `Bearer ${extraHeadersOrToken}` }
      : extraHeadersOrToken),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(buildUrl(path), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    const error = new Error(
      networkErr?.message || "Network error contacting the API."
    );
    error.data = null;
    throw error;
  }

  let data = null;
  try {
    data = await res.json();
  } catch (err) {
    data = null;
  }

  if (!res.ok) {
    const message = data?.message || `API error: ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    if (res.status === 401 && typeof onUnauthorized === "function") {
      onUnauthorized();
    }
    throw error;
  }

  return data;
};

export const registerUnauthorizedHandler = (handler) => {
  onUnauthorized = typeof handler === "function" ? handler : null;
};
