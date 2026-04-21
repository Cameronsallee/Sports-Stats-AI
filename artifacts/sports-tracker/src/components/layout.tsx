import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { BarChart3, LayoutDashboard, ListPlus, LogOut, BrainCircuit, TrendingUp, Settings } from "lucide-react";
import { TrialBanner } from "@/lib/subscription";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout } = useAuth();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Bets", href: "/bets", icon: ListPlus },
    { name: "Analytics", href: "/analytics", icon: TrendingUp },
    { name: "Coach", href: "/insights", icon: BrainCircuit },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 flex-col bg-[#141920] border-r border-border shrink-0">
        <div className="p-6 pb-8 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xl font-bold tracking-wider text-foreground uppercase">BETPULSE</span>
        </div>
        <nav className="flex-1 px-3 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  data-testid={`nav-${item.name.toLowerCase()}`}
                  className={`group flex items-center gap-3 px-3 py-3 rounded-lg transition-all cursor-pointer relative ${
                    isActive
                      ? "text-primary bg-primary/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-md shadow-[0_0_8px_rgba(45,255,136,0.6)]" />
                  )}
                  <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground transition-colors"}`} />
                  <span className={`font-medium ${isActive ? "text-primary" : ""}`}>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 mb-2">
          <button
            onClick={logout}
            data-testid="button-logout"
            className="flex items-center gap-3 px-3 py-3 w-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0 relative">
        <TrialBanner />
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#141920] border-t border-border flex items-center justify-around px-1 py-2 z-50 shadow-2xl">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                data-testid={`mobile-nav-${item.name.toLowerCase()}`}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[9px] font-bold uppercase tracking-wider">{item.name}</span>
              </div>
            </Link>
          );
        })}
        <button
          onClick={logout}
          data-testid="mobile-button-logout"
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-muted-foreground"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Out</span>
        </button>
      </nav>
    </div>
  );
}
