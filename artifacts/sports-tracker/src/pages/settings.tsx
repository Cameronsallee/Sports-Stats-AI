import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Download, KeyRound, Trash2, CreditCard, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useSubscription } from "@/lib/subscription";
import { apiFetch } from "@/lib/api";

export default function Settings() {
  const { user, logout } = useAuth();
  const { data: sub, refetch } = useSubscription();
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "" });
  const [pwdMsg, setPwdMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [delPwd, setDelPwd] = useState("");
  const [delConfirm, setDelConfirm] = useState(false);
  const [delMsg, setDelMsg] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdMsg(null);
    try {
      await apiFetch("/account/change-password", {
        method: "POST",
        body: JSON.stringify(pwd),
      });
      setPwd({ currentPassword: "", newPassword: "" });
      setPwdMsg({ type: "ok", text: "Password updated successfully" });
    } catch (e: any) {
      setPwdMsg({ type: "err", text: e?.message || "Could not update password" });
    }
  }

  async function exportData() {
    try {
      const data = await apiFetch("/account/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `betpulse-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.message || "Export failed");
    }
  }

  async function deleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setDelMsg(null);
    if (!delConfirm) {
      setDelMsg("Please confirm deletion");
      return;
    }
    try {
      await apiFetch("/account/delete", {
        method: "POST",
        body: JSON.stringify({ password: delPwd }),
      });
      logout();
    } catch (e: any) {
      setDelMsg(e?.message || "Could not delete account");
    }
  }

  async function openBillingPortal() {
    setPortalLoading(true);
    try {
      const res = await apiFetch<{ url: string }>("/billing/portal", { method: "POST" });
      window.location.href = res.url;
    } catch (e: any) {
      alert(e?.message || "Could not open billing portal");
      setPortalLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/dashboard">
          <button className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-2 mb-6" data-testid="link-back">
            <ArrowLeft className="w-4 h-4" /> Back to dashboard
          </button>
        </Link>

        <h1 className="text-3xl font-bold uppercase tracking-wider text-foreground mb-1">Settings</h1>
        <p className="text-sm text-muted-foreground mb-8">{user?.email}</p>

        {/* Subscription */}
        <section className="bg-[#141920] border border-border rounded-2xl p-6 mb-6" data-testid="section-subscription">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Subscription</h2>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-2xl font-bold text-foreground capitalize">{sub?.tier || "—"}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {sub?.onTrial && sub.trialEndsAt
                  ? `Trial ends ${new Date(sub.trialEndsAt).toLocaleDateString()}`
                  : sub?.currentPeriodEnd
                    ? `Renews ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`
                    : sub?.tier === "free"
                      ? "No active subscription"
                      : ""}
              </div>
            </div>
            <div className="flex gap-2">
              {sub?.tier !== "pro" || sub?.onTrial ? (
                <Link href="/pricing">
                  <button className="px-4 py-2 bg-primary text-[#0B0F14] font-bold uppercase text-xs tracking-wider rounded-lg" data-testid="button-upgrade">
                    Upgrade
                  </button>
                </Link>
              ) : (
                <button
                  onClick={openBillingPortal}
                  disabled={portalLoading}
                  data-testid="button-billing-portal"
                  className="px-4 py-2 bg-secondary text-foreground font-bold uppercase text-xs tracking-wider rounded-lg flex items-center gap-2"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  {portalLoading ? "Loading…" : "Manage billing"}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Change password */}
        <section className="bg-[#141920] border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Password</h2>
          </div>
          <form onSubmit={changePassword} className="space-y-3">
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Current password"
              value={pwd.currentPassword}
              onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })}
              data-testid="input-current-password"
              className="w-full px-3 py-2.5 bg-[#0B0F14] border border-border rounded-lg text-sm text-foreground"
              required
            />
            <input
              type="password"
              autoComplete="new-password"
              placeholder="New password (min 8 characters)"
              value={pwd.newPassword}
              onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })}
              data-testid="input-new-password"
              className="w-full px-3 py-2.5 bg-[#0B0F14] border border-border rounded-lg text-sm text-foreground"
              required
              minLength={8}
            />
            {pwdMsg && (
              <div className={`text-xs ${pwdMsg.type === "ok" ? "text-primary" : "text-[#FF4D4D]"}`}>
                {pwdMsg.text}
              </div>
            )}
            <button
              type="submit"
              data-testid="button-change-password"
              className="px-4 py-2 bg-primary text-[#0B0F14] font-bold uppercase text-xs tracking-wider rounded-lg"
            >
              Update password
            </button>
          </form>
        </section>

        {/* Export */}
        <section className="bg-[#141920] border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Download className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Your data</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Download a complete copy of your account, bets, and bankroll history.
          </p>
          <button
            onClick={exportData}
            data-testid="button-export-data"
            className="px-4 py-2 bg-secondary text-foreground font-bold uppercase text-xs tracking-wider rounded-lg"
          >
            Export as JSON
          </button>
        </section>

        {/* Delete account */}
        <section className="bg-[#141920] border border-[#FF4D4D]/20 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <Trash2 className="w-4 h-4 text-[#FF4D4D]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#FF4D4D]">Danger zone</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Permanently delete your account and all associated data. This cannot be undone.
          </p>
          <form onSubmit={deleteAccount} className="space-y-3">
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Enter password to confirm"
              value={delPwd}
              onChange={(e) => setDelPwd(e.target.value)}
              data-testid="input-delete-password"
              className="w-full px-3 py-2.5 bg-[#0B0F14] border border-border rounded-lg text-sm text-foreground"
              required
            />
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={delConfirm}
                onChange={(e) => setDelConfirm(e.target.checked)}
                data-testid="checkbox-confirm-delete"
              />
              I understand this is permanent
            </label>
            {delMsg && <div className="text-xs text-[#FF4D4D]">{delMsg}</div>}
            <button
              type="submit"
              data-testid="button-delete-account"
              className="px-4 py-2 bg-[#FF4D4D]/10 border border-[#FF4D4D]/40 text-[#FF4D4D] font-bold uppercase text-xs tracking-wider rounded-lg hover:bg-[#FF4D4D]/20"
            >
              Delete account permanently
            </button>
          </form>
        </section>

        <div className="flex justify-center gap-6 mt-8 text-xs text-muted-foreground">
          <Link href="/privacy"><span className="hover:text-foreground cursor-pointer" data-testid="link-privacy">Privacy</span></Link>
          <Link href="/terms"><span className="hover:text-foreground cursor-pointer" data-testid="link-terms">Terms</span></Link>
        </div>
      </div>
    </div>
  );
}
