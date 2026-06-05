"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check, Layers } from "lucide-react";
import { register } from "@/lib/api";
import ThemeToggle from "@/components/ThemeToggle";

const CHECKS = [
  "Upload and parse PDF papers automatically",
  "AI-generated structured summaries via Groq",
  "Comparative analysis across multiple papers",
  "Synthetic literature review generation",
];

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const res = await register(email, password);
      localStorage.setItem("krr_token", res.data.token);
      localStorage.setItem("krr_email", res.data.email);
      router.push("/");
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || "Registration failed");
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
            Start organizing<br />your research today.
          </h2>
          <ul className="krr-auth__checklist">
            {CHECKS.map((c) => (
              <li key={c} className="krr-auth__check-item">
                <span className="krr-auth__check-box"><Check size={13} strokeWidth={2.5} /></span>
                {c}
              </li>
            ))}
          </ul>
        </div>

        <div className="krr-auth__brand-footer">Free to use · Powered by Groq free tier</div>
      </div>

      {/* Form panel */}
      <div className="krr-auth__form-side">
        <div className="krr-auth__form-inner rise">
          <div className="krr-auth__mlogo">
            <div className="krr-brand__logo"><Layers size={14} strokeWidth={2} /></div>
            <span className="krr-auth__mlogo-name">KRR</span>
          </div>

          <div className="eyebrow krr-auth__form-eyebrow">Create account</div>
          <h1 className="krr-auth__form-title">Create your account</h1>
          <p className="krr-auth__form-sub">Set up your personal research workspace</p>

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
                placeholder="Min 6 characters"
                className="krr-field__input"
                required
              />
            </div>
            <div className="krr-field">
              <label className="krr-field__label" htmlFor="confirm">Confirm password</label>
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="krr-field__input"
                required
              />
            </div>

            {error && <div className="krr-auth__error"><span>{error}</span></div>}

            <button
              type="submit"
              disabled={loading || !email || !password || !confirm}
              className="krr-auth__submit"
            >
              {loading ? (
                <><span className="krr-spinner krr-spinner--sm krr-spinner--inv" />Creating account…</>
              ) : (
                <>Create account <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <p className="krr-auth__switch">
            Already have an account?{" "}
            <Link href="/login" className="krr-auth__switch-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
