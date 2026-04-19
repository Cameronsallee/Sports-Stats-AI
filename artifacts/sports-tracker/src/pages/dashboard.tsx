import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  useGetBankroll, 
  useUpdateBankroll, 
  useGetStats, 
  useListBets,
  getGetBankrollQueryKey,
  getGetStatsQueryKey
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Target, Activity, Wallet, Edit2, Check, AlertTriangle, ShieldCheck, Zap, Info, Plus, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

type BannerConfig = {
  icon: React.ReactNode;
  headline: string;
  sub: string;
  style: string;
  borderStyle: string;
};

function getPerformanceBanner(
  totalBets: number,
  profitLoss: number,
  roi: number,
  recentStreak: number,
  startingBankroll: number,
): BannerConfig | null {
  if (totalBets === 0) {
    return {
      icon: <Info className="w-5 h-5 shrink-0" />,
      headline: "Set your bankroll and log your first bet to activate full analytics.",
      sub: "Your behavioral profile builds with every bet you track.",
      style: "bg-white/[0.03] text-white/70 border-white/10",
      borderStyle: "border-l-white/20",
    };
  }

  if (recentStreak <= -4 || (roi < -20 && totalBets >= 5)) {
    return {
      icon: <AlertTriangle className="w-5 h-5 shrink-0" />,
      headline: "NEGATIVE DECISION CYCLE DETECTED",
      sub: "Your recent performance shows signs of emotional betting. Pause. Review. Do not chase.",
      style: "bg-[#FF4D4D]/[0.06] text-[#FF4D4D] border-[#FF4D4D]/25",
      borderStyle: "border-l-[#FF4D4D]",
    };
  }

  if (recentStreak <= -2 || (profitLoss < 0 && roi < -8)) {
    return {
      icon: <AlertTriangle className="w-5 h-5 shrink-0" />,
      headline: "PERFORMANCE UNDER PRESSURE",
      sub: "You are in a down period. Reduce stake size and avoid high-risk bets until your edge returns.",
      style: "bg-yellow-400/[0.05] text-yellow-400 border-yellow-400/20",
      borderStyle: "border-l-yellow-400",
    };
  }

  if (recentStreak >= 5) {
    return {
      icon: <Zap className="w-5 h-5 shrink-0" />,
      headline: "WIN STREAK ACTIVE — OVERCONFIDENCE RISK",
      sub: "Hot streaks create false confidence. Maintain your unit sizes. Do not deviate from your rules.",
      style: "bg-yellow-400/[0.05] text-yellow-400 border-yellow-400/20",
      borderStyle: "border-l-yellow-400",
    };
  }

  if (roi > 8 && profitLoss > 0 && recentStreak >= 0) {
    return {
      icon: <ShieldCheck className="w-5 h-5 shrink-0" />,
      headline: "DISCIPLINED PERFORMANCE",
      sub: "Your bankroll management is generating consistent returns. Stay the course.",
      style: "bg-[#2DFF88]/[0.05] text-[#2DFF88] border-[#2DFF88]/20",
      borderStyle: "border-l-[#2DFF88]",
    };
  }

  return null;
}

