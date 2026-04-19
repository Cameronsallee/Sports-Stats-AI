import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLocation } from "wouter";
import { useGetMe, setAuthTokenGetter } from "@workspace/api-client-react";

// Initialize the API client with the token getter
setAuthTokenGetter(() => localStorage.getItem("betpulse_token"));

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("betpulse_token"));
  const [, setLocation] = useLocation();

  const { data: user, isLoading, isError } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    },
  });

  const isAuthenticated = !!user && !isError;

  const login = (newToken: string) => {
    localStorage.setItem("betpulse_token", newToken);
    setToken(newToken);
    setLocation("/dashboard");
  };

  const logout = () => {
    localStorage.removeItem("betpulse_token");
    setToken(null);
    setLocation("/login");
  };

  useEffect(() => {
    if (!isLoading && isError && token) {
      logout();
    }
  }, [isLoading, isError, token]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading: isLoading && !!token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
