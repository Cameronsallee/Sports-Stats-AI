import { useState } from "react";
import { Link } from "wouter";
import { apiFetch } from "@/lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/account/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold uppercase tracking-wider text-foreground text-center mb-2">
          Reset password
        </h1>
        <p className="text-xs text-muted-foreground text-center mb-8">
          Enter your email. If an account exists, we'll send a reset link.
        </p>

        {submitted ? (
          <div className="bg-[#141920] border border-border rounded-2xl p-6 text-center">
            <p className="text-sm text-foreground mb-4">
              If an account exists for that email, a reset link has been sent.
            </p>
            <Link href="/login">
              <button className="text-primary text-sm font-bold uppercase tracking-wider" data-testid="link-login">
                Back to login
              </button>
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="bg-[#141920] border border-border rounded-2xl p-6 space-y-4">
            <input
              type="email"
              autoComplete="email"
              placeholder="terminal@betpulse.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="input-email"
              className="w-full px-3 py-3 bg-[#0B0F14] border border-border rounded-lg text-sm text-foreground"
              required
            />
            <button
              type="submit"
              disabled={loading}
              data-testid="button-submit"
              className="w-full py-3 bg-primary text-[#0B0F14] font-bold uppercase text-sm tracking-wider rounded-lg disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
            <div className="text-center">
              <Link href="/login">
                <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">
                  Back to login
                </span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
