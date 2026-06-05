import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("krr_token") || "";
}

export const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

// Auth
export const register = (email: string, password: string) =>
  api.post<AuthResponse>("/api/auth/register", { email, password });

export const login = (email: string, password: string) =>
  api.post<AuthResponse>("/api/auth/login", { email, password });

export const getMe = () => api.get<{ id: string; email: string }>("/api/auth/me");

export const changePassword = (current_password: string, new_password: string) =>
  api.post("/api/auth/change-password", { current_password, new_password });

// Papers
export const getPapers = (page = 1, limit = 20, q?: string) => {
  const params: Record<string, string | number> = { page, limit };
  if (q) params.q = q;
  return api.get<PaginatedPapers>("/api/papers", { params });
};
export const getPaper = (id: string) => api.get<Paper>(`/api/papers/${id}`);
export const uploadPaper = (file: File) => {
  const form = new FormData();
  form.append("file", file);
  return api.post<Paper>("/api/papers/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
export const deletePaper = (id: string) => api.delete(`/api/papers/${id}`);
export const resummarizePaper = (id: string) =>
  api.post<Paper>(`/api/papers/${id}/summarize`);

export const citePaper = (id: string, format: "bibtex" | "apa" | "mla") =>
  api.get<string>(`/api/papers/${id}/cite`, { params: { format } });

export const chatWithPaper = (id: string, question: string) =>
  api.post<ChatResponse>(`/api/papers/${id}/chat`, { question });

export const semanticSearch = (q: string, limit = 10) =>
  api.get<Paper[]>(`/api/search`, { params: { q, limit } });

// Analyses
export const getAnalyses = () => api.get<Analysis[]>("/api/analyses");
export const getAnalysis = (id: string) =>
  api.get<Analysis>(`/api/analyses/${id}`);
export const createAnalysis = (type: string, paper_ids: string[]) =>
  api.post<Analysis>("/api/analyses", { type, paper_ids });

// Types
export interface PaginatedPapers {
  items: Paper[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AuthResponse {
  token: string;
  email: string;
}

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract?: string;
  file_name: string;
  file_size?: number;
  page_count?: number;
  status: "pending" | "processing" | "processed" | "error";
  summary?: string;
  content?: string;
  error_message?: string;
  created_at?: string;
}

export interface ChatResponse {
  answer: string;
  paper_id: string;
  question: string;
}

export interface Analysis {
  id: string;
  type: "comparative" | "synthetic_review";
  paper_ids: string[];
  paper_titles?: string[];
  result: string;
  created_at?: string;
}
