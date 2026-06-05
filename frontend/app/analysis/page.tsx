"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GitCompare, BookOpen } from "lucide-react";
import { getPapers, getAnalyses, createAnalysis, Paper, Analysis } from "@/lib/api";
import AppLayout from "@/components/AppLayout";
import PaperSelector from "@/components/PaperSelector";
import AnalysisResult from "@/components/AnalysisResult";
import { useToast } from "@/components/ToastProvider";

const TYPES = [
  {
    value: "comparative" as const,
    label: "Comparative Analysis",
    desc: "Side-by-side comparison with table + narrative",
    icon: GitCompare,
    color: "violet",
  },
  {
    value: "synthetic_review" as const,
    label: "Synthetic Literature Review",
    desc: "Full review document with themes + gaps",
    icon: BookOpen,
    color: "primary",
  },
];

export default function AnalysisPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [analysisType, setAnalysisType] = useState<"comparative" | "synthetic_review">("comparative");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeAnalysis, setActiveAnalysis] = useState<Analysis | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("krr_token");
    if (!token) { router.push("/login"); return; }
    Promise.all([getPapers(), getAnalyses()])
      .then(([p, a]) => {
        setPapers(p.data.items);
        setAnalyses(a.data);
        if (a.data.length > 0) setActiveAnalysis(a.data[0]);
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleRun = async () => {
    if (selected.length < 2) return;
    setError(null);
    setRunning(true);
    try {
      const res = await createAnalysis(analysisType, selected);
      setAnalyses((prev) => [res.data, ...prev]);
      setActiveAnalysis(res.data);
      setSelected([]);
      toast("Analysis complete!", "success");
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      const errMsg = msg || "Analysis failed";
      setError(errMsg);
      toast(errMsg, "error");
    } finally {
      setRunning(false);
    }
  };

  const processedPapers = papers.filter((p) => p.status === "processed");
  const canRun = selected.length >= 2 && !running;

  const runLabel = running
    ? "Running analysis…"
    : selected.length < 2
    ? `Select ${Math.max(0, 2 - selected.length)} more paper${2 - selected.length === 1 ? "" : "s"} to run`
    : `Run Analysis (${selected.length} papers)`;

  if (loading) {
    return (
      <AppLayout>
        <div className="krr-page krr-page-loading">
          <span className="krr-spinner krr-spinner--lg" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="krr-page rise">
        {/* Header */}
        <div className="krr-page-head">
          <div>
            <div className="eyebrow krr-page-head__eyebrow">Workspace</div>
            <h1 className="krr-page-head__title">Analysis</h1>
            <p className="krr-page-head__sub">Compare papers or generate literature reviews using AI</p>
          </div>
        </div>

        <div className="krr-analysis-layout">
          {/* Config panel */}
          <div className="krr-analysis-config">

            {/* Step 1 — Type */}
            <div className="krr-card krr-config-card">
              <div className="krr-config-card__head">
                <div className="krr-step">1</div>
                <span className="krr-config-card__title">Analysis Type</span>
              </div>
              <div className="krr-type-cards">
                {TYPES.map((opt) => {
                  const active = analysisType === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className={[
                        "krr-type-card",
                        active ? `krr-type-card--active-${opt.color}` : "",
                      ].filter(Boolean).join(" ")}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={opt.value}
                        checked={active}
                        onChange={() => setAnalysisType(opt.value)}
                        className="sr-only"
                      />
                      <div className={`krr-type-card__icon${active ? ` krr-type-card__icon--${opt.color}` : ""}`}>
                        <opt.icon size={16} strokeWidth={2} />
                      </div>
                      <div>
                        <div className="krr-type-card__name">{opt.label}</div>
                        <div className="krr-type-card__desc">{opt.desc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Step 2 — Papers */}
            <div className="krr-card krr-config-card">
              <div className="krr-config-card__subhead">
                <div className="krr-config-card__head--flush">
                  <div className="krr-step">2</div>
                  <span className="krr-config-card__title">Select Papers</span>
                </div>
                {selected.length > 0 && (
                  <span className="krr-selected-pill">{selected.length} selected</span>
                )}
              </div>
              {processedPapers.length === 0 ? (
                <div className="krr-empty krr-selector__empty">
                  <div className="krr-empty__icon" />
                  <div className="krr-empty__title">No processed papers</div>
                  <div className="krr-papers-empty-sub">Upload and wait for papers to finish processing.</div>
                </div>
              ) : (
                <>
                  <div className="eyebrow krr-selector-hint">Select 2 or more to enable Run</div>
                  <PaperSelector papers={processedPapers} selected={selected} onChange={setSelected} />
                </>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="krr-auth__error">
                <span>{error}</span>
              </div>
            )}

            {/* Run button */}
            <button
              type="button"
              onClick={handleRun}
              disabled={!canRun}
              className="krr-run-btn"
            >
              {running && <span className="krr-spinner krr-spinner--sm krr-spinner--inv" />}
              {runLabel}
            </button>
          </div>

          {/* Results panel */}
          <div className="krr-analysis-results">
            {analyses.length > 0 && (
              <div className="krr-hist-tabs">
                {analyses.slice(0, 5).map((a, i) => {
                  const isComp = a.type === "comparative";
                  const isActive = activeAnalysis?.id === a.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setActiveAnalysis(a)}
                      className={`krr-hist-tab${isActive ? " krr-hist-tab--active" : ""}`}
                    >
                      <span className={`krr-hist-tab__dot ${isComp ? "krr-hist-tab__dot--violet" : "krr-hist-tab__dot--primary"}`} />
                      {i === 0 ? "Latest" : `#${analyses.length - i}`}
                      <span>{isComp ? "Compare" : "Review"}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {!activeAnalysis ? (
              <div className="krr-empty krr-analysis-empty">
                <div className="krr-empty__icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </div>
                <div className="krr-empty__title">No analyses yet</div>
                <div className="krr-papers-empty-sub">Complete Steps 1 &amp; 2, then click Run</div>
              </div>
            ) : (
              <AnalysisResult
                key={activeAnalysis.id}
                result={activeAnalysis.result}
                type={activeAnalysis.type}
                paperTitles={activeAnalysis.paper_titles}
                createdAt={activeAnalysis.created_at}
              />
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
