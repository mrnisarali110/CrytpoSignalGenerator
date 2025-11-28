import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BotTerminal } from "@/components/bot-terminal";
import { PerformanceChart } from "@/components/performance-chart";
import { SignalCard } from "@/components/signal-card";
import { StrategiesView } from "@/components/views/strategies-view";
import { RiskView } from "@/components/views/risk-view";
import { SettingsView } from "@/components/views/settings-view";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Zap, LayoutDashboard, Settings, LogOut, Cpu, RotateCw } from "lucide-react";
import coreImage from "@assets/generated_images/futuristic_ai_trading_bot_core_logo.png";
import { useSignals, useSettings, useUser } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

function DashboardHome() {
  const { data: signals, isLoading: signalsLoading, refetch: refetchSignals, isFetching } = useSignals();
  const { data: settings } = useSettings();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    try {
      const res = await fetch("/api/signals/generate", { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate signal");
      
      const newSignal = await res.json();
      
      // Optimistically add new signal to cache without full refetch
      const currentSignals = queryClient.getQueryData<any[]>(["signals"]) || [];
      queryClient.setQueryData(["signals"], [newSignal, ...currentSignals]);
      
      toast({
        title: "Signals Refreshed",
        description: "New trading signals have been generated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate new signals",
        variant: "destructive",
      });
    }
  };

  const handleReset = async () => {
    const confirmed = window.confirm("Reset account to $100 balance and remove all signals? This cannot be undone.");
    if (!confirmed) return;

    try {
      const res = await fetch("/api/account/reset", { method: "POST" });
      if (!res.ok) throw new Error("Failed to reset account");
      
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      queryClient.invalidateQueries({ queryKey: ["balanceHistory"] });
      
      toast({
        title: "Account Reset",
        description: "Balance reset to $100 and all signals cleared.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset account",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 h-[350px]">
          <PerformanceChart />
        </div>
        <div className="h-[350px]">
          <BotTerminal />
        </div>
      </div>

      {/* Signals Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Active Signals
          </h2>
          <div className="flex items-center gap-3">
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleRefresh}
              disabled={isFetching}
              className="border-primary/50 text-primary hover:bg-primary/10"
              data-testid="button-refresh-signals"
            >
              <RotateCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-2">Generate New</span>
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleReset}
              className="border-red-500/50 text-red-400 hover:bg-red-600/10"
              data-testid="button-reset-account"
            >
              <RotateCw className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Reset</span>
            </Button>
            <Badge variant="outline" className="font-mono text-xs">
              AUTO-TRADING: {settings?.autoTrading ? "ON" : "OFF"}
            </Badge>
          </div>
        </div>
        
        {signalsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {signals?.map((signal, i) => (
              <SignalCard 
                key={signal.id} 
                signal={{
                  id: signal.id,
                  pair: signal.pair,
                  type: signal.type as "LONG" | "SHORT",
                  entry: signal.entry,
                  tp: signal.tp,
                  sl: signal.sl,
                  confidence: signal.confidence,
                  status: signal.status as "active" | "pending" | "completed",
                  time: formatDistanceToNow(new Date(signal.createdAt), { addSuffix: true })
                }} 
                index={i}
                onTradeComplete={() => {
                  refetchSignals();
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { data: user } = useUser();
  const { data: settings } = useSettings();

  const currentBalance = parseFloat(user?.balance || "100");
  const dailyTarget = parseFloat(settings?.dailyProfitTarget || "2.0");
  const currentGain = ((currentBalance - 100) / 100 * 100);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="w-16 lg:w-64 border-r border-border bg-sidebar flex flex-col sticky top-0 h-screen">
        <div className="p-4 lg:p-6 flex items-center gap-3 border-b border-border/50">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50 shadow-[0_0_15px_rgba(0,255,148,0.3)]">
             <Cpu className="h-4 w-4 text-primary" />
          </div>
          <span className="font-sans font-bold text-xl tracking-tight hidden lg:block">
            SIGNAL<span className="text-primary">BOT</span>
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
            { id: "strategy", icon: Zap, label: "Active Strategies" },
            { id: "risk", icon: Shield, label: "Risk Settings" },
            { id: "settings", icon: Settings, label: "System Config" },
          ].map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "secondary" : "ghost"}
              className={`w-full justify-start gap-3 ${activeTab === item.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setActiveTab(item.id)}
              data-testid={`nav-${item.id}`}
            >
              <item.icon className="h-5 w-5" />
              <span className="hidden lg:block">{item.label}</span>
            </Button>
          ))}
        </nav>

        <div className="p-4 border-t border-border/50">
          <div className="hidden lg:flex items-center gap-3 mb-4 p-3 bg-card/50 rounded-lg border border-border/50">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary overflow-hidden">
                {/* Avatar Placeholder */}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.username || "Trader_01"}</p>
              <p className="text-xs text-muted-foreground truncate">Pro Plan Active</p>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start gap-3 border-red-900/30 text-red-400 hover:text-red-300 hover:bg-red-950/30">
            <LogOut className="h-5 w-5" />
            <span className="hidden lg:block">Disconnect</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto grid-bg scroll-smooth">
        <header className="h-16 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-10 px-6 flex items-center justify-between">
          <h1 className="text-xl font-bold font-sans tracking-tight">
            {activeTab === 'dashboard' && 'Mission Control'}
            {activeTab === 'strategy' && 'Strategy Lab'}
            {activeTab === 'risk' && 'Risk Management'}
            {activeTab === 'settings' && 'System Config'}
          </h1>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Daily Goal</p>
              <p className="text-sm font-mono font-bold text-primary">{currentGain.toFixed(1)}% / {dailyTarget}%</p>
            </div>
            <div className="h-8 w-[1px] bg-border" />
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Balance</p>
              <p className="text-lg font-mono font-bold text-foreground" data-testid="balance-display">${currentBalance.toFixed(2)}</p>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          {activeTab === 'dashboard' && <DashboardHome />}
          {activeTab === 'strategy' && <StrategiesView />}
          {activeTab === 'risk' && <RiskView />}
          {activeTab === 'settings' && <SettingsView />}
          
          {/* Decorative Footer */}
          <div className="flex justify-center py-10 opacity-50">
            <img src={coreImage} alt="Core" className="w-32 h-32 object-contain mix-blend-screen opacity-30" />
          </div>
        </div>
      </main>
    </div>
  );
}
