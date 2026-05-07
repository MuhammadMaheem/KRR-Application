import { create } from "zustand";
import { getLibrary, searchPapers as searchApi } from "../api/papers";

const usePapersStore = create((set, get) => ({
  papers: [],
  loading: false,
  error: null,
  searchQuery: "",
  searchYear: "",
  searchPage: 1,
  searchTotal: 0,

  fetchPapers: async () => {
    set({ loading: true, error: null });
    try {
      const res = await getLibrary();
      if (res.status === "success" && res.data) {
        set({ papers: res.data || [], loading: false });
      } else {
        throw new Error("Failed to fetch papers");
      }
    } catch (e) {
      set({ error: e.message, loading: false });
    }
  },

  searchPapers: async (query = "", year = "", page = 1, pageSize = 20) => {
    set({ loading: true, error: null });
    try {
      const res = await searchApi(query, year, page, pageSize);
      set({
        papers: res.papers || [],
        searchTotal: res.total || 0,
        searchPage: res.page || 1,
        searchQuery: query,
        searchYear: year,
        loading: false,
      });
    } catch (e) {
      set({ error: e.message, loading: false });
    }
  },

  addPaper: (paper) =>
    set((state) => ({ papers: [...state.papers, paper] })),

  removePaper: (id) =>
    set((state) => ({
      papers: state.papers.filter((p) => p.id !== id),
    })),
}));

export default usePapersStore;
