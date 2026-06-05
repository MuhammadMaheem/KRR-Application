"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, CheckCircle2, BarChart3, ChevronRight, Plus, GitCompare, BookOpen, AlertCircle } from "lucide-react";
import { getPapers, getAnalyses, Paper, Analysis } from "@/lib/api";
import AppLayout from "@/components/AppLayout";
import StatusBadge from "@/components/StatusBadge";

export default function DashboardPage() {
  const router = useRouter();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("krr_token");
    if (!token) { router.push("/login"); return; }
    Promise.all([getPapers(), getAnalyses()])
      .then(([p, a]) => { setPapers(p.data.items); setAnalyses(a.data); })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const processed = papers.filter((p) => p.status === "processed").length;
  const pending   = papers.filter((p) => ["pending", "processing"].includes(p.status)).length;
  const errors    = papers.filter((p) => p.status === "error").length;

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
            <div className="eyebrow krr-page-head__eyebrow">Overview</div>
            <h1 className="krr-page-head__title">Dashboard</h1>
            <p className="krr-page-head__sub">Your research at a glance</p>
          </div>
        </div>

        {/* Processing banner */}
        {pending > 0 && (
          <div className="krr-banner krr-banner--pend">
            <span className="krr-spinner krr-spinner--sm krr-spinner--pend" />
            <span><strong>{pending}</strong> paper{pending > 1 ? "s" : ""} still processing — AI summary generating…</span>
          </div>
        )}

        {/* Stats */}
        <div className="krr-dash-stats">
          {[
            { label: "Total Papers",  value: papers.length,    icon: FileText,     iconCls: "krr-stat__icon--primary", note: `${papers.length} in repository`,          noteErr: false },
            { label: "Processed",     value: processed,        icon: CheckCircle2, iconCls: "krr-stat__icon--ready",   note: errors > 0 ? `${errors} error${errors > 1 ? "s" : ""}` : "all clean", noteErr: errors > 0 },
            { label: "Analyses Run",  value: analyses.length,  icon: BarChart3,    iconCls: "krr-stat__icon--violet",  note: "comparisons & reviews",                   noteErr: false },
          ].map(({ label, value, icon: Icon, iconCls, note, noteErr }) => (
            <div key={label} className="krr-card krr-stat">
              <div className="krr-dash-stat-row">
                <div className={`krr-stat__icon ${iconCls}`}><Icon size={18} strokeWidth={2} /></div>
                <span className={`eyebrow krr-stat__note ${noteErr ? "krr-stat__note--err" : "krr-stat__note--ok"}`}>
                  {noteErr && <AlertCircle size={11} />}{note}
                </span>
              </div>
              <div className="krr-stat__value">{value}</div>
              <div className="eyebrow krr-stat__label">{label}</div>
            </div>
          ))}
        </div>

        {/* Two-column */}
        <div className="krr-dash-cols">
          {/* Recent Papers */}
          <section className="krr-dash-col">
            <div className="krr-section-label">
              <h2 className="krr-section-label__title">Recent Papers</h2>
              <Link href="/papers" className="krr-section-label__link">
                View all <ChevronRight size={14} />
              </Link>
            </div>
            {papers.length === 0 ? (
              <div className="krr-empty">
                <div className="krr-empty__icon"><FileText size={21} /></div>
                <div className="krr-empty__title">No papers yet</div>
                <Link href="/papers" className="krr-empty__link">Upload your first paper</Link>
              </div>
            ) : (
              <div className="krr-dash-paper-list">
                {papers.slice(0, 6).map((p) => (
                  <Link key={p.id} href={`/papers/${p.id}`} className="krr-card krr-card--hover krr-dash-paper-row">
                    <div className="krr-dash-paper-text">
                      <div className="krr-dash-paper-title">{p.title}</div>
                      {p.authors?.length > 0 && (
                        <div className="krr-dash-paper-authors">{p.authors.slice(0, 3).join(", ")}</div>
                      )}
                    </div>
                    <div className="krr-dash-paper-right">
                      <StatusBadge status={p.status} />
                      <ChevronRight size={15} color="var(--text-faint)" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Recent Analyses */}
          <section className="krr-dash-col">
            <div className="krr-section-label">
              <h2 className="krr-section-label__title">Recent Analyses</h2>
              <Link href="/analysis" className="krr-section-label__link">
                New <Plus size={13} />
              </Link>
            </div>
            {analyses.length === 0 ? (
              <div className="krr-empty">
                <div className="krr-empty__icon"><BarChart3 size={21} /></div>
                <div className="krr-empty__title">No analyses yet</div>
                <Link href="/analysis" className="krr-empty__link">Run an analysis</Link>
              </div>
            ) : (
              <div className="krr-dash-analysis-list">
                {analyses.slice(0, 4).map((a) => {
                  const comp = a.type === "comparative";
                  return (
                    <div key={a.id} className="krr-card krr-dash-analysis-card">
                      <div className="krr-dash-analysis-meta">
                        <span className={`krr-result__type ${comp ? "krr-result__type--violet" : "krr-result__type--primary"}`}>
                          {comp ? <GitCompare size={11} /> : <BookOpen size={11} />}
                          {comp ? "Compare" : "Review"}
                        </span>
                        {a.created_at && (
                          <span className="mono krr-dash-analysis-date">
                            {new Date(a.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>
                      <div className="krr-dash-analysis-titles">
                        {(a.paper_titles ?? []).slice(0, 2).map((t, i) => (
                          <div key={i} className="krr-dash-analysis-title-row">
                            <span className="mono krr-dash-analysis-num">{i + 1}</span>
                            {t.length > 50 ? `${t.slice(0, 50)}…` : t}
                          </div>
                        ))}
                        {(a.paper_titles ?? []).length > 2 && (
                          <div className="krr-dash-analysis-more">
                            +{(a.paper_titles?.length ?? 0) - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
