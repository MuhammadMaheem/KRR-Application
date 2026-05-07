import client from "./client";

export async function login(email, password) {
  const formData = new FormData();
  formData.append("username", email);
  formData.append("password", password);

  const res = await fetch(
    `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/auth/login`,
    { method: "POST", body: formData }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Login failed" }));
    throw new Error(err.detail || "Login failed");
  }
  return res.json();
}

export async function register(email, password, role = "researcher") {
  return client.post("/api/v1/auth/register", { email, password, role });
}
