"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Zap, GitCompare, BookOpen, Layers } from "lucide-react";
import { login } from "@/lib/api";
import ThemeToggle from "@/components/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login(email, password);
      localStorage.setItem("krr_token", res.data.token);
      localStorage.setItem("krr_email", res.data.email);
      router.push("/");
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="krr-auth">
      {/* Floating theme toggle */}
      <div className="krr-auth__toggle">
        <ThemeToggle compact />
      </div>

      {/* Brand panel */}
      <div className="krr-auth__brand">
        <div className="krr-auth__brand-glow-top" />
        <div className="krr-auth__brand-glow-bot" />
        <div className="krr-auth__brand-grid" />

        <div className="krr-auth__brand-logo">
          <div className="krr-brand__logo"><Layers size={16} strokeWidth={2} /></div>
          <span className="krr-auth__brand-name">KRR</span>
        </div>

        <div className="krr-auth__brand-body">
          <div className="eyebrow krr-auth__brand-eyebrow">Knowledge Repository &amp; Review</div>
          <h2 className="krr-auth__brand-headline">
            Your personal<br />research intelligence.
          </h2>
          <div className="krr-auth__feature-grid">
            {[
              { icon: Zap,        label: "AI Summaries",  desc: "Structured, instant" },
              { icon: GitCompare, label: "Comparisons",   desc: "Side-by-side" },
              { icon: BookOpen,   label: "Lit Reviews",   desc: "Auto-synthesized" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="krr-auth__feature-card">
                <div className="krr-auth__feature-icon"><Icon size={20} strokeWidth={2} /></div>
                <div className="krr-auth__feature-name">{label}</div>
                <div className="krr-auth__feature-desc">{desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="krr-auth__brand-footer">Powered by Groq · Private by design</div>
      </div>

      {/* Form panel */}
      <div className="krr-auth__form-side">
        <div className="krr-auth__form-inner rise">
          <div className="krr-auth__mlogo">
            <div className="krr-brand__logo"><Layers size={14} strokeWidth={2} /></div>
            <span className="krr-auth__mlogo-name">KRR</span>
          </div>

          <div className="eyebrow krr-auth__form-eyebrow">Sign in</div>
          <h1 className="krr-auth__form-title">Welcome back</h1>
          <p className="krr-auth__form-sub">Sign in to your research workspace</p>

          <form onSubmit={handleSubmit} className="krr-auth__form">
            <div className="krr-field">
              <label className="krr-field__label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="krr-field__input"
                autoFocus
                required
              />
            </div>
            <div className="krr-field">
              <label className="krr-field__label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="krr-field__input"
                required
              />
            </div>

            {error && <div className="krr-auth__error"><span>{error}</span></div>}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="krr-auth__submit"
            >
              {loading ? (
                <><span className="krr-spinner krr-spinner--sm krr-spinner--inv" />Signing in…</>
              ) : (
                <>Sign in <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <p className="krr-auth__switch">
            No account?{" "}
            <Link href="/signup" className="krr-auth__switch-link">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
