import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useListBets, 
  useCreateBet, 
  useUpdateBet, 
  useDeleteBet,
  useGetStats,
  getListBetsQueryKey,
  getGetStatsQueryKey,
  getGetBankrollQueryKey
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Trash2, Edit2, Plus, FilterX, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, TrendingUp, Clock, Layers, X
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { getPostBetContext, type PostBetContext } from "@/lib/analytics";

const SPORTS = ["Football", "Basketball", "Baseball", "Soccer", "Hockey", "Tennis", "MMA", "Boxing", "Golf", "Other"];
const BET_TYPES = ["Moneyline", "Spread", "Over/Under", "Parlay", "Prop", "Futures", "Other"];
const RESULTS = ["Pending", "Win", "Loss", "Push"];

const betSchema = z.object({
  sport: z.string().min(1, "Required"),
  betType: z.string().min(1, "Required"),
  teams: z.string().min(1, "Required"),
  odds: z.coerce.number().int().refine(val => val !== 0, "Odds cannot be 0"),
  stake: z.coerce.number().positive("Stake must be positive"),
  result: z.string().optional(),
  notes: z.string().optional(),
});

/* ─── Post-bet insight panel ───────────────────────────────────── */
function PostBetInsightPanel({
  context,
  teams,
  onClose,
}: {
  context: PostBetContext;
  teams: string;
  onClose: () => void;
}) {
  const hasWarnings = context.warningMessages.length > 0;
  const hasPositives = context.positiveMessages.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-card border border-card-border rounded-[18px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-white/[0.06] flex items-start justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-1">
              Bet Logged
            </p>
            <h3 className="font-bold text-white text-sm leading-tight">{teams}</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">
              Context Analysis · {context.timeBucket}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-white transition-colors mt-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Context stats */}
          <div className="grid grid-cols-2 gap-3">
            {context.timeROI !== null && (
              <div className="bg-black/20 border border-white/[0.04] rounded-[10px] p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">
                    This Time Window
                  </p>
                </div>
                <p className={`text-lg font-black font-mono ${context.timeROI > 0 ? "text-success" : "text-loss"}`}>
                  {context.timeROI > 0 ? "+" : ""}{context.timeROI.toFixed(1)}%
                </p>
                <p className="text-[9px] text-muted-foreground">ROI · {context.timeWR?.toFixed(0)}% WR</p>
              </div>
            )}
            {context.betTypeROI !== null && (
              <div className="bg-black/20 border border-white/[0.04] rounded-[10px] p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Layers className="w-3 h-3 text-muted-foreground" />
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">
                    This Bet Type
                  </p>
                </div>
                <p className={`text-lg font-black font-mono ${context.betTypeROI > 0 ? "text-success" : "text-loss"}`}>
                  {context.betTypeROI > 0 ? "+" : ""}{context.betTypeROI.toFixed(1)}%
                </p>
                <p className="text-[9px] text-muted-foreground">ROI · {context.betTypeWR?.toFixed(0)}% WR</p>
              </div>
            )}
          </div>

          {/* Warnings */}
          {hasWarnings && (
            <div className="space-y-2">
              {context.warningMessages.map((msg, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-3 bg-loss/[0.06] border border-loss/20 rounded-[10px]"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-loss shrink-0 mt-0.5" />
                  <p className="text-xs text-white/80 leading-relaxed">{msg}</p>
                </div>
              ))}
            </div>
          )}

          {/* Positives */}
          {hasPositives && (
            <div className="space-y-2">
              {context.positiveMessages.map((msg, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-3 bg-success/[0.06] border border-success/20 rounded-[10px]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                  <p className="text-xs text-white/80 leading-relaxed">{msg}</p>
                </div>
              ))}
            </div>
          )}

          {/* No context yet */}
          {context.timeROI === null && context.betTypeROI === null && !hasWarnings && !hasPositives && (
            <div className="text-center py-2">
              <TrendingUp className="w-7 h-7 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                Log more bets to unlock pattern-based context for your plays.
              </p>
            </div>
          )}

          <Button
            onClick={onClose}
            className="w-full h-10 bg-primary text-black font-bold uppercase tracking-widest text-xs rounded-[10px] hover:bg-primary/90 mt-2"
          >
            Got It
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ───────────────────────────────────────────── */
export default function Bets() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filterSport, setFilterSport] = useState<string>("all");
  const [filterResult, setFilterResult] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBet, setEditingBet] = useState<any>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [postBetCtx, setPostBetCtx] = useState<{ context: PostBetContext; teams: string } | null>(null);

  const queryParams: any = {};
  if (filterSport !== "all") queryParams.sport = filterSport;
  if (filterResult !== "all") queryParams.result = filterResult;

  const { data: bets, isLoading } = useListBets(queryParams, {
    query: {
      enabled: isAuthenticated,
      queryKey: getListBetsQueryKey(queryParams)
    }
  });

  // All bets (no filter) for analytics context
  const { data: allBets } = useListBets(undefined, {
    query: { enabled: isAuthenticated }
  });

  const { data: stats } = useGetStats({
    query: { enabled: isAuthenticated, queryKey: getGetStatsQueryKey() }
  });

  const createBet = useCreateBet();
  const updateBet = useUpdateBet();
  const deleteBet = useDeleteBet();

  const form = useForm<z.infer<typeof betSchema>>({
    resolver: zodResolver(betSchema),
    defaultValues: {
      sport: "Football",
      betType: "Moneyline",
      teams: "",
      odds: -110,
      stake: 100,
      result: "Pending",
      notes: "",
    },
  });

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/bets"] });
    queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetBankrollQueryKey() });
  };

  const onSubmit = (values: z.infer<typeof betSchema>) => {
    if (editingBet) {
      updateBet.mutate(
        { id: editingBet.id, data: values },
        {
          onSuccess: () => {
            toast({ title: "Bet updated" });
            setIsCreateOpen(false);
            setEditingBet(null);
            form.reset();
            invalidateQueries();
          }
        }
      );
    } else {
      createBet.mutate(
        { data: values },
        {
          onSuccess: () => {
            setIsCreateOpen(false);
            form.reset();
            invalidateQueries();

            // Compute post-bet context from historical data
            const historical = allBets ?? [];
            const recentStreak = stats?.recentStreak ?? 0;
            const context = getPostBetContext(
              historical,
              {
                betType: values.betType,
                odds: values.odds,
                createdAt: new Date().toISOString(),
              },
              recentStreak,
            );
            setPostBetCtx({ context, teams: values.teams });
          }
        }
      );
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this bet? This will recalculate your stats.")) {
      deleteBet.mutate(
        { id },
        {
          onSuccess: () => {
            toast({ title: "Bet deleted" });
            invalidateQueries();
          }
        }
      );
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">

      {/* Post-bet insight overlay */}
      {postBetCtx && (
        <PostBetInsightPanel
          context={postBetCtx.context}
          teams={postBetCtx.teams}
          onClose={() => setPostBetCtx(null)}
        />
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-widest uppercase text-white">Bet Ledger</h1>
          <p className="text-muted-foreground mt-2 font-medium tracking-wide uppercase text-sm">COMPLETE BETTING HISTORY</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <Select value={filterSport} onValueChange={setFilterSport}>
            <SelectTrigger className="w-[140px] bg-input border-white/5 text-white h-10 rounded-[10px] font-medium">
              <SelectValue placeholder="Sport" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-white/10 text-white rounded-[10px]">
              <SelectItem value="all">All Sports</SelectItem>
              {SPORTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          
          <Select value={filterResult} onValueChange={setFilterResult}>
            <SelectTrigger className="w-[140px] bg-input border-white/5 text-white h-10 rounded-[10px] font-medium">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-white/10 text-white rounded-[10px]">
              <SelectItem value="all">All Results</SelectItem>
              {RESULTS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>

          {(filterSport !== "all" || filterResult !== "all") && (
            <Button variant="ghost" size="icon" onClick={() => { setFilterSport("all"); setFilterResult("all"); }} className="h-10 w-10 text-muted-foreground hover:text-white rounded-[10px]">
              <FilterX className="h-4 w-4" />
            </Button>
          )}

          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            if (!open) {
              setEditingBet(null);
              form.reset({
                sport: "Football", betType: "Moneyline", teams: "", odds: -110, stake: 100, result: "Pending", notes: ""
              });
              setShowNotes(false);
            }
            setIsCreateOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button
                data-testid="button-log-bet"
                className="ml-auto bg-primary text-black hover:bg-primary/90 font-bold uppercase tracking-wider gap-2 h-10 rounded-[10px] px-6 shadow-[0_0_15px_rgba(45,255,136,0.15)]"
              >
                <Plus className="w-4 h-4" /> Log Bet
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto bg-card border-white/10 rounded-[14px] p-0 shadow-2xl">
              <DialogHeader className="p-6 pb-4 border-b border-white/5">
                <DialogTitle className="uppercase tracking-widest font-bold text-white text-xl">
                  {editingBet ? "Edit Position" : "Log New Position"}
                </DialogTitle>
              </DialogHeader>
              <div className="p-6 pt-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Group 1 */}
                    <div className="bg-black/20 p-4 rounded-[10px] border border-white/5 space-y-4">
                      <FormField control={form.control} name="sport" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Sport</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-input border-white/5 h-12 rounded-[10px] text-white">
                                <SelectValue placeholder="Select sport" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-popover border-white/10 text-white rounded-[10px]">
                              {SPORTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="betType" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Bet Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-input border-white/5 h-12 rounded-[10px] text-white">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-popover border-white/10 text-white rounded-[10px]">
                              {BET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    
                    {/* Group 2 */}
                    <div className="bg-black/20 p-4 rounded-[10px] border border-white/5 space-y-4">
                      <FormField control={form.control} name="teams" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Selection / Matchup</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Chiefs -3.5" {...field} className="bg-input border-white/5 h-12 rounded-[10px] text-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="odds" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Odds (American)</FormLabel>
                          <div className="relative">
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xs uppercase tracking-wider">+/-</span>
                            <FormControl>
                              <Input type="number" {...field} className="bg-input border-white/5 h-12 rounded-[10px] text-white font-mono text-lg" />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    {/* Group 3 */}
                    <div className="bg-black/20 p-4 rounded-[10px] border border-white/5 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="stake" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Stake ($)</FormLabel>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} className="bg-input border-white/5 h-12 rounded-[10px] text-white font-mono text-lg pl-8" />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="result" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-input border-white/5 h-12 rounded-[10px] text-white">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-popover border-white/10 text-white rounded-[10px]">
                                {RESULTS.map(r => <SelectItem key={r} value={r} className="uppercase tracking-wider text-xs font-bold">{r}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    </div>

                    {/* Group 4: Notes */}
                    <div className="space-y-3">
                      <button 
                        type="button" 
                        onClick={() => setShowNotes(!showNotes)}
                        className="flex items-center justify-between w-full p-4 bg-black/10 hover:bg-black/20 border border-white/5 rounded-[10px] transition-colors"
                      >
                        <span className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Thesis / Notes (Optional)</span>
                        {showNotes ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </button>
                      {showNotes && (
                        <FormField control={form.control} name="notes" render={({ field }) => (
                          <FormItem className="animate-in fade-in slide-in-from-top-2">
                            <FormControl>
                              <Textarea 
                                placeholder="Why are you taking this position?" 
                                {...field} 
                                className="bg-input border-white/5 min-h-[100px] rounded-[10px] text-white resize-none" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-14 bg-primary text-[#0B0F14] hover:bg-primary/90 font-bold uppercase tracking-widest rounded-[10px] shadow-[0_0_20px_rgba(45,255,136,0.2)] text-base mt-8" 
                      disabled={createBet.isPending || updateBet.isPending}
                    >
                      {createBet.isPending || updateBet.isPending ? "PROCESSING..." : editingBet ? "UPDATE POSITION" : "CONFIRM POSITION"}
                    </Button>
                  </form>
                </Form>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-[14px] overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-16 w-full bg-white/5 rounded-[10px]" />)}
          </div>
        ) : !bets || bets.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-black/20 flex items-center justify-center mb-4">
              <FilterX className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="text-lg font-medium uppercase tracking-wider text-white">No positions found</p>
            <p className="text-sm mt-2">Adjust your filters or log a new position.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-[10px] text-muted-foreground uppercase tracking-widest bg-black/40 border-b border-white/10 sticky top-0 z-10 backdrop-blur-sm font-bold">
                <tr>
                  <th className="px-6 py-5 whitespace-nowrap">Date</th>
                  <th className="px-6 py-5">Selection</th>
                  <th className="px-6 py-5">Type / Sport</th>
                  <th className="px-6 py-5 text-right">Odds</th>
                  <th className="px-6 py-5 text-right">Stake</th>
                  <th className="px-6 py-5 text-center">Status</th>
                  <th className="px-6 py-5 text-right">P&L</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bets.map(bet => (
                  <tr key={bet.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground font-medium text-xs uppercase tracking-wider">
                      {format(new Date(bet.createdAt), 'MMM dd')}
                    </td>
                    <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                      {bet.teams}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs uppercase tracking-wider font-medium whitespace-nowrap">
                      <span className="text-white/70">{bet.betType}</span> <span className="text-white/20 mx-2">/</span> {bet.sport}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-white">
                      {bet.odds > 0 ? `+${bet.odds}` : bet.odds}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-white font-medium">
                      {formatCurrency(bet.stake)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="outline" className={`px-3 py-1 border-transparent uppercase tracking-wider text-[10px] font-bold ${
                        bet.result === 'Win' ? 'bg-success/10 text-success' : 
                        bet.result === 'Loss' ? 'bg-loss/10 text-loss' : 
                        bet.result === 'Pending' ? 'bg-blue-500/10 text-blue-400' : 'bg-muted/30 text-muted-foreground'
                      }`}>
                        {bet.result?.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-base">
                      {bet.result === 'Win' && <span className="text-success">+{formatCurrency(bet.profitLoss || 0)}</span>}
                      {bet.result === 'Loss' && <span className="text-loss">{formatCurrency(bet.profitLoss || 0)}</span>}
                      {bet.result === 'Push' && <span className="text-muted-foreground">--</span>}
                      {bet.result === 'Pending' && <span className="text-blue-400">--</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-[6px]" onClick={() => {
                          setEditingBet(bet);
                          form.reset({
                            sport: bet.sport,
                            betType: bet.betType,
                            teams: bet.teams,
                            odds: bet.odds,
                            stake: bet.stake,
                            result: bet.result || "Pending",
                            notes: bet.notes || ""
                          });
                          setShowNotes(!!bet.notes);
                          setIsCreateOpen(true);
                        }}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-loss/10 hover:text-loss rounded-[6px]" onClick={() => handleDelete(bet.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
