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
import { TrendingUp, TrendingDown, Target, Activity, Wallet, AlertCircle, Edit2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function Dashboard() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingBankroll, setEditingBankroll] = useState(false);
  const [bankrollInput, setBankrollInput] = useState("");

  const { data: bankroll, isLoading: bankrollLoading } = useGetBankroll({
    query: {
      enabled: isAuthenticated,
      queryKey: getGetBankrollQueryKey()
    }
  });

  const { data: stats, isLoading: statsLoading } = useGetStats({
    query: {
      enabled: isAuthenticated,
      queryKey: getGetStatsQueryKey()
    }
  });

  const { data: recentBets, isLoading: betsLoading } = useListBets(undefined, {
    query: {
      enabled: isAuthenticated
    }
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
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        <Skeleton className="h-10 w-48 bg-card/50" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-36 bg-card/50 rounded-[14px]" />)}
        </div>
        <Skeleton className="h-20 w-full bg-card/50 rounded-[14px]" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <Skeleton className="h-96 lg:col-span-2 bg-card/50 rounded-[14px]" />
          <Skeleton className="h-96 bg-card/50 rounded-[14px]" />
        </div>
      </div>
    );
  }

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  const formatPercent = (val: number) => `${(val).toFixed(1)}%`;

  const profitLoss = stats?.totalProfitLoss || 0;
  const isProfit = profitLoss >= 0;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-widest uppercase text-white">Terminal Overview</h1>
        <p className="text-muted-foreground mt-2 font-medium tracking-wide">LIVE BETTING PERFORMANCE METRICS</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Card 1: Bankroll */}
        <Card className="bg-card border-card-border shadow-lg rounded-[14px] overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Bankroll</p>
              <Wallet className="w-5 h-5 text-muted-foreground/50" />
            </div>
            {bankroll && bankroll.startingBankroll === 0 && bankroll.totalProfitLoss === 0 && !editingBankroll ? (
              <div>
                <p className="text-4xl font-bold text-white mb-2">$0.00</p>
                <button 
                  onClick={() => { setBankrollInput("1000"); setEditingBankroll(true); }}
                  className="text-xs text-primary hover:text-primary/80 uppercase tracking-wider font-bold transition-colors"
                >
                  + Set Starting Bankroll
                </button>
              </div>
            ) : (
              <p className="text-4xl font-bold tracking-tight text-white font-mono">
                {formatCurrency(bankroll?.currentBankroll || 0)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Net P&L */}
        <Card className="bg-card border-card-border shadow-lg rounded-[14px] overflow-hidden relative group">
          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent ${isProfit ? 'via-success/30' : 'via-loss/30'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Net P&L</p>
              {isProfit ? <TrendingUp className="w-5 h-5 text-success/50" /> : <TrendingDown className="w-5 h-5 text-loss/50" />}
            </div>
            <p className={`text-4xl font-bold tracking-tight font-mono ${isProfit ? "text-success" : "text-loss"}`}>
              {isProfit ? "+" : ""}{formatCurrency(profitLoss)}
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Win Rate */}
        <Card className="bg-card border-card-border shadow-lg rounded-[14px] overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Win Rate</p>
              <Target className="w-5 h-5 text-muted-foreground/50" />
            </div>
            <p className="text-4xl font-bold tracking-tight text-white font-mono mb-1">
              {formatPercent(stats?.winRate || 0)}
            </p>
            <p className="text-xs text-muted-foreground font-mono">{stats?.wins}W - {stats?.losses}L - {stats?.pushes}P</p>
          </CardContent>
        </Card>

        {/* Card 4: ROI */}
        <Card className="bg-card border-card-border shadow-lg rounded-[14px] overflow-hidden relative group">
          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent ${stats && stats.roi >= 0 ? 'via-success/30' : 'via-loss/30'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">ROI</p>
              <Activity className="w-5 h-5 text-muted-foreground/50" />
            </div>
            <p className={`text-4xl font-bold tracking-tight font-mono ${stats && stats.roi >= 0 ? "text-success" : "text-loss"}`}>
              {stats && stats.roi >= 0 ? "+" : ""}{formatPercent(stats?.roi || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Section 2: Performance Bar */}
      <div className="bg-card border border-card-border rounded-[14px] p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Current Streak:</span>
            {stats && stats.recentStreak !== 0 ? (
              <Badge className={`px-2 py-0.5 rounded-[6px] text-xs font-bold uppercase tracking-wider ${stats.recentStreak > 0 ? "bg-success text-black" : "bg-loss text-white"}`}>
                {Math.abs(stats.recentStreak)} {stats.recentStreak > 0 ? "Wins" : "Losses"}
              </Badge>
            ) : (
              <span className="text-sm font-mono text-white">0</span>
            )}
          </div>
          <div className="w-px h-4 bg-border hidden md:block" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Pending Bets:</span>
            <span className="text-sm font-bold font-mono text-white">{stats?.pending || 0}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Bankroll Edit:</span>
          {editingBankroll ? (
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input 
                  type="number" 
                  value={bankrollInput} 
                  onChange={(e) => setBankrollInput(e.target.value)}
                  className="w-28 h-8 pl-6 bg-input border-white/5 focus-visible:ring-primary rounded-[6px] text-white font-mono text-sm"
                  autoFocus
                />
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-success hover:bg-success/10 hover:text-success rounded-[6px]" onClick={handleUpdateBankroll} disabled={updateBankrollMutation.isPending}>
                <Check className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-white rounded-[6px] gap-2 px-2" onClick={() => {
              setBankrollInput((bankroll?.startingBankroll || 0).toString());
              setEditingBankroll(true);
            }}>
              <Edit2 className="w-3.5 h-3.5" />
              <span className="text-xs uppercase tracking-wider">Edit</span>
            </Button>
          )}
        </div>
      </div>

      {/* Section 3: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Recent Activity</h3>
            <Link href="/bets" className="text-xs font-bold text-primary uppercase tracking-wider hover:text-primary/80 transition-colors">View All</Link>
          </div>
          
          <div className="bg-card border border-card-border rounded-[14px] overflow-hidden shadow-lg">
            {(!recentBets || recentBets.length === 0) ? (
              <div className="p-12 text-center flex flex-col items-center">
                <Activity className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground mb-4">No betting history found.</p>
                <Link href="/bets">
                  <Button className="bg-primary text-black hover:bg-primary/90 font-bold uppercase tracking-wider rounded-[10px]">
                    + Log Position
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {recentBets.slice(0, 5).map(bet => (
                  <div key={bet.id} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-white text-base">{bet.teams}</span>
                        <Badge variant="outline" className="text-[10px] py-0 px-2 h-5 border-white/10 text-muted-foreground bg-black/20 uppercase tracking-wider">
                          {bet.sport}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] py-0 px-2 h-5 uppercase tracking-wider font-bold border-transparent ${
                          bet.result === 'Win' ? 'bg-success/10 text-success' : 
                          bet.result === 'Loss' ? 'bg-loss/10 text-loss' : 
                          bet.result === 'Pending' ? 'bg-blue-500/10 text-blue-400' : 'bg-muted text-muted-foreground'
                        }`}>
                          {bet.result?.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground flex gap-4 uppercase tracking-wider font-medium">
                        <span>{bet.betType}</span>
                        <span>{bet.odds > 0 ? `+${bet.odds}` : bet.odds}</span>
                        <span>{format(new Date(bet.createdAt), 'MMM dd')}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm text-muted-foreground mb-1">{formatCurrency(bet.stake)}</div>
                      <div className="font-mono font-bold text-lg">
                        {bet.result === 'Win' && <span className="text-success">+{formatCurrency(bet.profitLoss || 0)}</span>}
                        {bet.result === 'Loss' && <span className="text-loss">{formatCurrency(bet.profitLoss || 0)}</span>}
                        {bet.result === 'Push' && <span className="text-muted-foreground">PUSH</span>}
                        {bet.result === 'Pending' && <span className="text-blue-400">PENDING</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Sport Breakdown</h3>
          <div className="space-y-3">
            {stats?.bySport.map(sport => (
              <div key={sport.sport} className="bg-card border border-card-border p-5 rounded-[14px] shadow-md hover:border-white/10 transition-colors">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-white uppercase tracking-wide">{sport.sport}</span>
                  <span className={`font-mono font-bold ${sport.profitLoss >= 0 ? 'text-success' : 'text-loss'}`}>
                    {sport.profitLoss >= 0 ? '+' : ''}{formatCurrency(sport.profitLoss)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <span className="font-mono">{sport.wins}W - {sport.losses}L</span>
                  <span className="font-mono text-white">{formatPercent(sport.winRate)} WR</span>
                </div>
              </div>
            ))}
            {(!stats?.bySport || stats.bySport.length === 0) && (
              <div className="bg-card border border-card-border p-12 rounded-[14px] text-center flex flex-col items-center justify-center">
                <Activity className="w-8 h-8 text-muted-foreground/30 mb-3" />
                <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Insufficient Data</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
