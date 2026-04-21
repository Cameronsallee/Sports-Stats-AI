import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";
import { ErrorBoundary } from "@/components/error-boundary";
import NotFound from "@/pages/not-found";

import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Bets from "@/pages/bets";
import Insights from "@/pages/insights";
import Analytics from "@/pages/analytics";
import Pricing from "@/pages/pricing";
import Settings from "@/pages/settings";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import { Privacy, Terms } from "@/pages/legal";
import { ProGate } from "@/lib/subscription";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, gate, ...rest }: any) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  const content = gate ? (
    <ProGate feature={gate}><Component {...rest} /></ProGate>
  ) : (
    <Component {...rest} />
  );

  return <Layout>{content}</Layout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/"><Redirect to="/dashboard" /></Route>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/bets"><ProtectedRoute component={Bets} /></Route>
      <Route path="/analytics"><ProtectedRoute component={Analytics} gate="Analytics" /></Route>
      <Route path="/insights"><ProtectedRoute component={Insights} gate="AI Coach" /></Route>
      <Route path="/pricing"><ProtectedRoute component={Pricing} /></Route>
      <Route path="/settings"><ProtectedRoute component={Settings} /></Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AuthProvider>
              <Router />
            </AuthProvider>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