export default function Dashboard() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingBankroll, setEditingBankroll] = useState(false);
  const [bankrollInput, setBankrollInput] = useState("");

  const { data: bankroll, isLoading: bankrollLoading } = useGetBankroll({
    query: { enabled: isAuthenticated, queryKey: getGetBankrollQueryKey() }
  });

  const { data: stats, isLoading: statsLoading } = useGetStats({
    query: { enabled: isAuthenticated, queryKey: getGetStatsQueryKey() }
  });

  const { data: recentBets, isLoading: betsLoading } = useListBets(undefined, {
    query: { enabled: isAuthenticated }
  });

  const updateBankrollMutation = useUpdateBankroll();

  const handleUpdateBankroll = () => {
    const val = parseFloat(bankrollInput);
    if (isNaN(val) || val < 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }
    updateBankrollMutation.mutate({ data: { startingBankroll: val } }, {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetBankrollQueryKey(), data);
        setEditingBankroll(false);
        toast({ title: "Bankroll updated" });
      }
    });
  };

  if (bankrollLoading || statsLoading || betsLoading) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-16 w-full bg-card/50 rounded-[14px]" />
        <Skeleton className="h-8 w-48 bg-card/50" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-36 bg-card/50 rounded-[14px]" />)}
        </div>
        <Skeleton className="h-20 w-full bg-card/50 rounded-[14px]" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 lg:col-span-2 bg-card/50 rounded-[14px]" />
          <Skeleton className="h-80 bg-card/50 rounded-[14px]" />
        </div>
      </div>
    );
  }

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  const formatPercent = (val: number) => `${val.toFixed(1)}%`;

  const profitLoss = stats?.totalProfitLoss ?? 0;
  const roi = stats?.roi ?? 0;
  const recentStreak = stats?.recentStreak ?? 0;
  const totalBets = (stats?.wins ?? 0) + (stats?.losses ?? 0) + (stats?.pushes ?? 0) + (stats?.pending ?? 0);
  const isProfit = profitLoss >= 0;
  const isRoiPositive = roi >= 0;

  const banner = getPerformanceBanner(
    totalBets,
    profitLoss,
    roi,
    recentStreak,
    bankroll?.startingBankroll ?? 0,
  );

  return (
    <div className="p-6 md:p-8 space-y-7 max-w-7xl mx-auto">

      {/* Dynamic Performance Banner */}
      {banner && (
        <div className={`flex items-start gap-4 p-4 rounded-[12px] border border-l-4 ${banner.style} ${banner.borderStyle}`}>
          {banner.icon}
          <div>
            <p className="font-bold uppercase tracking-wider text-sm leading-snug">{banner.headline}</p>
            <p className="text-sm mt-1 opacity-80 leading-relaxed">{banner.sub}</p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-widest uppercase text-white">Performance Overview</h1>
        <p className="text-muted-foreground mt-1 text-xs font-semibold uppercase tracking-widest">Behavioral Betting Analytics</p>
      </div>

      {/* LAYER 1: Identity Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">

        {/* Bankroll */}
        <Card className="bg-card border-card-border shadow-lg rounded-[14px] overflow-hidden relative group col-span-1">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5 md:p-6">
            <div className="flex justify-between items-start mb-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Bankroll</p>
              <Wallet className="w-4 h-4 text-muted-foreground/40" />
            </div>
            {bankroll && bankroll.startingBankroll === 0 && bankroll.totalProfitLoss === 0 && !editingBankroll ? (
              <div>
                <p className="text-3xl font-bold text-white mb-2 font-mono">$0.00</p>
                <button 
                  onClick={() => { setBankrollInput("1000"); setEditingBankroll(true); }}
                  className="text-[10px] text-primary hover:text-primary/80 uppercase tracking-widest font-bold transition-colors"
                >
                  + Set Bankroll
                </button>
              </div>
            ) : (
              <p className="text-3xl md:text-4xl font-bold tracking-tight text-white font-mono">
                {formatCurrency(bankroll?.currentBankroll ?? 0)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Net P&L */}
        <Card className={`bg-card border-card-border shadow-lg rounded-[14px] overflow-hidden relative group col-span-1`}>
          <div className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent ${isProfit ? 'via-success/25' : 'via-loss/25'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
          <CardContent className="p-5 md:p-6">
            <div className="flex justify-between items-start mb-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Net P&L</p>
              {isProfit ? <TrendingUp className="w-4 h-4 text-success/50" /> : <TrendingDown className="w-4 h-4 text-loss/50" />}
            </div>
            <p className={`text-3xl md:text-4xl font-bold tracking-tight font-mono ${isProfit ? "text-success" : "text-loss"}`}>
              {isProfit ? "+" : ""}{formatCurrency(profitLoss)}
            </p>
          </CardContent>
        </Card>

        {/* Win Rate */}
        <Card className="bg-card border-card-border shadow-lg rounded-[14px] overflow-hidden relative group col-span-1">
          <CardContent className="p-5 md:p-6">
            <div className="flex justify-between items-start mb-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Win Rate</p>
              <Target className="w-4 h-4 text-muted-foreground/40" />
            </div>
            <p className="text-3xl md:text-4xl font-bold tracking-tight text-white font-mono">
              {formatPercent(stats?.winRate ?? 0)}
            </p>
            <p className="text-[10px] text-muted-foreground font-mono mt-2 uppercase tracking-wider">
              {stats?.wins}W / {stats?.losses}L / {stats?.pushes}P
            </p>
          </CardContent>
        </Card>

        {/* ROI */}
        <Card className="bg-card border-card-border shadow-lg rounded-[14px] overflow-hidden relative group col-span-1">
          <div className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent ${isRoiPositive ? 'via-success/25' : 'via-loss/25'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
          <CardContent className="p-5 md:p-6">
            <div className="flex justify-between items-start mb-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">ROI</p>
              <Activity className="w-4 h-4 text-muted-foreground/40" />
            </div>
            <p className={`text-3xl md:text-4xl font-bold tracking-tight font-mono ${isRoiPositive ? "text-success" : "text-loss"}`}>
              {isRoiPositive ? "+" : ""}{formatPercent(roi)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* LAYER 2: Behavioral Status Strip */}
      <div className="bg-card border border-card-border rounded-[14px] px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Streak</span>
            {recentStreak !== 0 ? (
              <Badge className={`px-2.5 py-0.5 rounded-[6px] text-[10px] font-bold uppercase tracking-wider ${recentStreak > 0 ? "bg-success/15 text-success border border-success/25" : "bg-loss/15 text-loss border border-loss/25"}`}>
                {Math.abs(recentStreak)} {recentStreak > 0 ? "Win" : "Loss"}{Math.abs(recentStreak) !== 1 ? "s" : ""}
              </Badge>
            ) : (
              <span className="text-[10px] font-mono text-white">—</span>
            )}
          </div>
          <div className="w-px h-3 bg-border hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pending</span>
            <span className="text-[10px] font-bold font-mono text-white">{stats?.pending ?? 0}</span>
          </div>
          <div className="w-px h-3 bg-border hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Bets</span>
            <span className="text-[10px] font-bold font-mono text-white">{totalBets}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {editingBankroll ? (
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                <Input 
                  type="number" 
                  value={bankrollInput} 
                  onChange={(e) => setBankrollInput(e.target.value)}
                  className="w-28 h-8 pl-6 bg-input border-white/5 focus-visible:ring-primary rounded-[8px] text-white font-mono text-sm"
                  autoFocus
                />
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-success hover:bg-success/10 rounded-[8px]" onClick={handleUpdateBankroll} disabled={updateBankrollMutation.isPending}>
                <Check className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-white rounded-[8px] gap-1.5 px-2.5" onClick={() => {
              setBankrollInput((bankroll?.startingBankroll ?? 0).toString());
              setEditingBankroll(true);
            }}>
              <Edit2 className="w-3 h-3" />
              <span className="text-[10px] uppercase tracking-widest font-bold">Edit Bankroll</span>
            </Button>
          )}
        </div>
      </div>

      {/* LAYER 3: Action Layers — Recent Bets + Sport Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Recent Activity</h3>
            <Link href="/bets" className="text-[10px] font-bold text-primary uppercase tracking-widest hover:text-primary/70 transition-colors flex items-center gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-card border border-card-border rounded-[14px] overflow-hidden shadow-lg">
            {(!recentBets || recentBets.length === 0) ? (
              <div className="p-10 text-center flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center mb-4">
                  <Plus className="w-6 h-6 text-primary/60" />
                </div>
                <p className="text-muted-foreground text-sm mb-4">No bets logged yet. Start tracking to see your behavioral analytics.</p>
                <Link href="/bets">
                  <Button className="bg-primary text-black hover:bg-primary/90 font-bold uppercase tracking-widest text-xs rounded-[10px] h-10 px-6">
                    Log First Bet
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {recentBets.slice(0, 5).map(bet => (
                  <div key={bet.id} className="px-5 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div className="space-y-1.5 min-w-0 mr-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm truncate">{bet.teams}</span>
                        <Badge variant="outline" className="text-[9px] px-1.5 h-4 border-white/10 text-muted-foreground shrink-0 uppercase tracking-wider">
                          {bet.sport}
                        </Badge>
                        <Badge variant="outline" className={`text-[9px] px-1.5 h-4 shrink-0 border-transparent uppercase tracking-wider font-bold ${
                          bet.result === 'Win' ? 'bg-success/10 text-success' : 
                          bet.result === 'Loss' ? 'bg-loss/10 text-loss' : 
                          bet.result === 'Pending' ? 'bg-blue-500/10 text-blue-400' : 'bg-muted/50 text-muted-foreground'
                        }`}>
                          {bet.result}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-muted-foreground flex gap-3 uppercase tracking-wider font-medium">
                        <span>{bet.betType}</span>
                        <span>{bet.odds > 0 ? `+${bet.odds}` : bet.odds}</span>
                        <span>{format(new Date(bet.createdAt), 'MMM d')}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono text-xs text-muted-foreground mb-0.5">{formatCurrency(bet.stake)}</div>
                      <div className="font-mono font-bold text-base">
                        {bet.result === 'Win' && <span className="text-success">+{formatCurrency(bet.profitLoss ?? 0)}</span>}
                        {bet.result === 'Loss' && <span className="text-loss">{formatCurrency(bet.profitLoss ?? 0)}</span>}
                        {bet.result === 'Push' && <span className="text-muted-foreground text-xs">PUSH</span>}
                        {bet.result === 'Pending' && <span className="text-blue-400 text-xs">LIVE</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Bet CTA */}
          <Link href="/bets">
            <div className="flex items-center justify-center gap-2 p-3 border border-dashed border-white/10 rounded-[10px] hover:border-primary/30 hover:bg-primary/[0.02] transition-all cursor-pointer group">
              <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors font-bold uppercase tracking-widest">Log a Bet</span>
            </div>
          </Link>
        </div>

        {/* Sport Breakdown */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">By Sport</h3>
          <div className="space-y-2.5">
            {stats?.bySport.map(sport => (
              <div key={sport.sport} className="bg-card border border-card-border p-4 rounded-[12px] hover:border-white/10 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-white text-sm uppercase tracking-wide">{sport.sport}</span>
                  <span className={`font-mono font-bold text-sm ${sport.profitLoss >= 0 ? 'text-success' : 'text-loss'}`}>
                    {sport.profitLoss >= 0 ? '+' : ''}{formatCurrency(sport.profitLoss)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  <span className="font-mono">{sport.wins}W / {sport.losses}L</span>
                  <span className="font-mono text-white/70">{formatPercent(sport.winRate)} WR</span>
                </div>
                {/* Mini progress bar */}
                <div className="mt-2.5 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${sport.winRate >= 50 ? 'bg-success' : 'bg-loss'}`}
                    style={{ width: `${Math.min(sport.winRate, 100)}%` }}
                  />
                </div>
              </div>
            ))}
            {(!stats?.bySport || stats.bySport.length === 0) && (
              <div className="bg-card border border-card-border p-10 rounded-[14px] text-center flex flex-col items-center justify-center">
                <Activity className="w-7 h-7 text-muted-foreground/25 mb-2" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">No data yet</span>
              </div>
            )}
          </div>

          {/* Coach Analysis CTA */}
          {totalBets >= 3 && (
            <Link href="/insights">
              <div className="mt-3 flex items-center justify-between p-4 bg-primary/[0.04] border border-primary/15 rounded-[12px] hover:bg-primary/[0.07] hover:border-primary/25 transition-all cursor-pointer group">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Coach Analysis Ready</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">View your behavioral report</p>
                </div>
                <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
