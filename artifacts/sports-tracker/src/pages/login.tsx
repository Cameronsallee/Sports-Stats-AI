import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    loginMutation.mutate({ data: values }, {
      onSuccess: (data) => {
        login(data.token);
      },
      onError: (error: any) => {
        toast({
          title: "Login failed",
          description: error.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 text-foreground">
      <div className="w-full max-w-[400px] space-y-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(45,255,136,0.15)]">
            <BarChart3 className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold tracking-widest text-white uppercase">BETPULSE</h2>
          <p className="text-muted-foreground mt-2 font-medium tracking-wide">ENTER TERMINAL</p>
        </div>

        <div className="bg-card border border-white/5 p-8 rounded-[14px] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground uppercase text-xs tracking-wider font-semibold">Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="terminal@betpulse.io" 
                        {...field} 
                        className="bg-input border-white/5 focus-visible:ring-primary h-12 rounded-[10px] text-white placeholder:text-muted-foreground/50" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground uppercase text-xs tracking-wider font-semibold">Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••"
                        {...field} 
                        className="bg-input border-white/5 focus-visible:ring-primary h-12 rounded-[10px] text-white placeholder:text-muted-foreground/50" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full h-12 bg-primary text-[#0B0F14] hover:bg-primary/90 font-bold uppercase tracking-wider rounded-[10px] shadow-[0_0_20px_rgba(45,255,136,0.2)] hover:shadow-[0_0_25px_rgba(45,255,136,0.4)] transition-all mt-4" 
                disabled={loginMutation.isPending}
                data-testid="button-submit-login"
              >
                {loginMutation.isPending ? "Authenticating..." : "Initialize Session"}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center">
            <Link href="/forgot-password">
              <span data-testid="link-forgot-password" className="text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider cursor-pointer">
                Forgot password?
              </span>
            </Link>
          </div>
          <div className="mt-4 text-center text-sm text-muted-foreground font-medium">
            No account? <Link href="/register" className="text-primary hover:text-primary/80 transition-colors uppercase tracking-wider ml-1">Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
