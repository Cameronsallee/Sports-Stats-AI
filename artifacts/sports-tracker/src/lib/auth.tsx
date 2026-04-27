import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLocation } from "wouter";
import { useGetMe, setAuthTokenGetter } from "@workspace/api-client-react";

// Safe token getter (prevents SSR / Vercel issues later)
const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("betpulse_token");
};

// Initialize API client auth header
setAuthTokenGetter(getToken);

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(getToken());
  const [, setLocation] = useLocation();

  const { data: user, isLoading, isError } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    },
  });

  const isAuthenticated = !!user && !isError && !!token;

  const login = (newToken: string) => {
    if (typeof window === "undefined") return;

    localStorage.setItem("betpulse_token", newToken);
    setToken(newToken);
    setLocation("/dashboard");
  };

  const logout = () => {
    if (typeof window === "undefined") return;

    localStorage.removeItem("betpulse_token");
    setToken(null);
    setLocation("/login");
  };

  useEffect(() => {
    // If token exists but backend rejects it → force logout
    if (!isLoading && isError && token) {
      logout();
    }
  }, [isLoading, isError, token]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading: isLoading && !!token,
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}