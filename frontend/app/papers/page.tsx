"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { FileText, Search, X } from "lucide-react";
import { getPapers, Paper } from "@/lib/api";
import AppLayout from "@/components/AppLayout";
import PaperCard from "@/components/PaperCard";
import UploadForm from "@/components/UploadForm";

export default function PapersPage() {
  const router = useRouter();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPapers = useCallback(async (q?: string) => {
    try {
      const res = await getPapers(1, 50, q || undefined);
      setPapers(res.data.items);
      setTotal(res.data.total);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem("krr_token");
    if (!token) { router.push("/login"); return; }
    fetchPapers();
  }, [fetchPapers, router]);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQ(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  useEffect(() => {
    fetchPapers(debouncedQ || undefined);
  }, [debouncedQ, fetchPapers]);

  // Poll while papers are processing
  useEffect(() => {
    const hasPending = papers.some((p) => ["pending", "processing"].includes(p.status));
    if (!hasPending) return;
    const id = setInterval(() => fetchPapers(debouncedQ || undefined), 3000);
    return () => clearInterval(id);
  }, [papers, debouncedQ, fetchPapers]);

  const processed = papers.filter((p) => p.status === "processed").length;
  const pending   = papers.filter((p) => ["pending", "processing"].includes(p.status)).length;

  return (
    <AppLayout>
      <div className="krr-page rise">
        {/* Header */}
        <div className="krr-papers-header">
          <div>
            <div className="eyebrow krr-page-head__eyebrow">Library</div>
            <h1 className="krr-page-head__title">Papers</h1>
            <p className="krr-page-head__sub">
              {total > 0
                ? `${total} paper${total > 1 ? "s" : ""} in your repository`
                : "Upload research PDFs to get started"}
            </p>
          </div>
          {total > 0 && (
            <span className="krr-processed-pill">
              {processed} / {total} processed
            </span>
          )}
        </div>

        {/* Upload zone */}
        <UploadForm onUploaded={(paper) => { setPapers((prev) => [paper, ...prev]); setTotal((t) => t + 1); }} />

        {/* Search bar */}
        <div className="krr-search-wrap">
          <Search size={14} className="krr-search-icon" />
          <input
            type="text"
            className="krr-search-input"
            placeholder="Search by title or abstract…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button type="button" className="krr-search-clear" onClick={() => setQuery("")} aria-label="Clear search">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Processing banner */}
        {pending > 0 && (
          <div className="krr-banner krr-banner--pend krr-papers-banner">
            <span className="krr-spinner krr-spinner--sm krr-spinner--pend" />
            <span>
              <strong>{pending}</strong> paper{pending > 1 ? "s" : ""} processing…
            </span>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="krr-papers-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="sk krr-skel-card" />
            ))}
          </div>
        ) : papers.length === 0 ? (
          <div className="krr-empty krr-papers-empty">
            <div className="krr-empty__icon"><FileText size={22} /></div>
            <div className="krr-empty__title">
              {query ? `No results for "${query}"` : "No papers yet"}
            </div>
            {!query && <div className="krr-papers-empty-sub">Drop a PDF above to get started</div>}
          </div>
        ) : (
          <div className="krr-papers-grid">
            {papers.map((p) => (
              <PaperCard key={p.id} paper={p} onDeleted={() => fetchPapers(debouncedQ || undefined)} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
