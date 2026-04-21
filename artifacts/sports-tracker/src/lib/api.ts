const API_BASE = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api`;

function getToken() {
  return localStorage.getItem("betpulse_token");
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

export interface SubscriptionInfo {
  tier: "free" | "pro";
  status: string;
  onTrial: boolean;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  emailVerified: boolean;
}

export function getSubscription() {
  return apiFetch<SubscriptionInfo>("/account/subscription");
}
