import { useQuery } from "@tanstack/react-query";
import { getSubscription, type SubscriptionInfo } from "./api";
import { useAuth } from "./auth";
import { Link } from "wouter";
import { Lock, Sparkles } from "lucide-react";

export function useSubscription() {
  const { isAuthenticated } = useAuth();
  return useQuery<SubscriptionInfo>({
    queryKey: ["subscription"],
    queryFn: getSubscription,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function ProGate({
  children,
  feature,
}: {
  children: React.ReactNode;
  feature: string;
}) {
  const { data, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (data?.tier === "pro") {
    return <>{children}</>;
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="bg-[#141920] border border-border rounded-2xl p-10 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold uppercase tracking-wider text-foreground mb-3">
          {feature} is a Pro feature
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Unlock the full BetPulse intelligence engine — AI Coach, behavioral analytics,
          edge score, and monthly performance reports.
        </p>
        <Link href="/pricing">
          <button
            data-testid="button-upgrade"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-[#0B0F14] font-bold uppercase tracking-wider rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Upgrade to Pro
          </button>
        </Link>
      </div>
    </div>
  );
}

export function TrialBanner() {
  const { data } = useSubscription();
  if (!data || !data.onTrial || !data.trialEndsAt) return null;

  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(data.trialEndsAt).getTime() - Date.now()) / (24 * 60 * 60_000)),
  );

  return (
    <div className="bg-primary/10 border-b border-primary/30 px-4 py-2 text-center text-xs">
      <span className="text-primary font-bold uppercase tracking-wider">
        Pro Trial — {daysLeft} {daysLeft === 1 ? "day" : "days"} left
      </span>
      <Link href="/pricing">
        <button
          data-testid="button-trial-upgrade"
          className="ml-3 text-primary underline hover:opacity-80"
        >
          Upgrade now
        </button>
      </Link>
    </div>
  );
}
