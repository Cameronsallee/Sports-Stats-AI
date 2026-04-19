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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Target, Activity, Wallet, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64 bg-card" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 bg-card" />)}
        </div>
      </div>
    );
  }

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  const formatPercent = (val: number) => `${(val).toFixed(1)}%`;

  const profitLoss = stats?.totalProfitLoss || 0;
  const isProfit = profitLoss >= 0;

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight uppercase">Terminal Overview</h1>
          <p className="text-muted-foreground mt-1">Live betting performance metrics.</p>
        </div>
        
        <div className="bg-card border border-border p-4 rounded-lg flex items-center gap-4">
          <div className="bg-primary/10 p-2 rounded-full">
            <Wallet className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Bankroll</p>
            {editingBankroll || (bankroll && bankroll.startingBankroll === 0 && bankroll.totalProfitLoss === 0) ? (
              <div className="flex items-center gap-2 mt-1">
                <Input 
                  type="number" 
                  value={bankrollInput} 
                  onChange={(e) => setBankrollInput(e.target.value)}
                  placeholder="Starting bankroll"
                  className="w-32 h-8"
                />
                <Button size="sm" onClick={handleUpdateBankroll} disabled={updateBankrollMutation.isPending}>Set</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1 group">
                <span className="text-2xl font-bold tracking-tight">{formatCurrency(bankroll?.currentBankroll || 0)}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                  setBankrollInput((bankroll?.startingBankroll || 0).toString());
                  setEditingBankroll(true);
                }}>
                  <span className="sr-only">Edit</span>
                  <Activity className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Net P&L</p>
                <p className={`text-3xl font-bold tracking-tight ${isProfit ? "text-success" : "text-destructive"}`}>
                  {isProfit ? "+" : ""}{formatCurrency(profitLoss)}
                </p>
              </div>
              <div className={`p-2 rounded-full ${isProfit ? "bg-success/10" : "bg-destructive/10"}`}>
                {isProfit ? <TrendingUp className="w-5 h-5 text-success" /> : <TrendingDown className="w-5 h-5 text-destructive" />}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">ROI</p>
                <p className={`text-3xl font-bold tracking-tight ${stats && stats.roi >= 0 ? "text-success" : "text-destructive"}`}>
                  {stats && stats.roi >= 0 ? "+" : ""}{formatPercent(stats?.roi || 0)}
                </p>
              </div>
              <div className="p-2 rounded-full bg-primary/10">
                <Activity className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Win Rate</p>
                <p className="text-3xl font-bold tracking-tight text-foreground">
                  {formatPercent(stats?.winRate || 0)}
                </p>
                <p className="text-xs text-muted-foreground">{stats?.wins}W - {stats?.losses}L - {stats?.pushes}P</p>
              </div>
              <div className="p-2 rounded-full bg-primary/10">
                <Target className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Streak</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold tracking-tight text-foreground">
                    {Math.abs(stats?.recentStreak || 0)}
                  </p>
                  {stats && stats.recentStreak !== 0 && (
                    <Badge variant={stats.recentStreak > 0 ? "default" : "destructive"} className={stats.recentStreak > 0 ? "bg-success text-success-foreground" : ""}>
                      {stats.recentStreak > 0 ? "WINS" : "LOSSES"}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{stats?.pending} Pending Bets</p>
              </div>
              <div className="p-2 rounded-full bg-primary/10">
                <AlertCircle className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold uppercase tracking-wider text-muted-foreground">Recent Activity</h3>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {(!recentBets || recentBets.length === 0) ? (
              <div className="p-8 text-center text-muted-foreground">
                No betting history found. Log a bet to populate terminal.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentBets.slice(0, 5).map(bet => (
                  <div key={bet.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{bet.teams}</span>
                        <Badge variant="outline" className="text-xs py-0 h-5">{bet.sport}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground flex gap-3">
                        <span>{bet.betType}</span>
                        <span>Odds: {bet.odds > 0 ? `+${bet.odds}` : bet.odds}</span>
                        <span>{format(new Date(bet.createdAt), 'MMM d')}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono">{formatCurrency(bet.stake)}</div>
                      {bet.result === 'Win' && <span className="text-sm font-bold text-success">+{formatCurrency(bet.profitLoss || 0)}</span>}
                      {bet.result === 'Loss' && <span className="text-sm font-bold text-destructive">{formatCurrency(bet.profitLoss || 0)}</span>}
                      {bet.result === 'Push' && <span className="text-sm font-bold text-muted-foreground">PUSH</span>}
                      {bet.result === 'Pending' && <span className="text-sm font-bold text-primary">PENDING</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold uppercase tracking-wider text-muted-foreground">Sport Breakdown</h3>
          <div className="space-y-3">
            {stats?.bySport.map(sport => (
              <div key={sport.sport} className="bg-card border border-border p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold">{sport.sport}</span>
                  <span className={`font-mono text-sm ${sport.profitLoss >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {sport.profitLoss >= 0 ? '+' : ''}{formatCurrency(sport.profitLoss)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{sport.wins}W - {sport.losses}L</span>
                  <span>{formatPercent(sport.winRate)} WR</span>
                </div>
              </div>
            ))}
            {(!stats?.bySport || stats.bySport.length === 0) && (
              <div className="bg-card border border-border p-8 rounded-lg text-center text-muted-foreground text-sm">
                Insufficient data
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
