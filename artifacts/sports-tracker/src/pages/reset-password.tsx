import { useState } from "react";
import { Link, useLocation } from "wouter";
import { apiFetch } from "@/lib/api";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") || "";
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/account/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword: pwd }),
      });
      setLocation("/login");
    } catch (e: any) {
      setError(e?.message || "Could not reset password");
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-foreground mb-4">Invalid reset link.</p>
          <Link href="/forgot-password">
            <button className="text-primary text-sm font-bold uppercase tracking-wider">Request a new one</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold uppercase tracking-wider text-foreground text-center mb-8">
          New password
        </h1>
        <form onSubmit={submit} className="bg-[#141920] border border-border rounded-2xl p-6 space-y-4">
          <input
            type="password"
            autoComplete="new-password"
            placeholder="New password (min 8 characters)"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            data-testid="input-new-password"
            className="w-full px-3 py-3 bg-[#0B0F14] border border-border rounded-lg text-sm text-foreground"
            required
            minLength={8}
          />
          {error && <div className="text-xs text-[#FF4D4D]">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            data-testid="button-submit"
            className="w-full py-3 bg-primary text-[#0B0F14] font-bold uppercase text-sm tracking-wider rounded-lg disabled:opacity-50"
          >
            {loading ? "Updating…" : "Set new password"}
          </button>
        </form>
      </div>
    </div>
  );
}
