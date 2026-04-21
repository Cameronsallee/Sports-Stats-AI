import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error("ErrorBoundary caught", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#141920] border border-border rounded-2xl p-8 text-center">
            <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-7 h-7 text-[#FF4D4D]" />
            </div>
            <h2 className="text-xl font-bold uppercase tracking-wider text-foreground mb-3">
              Something broke
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              An unexpected error occurred. Try reloading the page. If the issue persists, contact support.
            </p>
            <button
              onClick={() => window.location.reload()}
              data-testid="button-reload"
              className="px-5 py-2.5 bg-primary text-[#0B0F14] font-bold uppercase text-sm tracking-wider rounded-lg"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
