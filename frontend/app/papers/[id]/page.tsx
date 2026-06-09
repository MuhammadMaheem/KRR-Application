"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, RotateCcw, X, Quote, Send, Bot, User as UserIcon, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPaper, resummarizePaper, citePaper, Paper } from "@/lib/api";
import AppLayout from "@/components/AppLayout";
import StatusBadge from "@/components/StatusBadge";
import { useToast } from "@/components/ToastProvider";

type Tab = "summary" | "chat" | "text";

interface Message {
  role: "user" | "assistant";
  text: string;
}

export default function PaperDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [loading, setLoading] = useState(true);
  const [resummmarizing, setReSummarizing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("summary");

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Citation state
  const [citeFmt, setCiteFmt] = useState<"bibtex" | "apa" | "mla" | null>(null);
  const [citeText, setCiteText] = useState("");
  const [citeCopied, setCiteCopied] = useState(false);

  const fetchPaper = useCallback(async () => {
    try {
      const res = await getPaper(id);
      setPaper(res.data);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    const token = localStorage.getItem("krr_token");
    if (!token) { router.push("/login"); return; }
    fetchPaper();
  }, [id, fetchPaper, router]);

  // SSE: connect when paper is pending/processing
  useEffect(() => {
    if (!["pending", "processing"].includes(paper?.status ?? "")) return;

    const interval = setInterval(async () => {
      try {
        const res = await getPaper(id);
        setPaper(res.data);
        if (["processed", "error"].includes(res.data.status)) {
          clearInterval(interval);
        }
      } catch {
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [paper?.status, id]);


  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleResummarize = async () => {
    if (!paper) return;
    setReSummarizing(true);
    try {
      await resummarizePaper(paper.id);
      setPaper((p) => p ? { ...p, status: "processing" } : p);
      toast("Re-summarizing paper — this may take a moment", "info");
    } catch {
      toast("Failed to trigger re-summarization", "error");
    } finally {
      setReSummarizing(false);
    }
  };

  const handleChat = async () => {
    const q = question.trim();
    if (!q || !paper) return;

    setMessages((m) => [...m, { role: "user", text: q }]);
    setQuestion("");
    setChatLoading(true);

    const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const token = localStorage.getItem("krr_token") || "";

    try {
      const resp = await fetch(`${BASE}/api/papers/${paper.id}/chat/stream`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: q }),
      });

      if (!resp.ok || !resp.body) {
        throw new Error("Stream request failed");
      }

      // Add empty assistant message — we'll append chunks to it
      setMessages((m) => [...m, { role: "assistant", text: "" }]);
      setChatLoading(false);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") break;
          try {
            const parsed = JSON.parse(raw);
            if (parsed.chunk) {
              setMessages((m) => {
                const last = m[m.length - 1];
                return [...m.slice(0, -1), { ...last, text: last.text + parsed.chunk }];
              });
            }
          } catch { /* ignore malformed */ }
        }
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Failed to get answer. Please try again." }]);
      setChatLoading(false);
    }
  };

  const handleCite = async (fmt: "bibtex" | "apa" | "mla") => {
    if (!paper) return;
    if (citeFmt === fmt) { setCiteFmt(null); setCiteText(""); return; }
    try {
      const res = await citePaper(paper.id, fmt);
      setCiteFmt(fmt);
      setCiteText(res.data as unknown as string);
      setCiteCopied(false);
    } catch {
      toast("Failed to generate citation", "error");
    }
  };

  const handleCopyCite = () => {
    navigator.clipboard.writeText(citeText);
    setCiteCopied(true);
    setTimeout(() => setCiteCopied(false), 2000);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="krr-page krr-page-loading">
          <span className="krr-spinner krr-spinner--lg" />
        </div>
      </AppLayout>
    );
  }

  if (!paper) return null;

  const isProcessed = paper.status === "processed";

  return (
    <AppLayout>
      <div className="krr-page rise">
        {/* Back */}
        <button type="button" onClick={() => router.back()} className="krr-back-link">
          <ChevronLeft size={14} strokeWidth={2.5} />
          Back to Papers
        </button>

        {/* Header card */}
        <div className="krr-card krr-detail-header">
          <div className="krr-detail-header-row">
            <div className="krr-detail-header-text">
              <h1 className="krr-detail-title">{paper.title}</h1>
              {paper.authors?.length > 0 && (
                <div className="krr-detail-authors">{paper.authors.join(" · ")}</div>
              )}
              <div className="krr-detail-meta">
                <StatusBadge status={paper.status} />
                {paper.page_count && (
                  <span className="krr-detail-pill">{paper.page_count} pages</span>
                )}
                {paper.file_size && (
                  <span className="krr-detail-pill">{(paper.file_size / 1024).toFixed(0)} KB</span>
                )}
                {paper.file_name && (
                  <span className="krr-detail-pill krr-detail-pill--fname">{paper.file_name}</span>
                )}
              </div>
            </div>
            {isProcessed && (
              <div className="krr-detail-actions">
                <button
                  type="button"
                  onClick={handleResummarize}
                  disabled={resummmarizing}
                  className="krr-resummarize"
                >
                  <RotateCcw size={12} className={resummmarizing ? "krr-spin-slow" : ""} />
                  {resummmarizing ? "Regenerating…" : "Re-summarize"}
                </button>
              </div>
            )}
          </div>

          {/* Citation row */}
          {isProcessed && (
            <div className="krr-cite-row">
              <span className="krr-cite-label">
                <Quote size={12} /> Cite as
              </span>
              {(["bibtex", "apa", "mla"] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => handleCite(fmt)}
                  className={`krr-cite-btn${citeFmt === fmt ? " krr-cite-btn--active" : ""}`}
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Citation output */}
        {citeFmt && citeText && (
          <div className="krr-card krr-cite-output">
            <div className="krr-cite-output-head">
              <span className="krr-cite-output-label">{citeFmt.toUpperCase()}</span>
              <button type="button" onClick={handleCopyCite} className="krr-cite-copy">
                {citeCopied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="krr-cite-pre">{citeText}</pre>
          </div>
        )}

        {/* Abstract */}
        {paper.abstract && (
          <div className="krr-abstract">
            <div className="krr-abstract__label">Abstract</div>
            <p className="krr-abstract__text">{paper.abstract}</p>
          </div>
        )}

        {/* Error */}
        {paper.error_message && (
          <div className="krr-error-card">
            <div className="krr-error-card__icon">
              <X size={11} color="white" strokeWidth={3} />
            </div>
            <div>
              <div className="krr-error-card__title">Processing error</div>
              <div className="krr-error-card__msg">{paper.error_message}</div>
            </div>
          </div>
        )}

        {/* Processing */}
        {["pending", "processing"].includes(paper.status) && (
          <div className="krr-processing-card">
            <span className="krr-spinner krr-spinner--sm krr-spinner--proc" />
            <div>
              <div className="krr-processing-card__title">Processing paper</div>
              <div className="krr-processing-card__sub">Extracting text and generating AI summary…</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        {isProcessed && (
          <>
            <div className="krr-tabs">
              {(["summary", "chat", "text"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`krr-tab${activeTab === tab ? " krr-tab--active" : ""}`}
                >
                  {tab === "summary" ? "AI Summary" : tab === "chat" ? "Chat" : "Full Text"}
                </button>
              ))}
            </div>

            {/* Summary */}
            {activeTab === "summary" && paper.summary && (
              <div className="krr-card krr-content-body">
                <div className="prose">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{paper.summary}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Chat */}
            {activeTab === "chat" && (
              <div className="krr-card krr-chat-wrap">
                {/* Chat header */}
                <div className="krr-chat-header">
                  <span className="krr-chat-header-title">Chat with paper</span>
                  {messages.length > 0 && (
                    <button
                      type="button"
                      className="krr-chat-clear"
                      onClick={() => setMessages([])}
                      title="Clear chat"
                    >
                      <Trash2 size={13} />
                      Clear
                    </button>
                  )}
                </div>
                <div className="krr-chat-messages">
                  {messages.length === 0 && (
                    <div className="krr-chat-empty">
                      <Bot size={28} color="var(--text-faint)" />
                      <p>Ask anything about this paper — methodology, findings, limitations…</p>
                    </div>
                  )}
                  {messages.map((msg, i) => (
                    <div key={i} className={`krr-chat-msg krr-chat-msg--${msg.role}`}>
                      <div className="krr-chat-avatar">
                        {msg.role === "user"
                          ? <UserIcon size={13} />
                          : <Bot size={13} />}
                      </div>
                      <div className="krr-chat-bubble">
                        {msg.role === "assistant"
                          ? <div className="prose"><ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown></div>
                          : msg.text}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="krr-chat-msg krr-chat-msg--assistant">
                      <div className="krr-chat-avatar"><Bot size={13} /></div>
                      <div className="krr-chat-bubble krr-chat-bubble--loading">
                        <div className="krr-dot-pulse">
                          <span /><span /><span />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>
                <div className="krr-chat-input-row">
                  <input
                    type="text"
                    className="krr-chat-input"
                    placeholder="Ask a question about this paper…"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleChat()}
                    disabled={chatLoading}
                  />
                  <button
                    type="button"
                    onClick={handleChat}
                    disabled={chatLoading || !question.trim()}
                    className="krr-chat-send"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Full Text — raw extracted content */}
            {activeTab === "text" && (
              <div className="krr-rawtext-wrap">
                <div className="krr-rawtext-header">
                  <span className="krr-rawtext-label">Raw Extracted Text</span>
                  {paper.content && (
                    <span className="krr-rawtext-chars">
                      {paper.content.length.toLocaleString()} chars
                    </span>
                  )}
                </div>
                <div className="krr-rawtext-body">
                  {paper.content
                    ? paper.content.split("\n").map((line, i) => {
                        const isSectionHeader = /^\d+(\.\d+)?\s+[A-Z]/.test(line.trim()) && line.trim().length < 60;
                        return line.trim() ? (
                          <p key={i} className={isSectionHeader ? "krr-rawtext-section" : "krr-rawtext-line"}>
                            {line}
                          </p>
                        ) : <div key={i} className="krr-rawtext-gap" />;
                      })
                    : <p className="krr-rawtext-empty">No extracted text available.</p>
                  }
                </div>
              </div>
            )}

          </>
        )}
      </div>
    </AppLayout>
  );
}
