import { Link } from "wouter";
import { Check, Sparkles, ArrowLeft } from "lucide-react";
import { useSubscription } from "@/lib/subscription";
import { apiFetch } from "@/lib/api";
import { useState } from "react";

const FREE_FEATURES = [
  "Unlimited bet logging",
  "Basic dashboard & ledger",
  "Bankroll tracking",
  "Win rate & ROI stats",
];

const PRO_FEATURES = [
  "Everything in Free",
  "AI Coach with behavioral insights",
  "Edge Score & full analytics engine",
  "Time / odds / stake segmentation",
  "Post-bet contextual warnings",
  "Monthly performance email reports",
  "Pattern alerts & profit opportunity",
  "Priority support",
];

export default function Pricing() {
  const { data: sub } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPro = sub?.tier === "pro" && !sub?.onTrial;

  async function handleSubscribe() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ url: string }>("/billing/checkout", { method: "POST" });
      window.location.href = res.url;
    } catch (e: any) {
      setError(
        e?.message?.includes("not configured")
          ? "Payments are coming online soon. Stripe is being set up — try again shortly."
          : e?.message || "Could not start checkout",
      );
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <Link href="/dashboard">
          <button className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-2 mb-6" data-testid="link-back">
            <ArrowLeft className="w-4 h-4" /> Back to dashboard
          </button>
        </Link>

        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-wider text-foreground mb-3">
            Choose your edge
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Start free. Upgrade when you want the AI behavioral coaching that helps you stop losing money to your patterns.
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-6 p-4 bg-[#FF4D4D]/10 border border-[#FF4D4D]/30 rounded-lg text-sm text-[#FF4D4D]">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Free tier */}
          <div className="bg-[#141920] border border-border rounded-2xl p-8" data-testid="card-tier-free">
            <div className="mb-6">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Free</div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">$0</span>
                <span className="text-muted-foreground">/forever</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-foreground">
                  <Check className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              disabled
              className="w-full py-3 bg-secondary/30 text-muted-foreground font-bold uppercase text-sm tracking-wider rounded-lg cursor-not-allowed"
            >
              {sub?.tier === "free" ? "Current plan" : "Always available"}
            </button>
          </div>

          {/* Pro tier */}
          <div className="bg-gradient-to-b from-primary/5 to-[#141920] border-2 border-primary/40 rounded-2xl p-8 relative" data-testid="card-tier-pro">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-[#0B0F14] text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
              Recommended
            </div>
            <div className="mb-6">
              <div className="text-xs font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> Pro
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">$14.99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">7-day free trial · cancel anytime</div>
            </div>
            <ul className="space-y-3 mb-8">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-foreground">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={handleSubscribe}
              disabled={loading || isPro}
              data-testid="button-subscribe-pro"
              className="w-full py-3 bg-primary text-[#0B0F14] font-bold uppercase text-sm tracking-wider rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isPro ? "Current plan" : loading ? "Loading…" : "Start 7-day trial"}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Secure payments powered by Stripe. Cancel anytime from settings.
        </p>
      </div>
    </div>
  );
}
