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
import { Trash2, Edit2, Plus, FilterX } from "lucide-react";

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

export default function Bets() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filterSport, setFilterSport] = useState<string>("all");
  const [filterResult, setFilterResult] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBet, setEditingBet] = useState<any>(null);

  const queryParams: any = {};
  if (filterSport !== "all") queryParams.sport = filterSport;
  if (filterResult !== "all") queryParams.result = filterResult;

  const { data: bets, isLoading } = useListBets(queryParams, {
    query: {
      enabled: isAuthenticated,
      queryKey: getListBetsQueryKey(queryParams)
    }
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
            toast({ title: "Bet logged" });
            setIsCreateOpen(false);
            form.reset();
            invalidateQueries();
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight uppercase">Ledger</h1>
          <p className="text-muted-foreground mt-1">Complete betting history and active positions.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <Select value={filterSport} onValueChange={setFilterSport}>
            <SelectTrigger className="w-[140px] bg-card">
              <SelectValue placeholder="Sport" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sports</SelectItem>
              {SPORTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          
          <Select value={filterResult} onValueChange={setFilterResult}>
            <SelectTrigger className="w-[140px] bg-card">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Results</SelectItem>
              {RESULTS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>

          {(filterSport !== "all" || filterResult !== "all") && (
            <Button variant="ghost" size="icon" onClick={() => { setFilterSport("all"); setFilterResult("all"); }}>
              <FilterX className="h-4 w-4" />
            </Button>
          )}

          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            if (!open) {
              setEditingBet(null);
              form.reset({
                sport: "Football", betType: "Moneyline", teams: "", odds: -110, stake: 100, result: "Pending", notes: ""
              });
            }
            setIsCreateOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button className="ml-auto font-bold uppercase tracking-wider gap-2">
                <Plus className="w-4 h-4" /> Log Position
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-card border-border">
              <DialogHeader>
                <DialogTitle className="uppercase tracking-wider font-bold">
                  {editingBet ? "Edit Position" : "Log New Position"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="sport" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sport</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select sport" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {SPORTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="betType" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bet Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {BET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  
                  <FormField control={form.control} name="teams" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selection / Matchup</FormLabel>
                      <FormControl><Input placeholder="e.g. Chiefs -3.5" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="odds" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Odds (American)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="stake" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stake ($)</FormLabel>
                        <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="result" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {RESULTS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thesis / Notes</FormLabel>
                      <FormControl><Input placeholder="Why are you taking this?" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button type="submit" className="w-full font-bold uppercase tracking-wider mt-4" disabled={createBet.isPending || updateBet.isPending}>
                    {createBet.isPending || updateBet.isPending ? "Processing..." : editingBet ? "Update Position" : "Confirm Position"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full bg-muted/20" />)}
          </div>
        ) : !bets || bets.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <p className="text-lg">No positions match the current criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase tracking-wider bg-muted/30 border-b border-border">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Selection</th>
                  <th className="px-6 py-4">Type/Sport</th>
                  <th className="px-6 py-4 text-right">Odds</th>
                  <th className="px-6 py-4 text-right">Stake</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">P&L</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bets.map(bet => (
                  <tr key={bet.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                      {format(new Date(bet.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">
                      {bet.teams}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {bet.betType} <span className="opacity-50 mx-1">•</span> {bet.sport}
                    </td>
                    <td className="px-6 py-4 text-right font-mono">
                      {bet.odds > 0 ? `+${bet.odds}` : bet.odds}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-foreground">
                      {formatCurrency(bet.stake)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="outline" className={
                        bet.result === 'Win' ? 'border-success text-success' : 
                        bet.result === 'Loss' ? 'border-destructive text-destructive' : 
                        bet.result === 'Pending' ? 'border-primary text-primary' : 'border-muted-foreground text-muted-foreground'
                      }>
                        {bet.result?.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold">
                      {bet.result === 'Win' && <span className="text-success">+{formatCurrency(bet.profitLoss || 0)}</span>}
                      {bet.result === 'Loss' && <span className="text-destructive">{formatCurrency(bet.profitLoss || 0)}</span>}
                      {bet.result === 'Push' && <span className="text-muted-foreground">--</span>}
                      {bet.result === 'Pending' && <span className="text-primary">--</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => {
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
                          setIsCreateOpen(true);
                        }}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(bet.id)}>
                          <Trash2 className="h-4 w-4" />
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
