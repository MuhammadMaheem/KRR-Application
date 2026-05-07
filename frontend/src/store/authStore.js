import { create } from "zustand";

const useAuthStore = create((set) => ({
  token: localStorage.getItem("authToken") || null,
  user: JSON.parse(localStorage.getItem("user") || "null"),

  setAuth: (token, user) => {
    localStorage.setItem("authToken", token);
    if (user) localStorage.setItem("user", JSON.stringify(user));
    set({ token, user: user || null });
  },

  logout: () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    set({ token: null, user: null });
  },

  isAuthenticated: () => !!localStorage.getItem("authToken"),
}));

export default useAuthStore;
