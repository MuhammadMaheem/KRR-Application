"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, LogOut } from "lucide-react";
import { changePassword } from "@/lib/api";
import AppLayout from "@/components/AppLayout";
import ThemeToggle from "@/components/ThemeToggle";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/ToastProvider";

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("krr_token");
    if (!token) { router.push("/login"); return; }
    setEmail(localStorage.getItem("krr_email") || "");
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirm) { setError("New passwords do not match"); return; }
    if (newPassword.length < 6) { setError("New password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword(""); setNewPassword(""); setConfirm("");
      toast("Password changed successfully", "success");
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      const errMsg = msg || "Failed to change password";
      setError(errMsg);
      toast(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("krr_token");
    localStorage.removeItem("krr_email");
    router.push("/login");
  };

  return (
    <AppLayout>
      <ConfirmDialog
        open={logoutDialogOpen}
        title="Sign out?"
        message="You'll be signed out of your research workspace on this device."
        confirmLabel="Sign out"
        cancelLabel="Stay signed in"
        variant="default"
        onConfirm={() => { setLogoutDialogOpen(false); handleLogout(); }}
        onCancel={() => setLogoutDialogOpen(false)}
      />
      <div className="krr-page rise krr-settings-page">
        <div className="krr-page-head">
          <div>
            <div className="eyebrow krr-page-head__eyebrow">Account</div>
            <h1 className="krr-page-head__title">Settings</h1>
            <p className="krr-page-head__sub">Manage your account preferences</p>
          </div>
        </div>

        <div className="krr-settings-stack">
          {/* Account info */}
          <div className="krr-card krr-settings-card">
            <div className="krr-settings-card__title">Account</div>
            <div className="krr-account-row">
              <div className="krr-account-avatar">{email ? email[0].toUpperCase() : "?"}</div>
              <div>
                <div className="krr-account-email">{email || "—"}</div>
                <div className="krr-account-sub">Your account email</div>
                <div className="krr-active-badge">
                  <span className="krr-active-badge__dot" />
                  Active
                </div>
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="krr-card krr-settings-card">
            <div className="krr-settings-card__title">Appearance</div>
            <ThemeToggle />
          </div>

          {/* Change password */}
          <div className="krr-card krr-settings-card">
            <div className="krr-settings-card__head-row">
              <div className="krr-settings-card__icon-wrap">
                <Lock size={14} color="var(--text-muted)" />
              </div>
              <div>
                <div className="krr-settings-card__title--flush">Change Password</div>
                <div className="krr-account-sub">Update your account password</div>
              </div>
            </div>

            <hr className="krr-settings-divider" />

            <form onSubmit={handleSubmit} className="krr-settings-form">
              <div className="krr-field">
                <label className="krr-field__label" htmlFor="cur-pw">Current password</label>
                <input
                  id="cur-pw"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="krr-field__input"
                  required
                />
              </div>

              <div className="krr-password-grid">
                <div className="krr-field">
                  <label className="krr-field__label" htmlFor="new-pw">New password</label>
                  <input
                    id="new-pw"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="krr-field__input"
                    required
                  />
                </div>
                <div className="krr-field">
                  <label className="krr-field__label" htmlFor="conf-pw">Confirm new password</label>
                  <input
                    id="conf-pw"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter new password"
                    className="krr-field__input"
                    required
                  />
                </div>
              </div>

              {error && <div className="krr-auth__error"><span>{error}</span></div>}

              <div className="krr-form-actions">
                <button
                  type="submit"
                  disabled={loading || !currentPassword || !newPassword || !confirm}
                  className="krr-save-btn"
                >
                  {loading && <span className="krr-spinner krr-spinner--sm krr-spinner--inv" />}
                  {loading ? "Updating…" : "Update password"}
                </button>
              </div>
            </form>
          </div>

          {/* Session */}
          <div className="krr-card krr-settings-card">
            <div className="krr-settings-card__title">Session</div>
            <div className="krr-account-sub">Sign out from this device.</div>
            <div className="krr-settings-logout-wrap">
              <button
                type="button"
                onClick={() => setLogoutDialogOpen(true)}
                className="krr-logout-btn"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
