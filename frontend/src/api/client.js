const API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000";

// Simple fetch wrapper with auth header
async function request(path, options = {}) {
  const token = localStorage.getItem("authToken");
  console.log(`[API Request] ${options.method || "GET"} ${API_URL}${path}`);
  console.log(`[API Request] Token present:`, !!token);
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  else console.warn(`[API Request] No auth token found for ${path}`);

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

export default {
  get: (path) => request(path, { method: "GET" }),
  post: (path, body) =>
    request(path, { method: "POST", body: JSON.stringify(body) }),
  postForm: (path, formData) =>
    fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: {
        ...(localStorage.getItem("authToken")
          ? { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
          : {}),
      },
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || "Request failed");
      }
      return res.json();
    }),
  del: (path) => request(path, { method: "DELETE" }),
};
