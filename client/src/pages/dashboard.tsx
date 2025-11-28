import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { BotTerminal } from "@/components/bot-terminal";
import { PerformanceChart } from "@/components/performance-chart";
import { SignalCard } from "@/components/signal-card";
import { StrategiesView } from "@/components/views/strategies-view";
import { RiskView } from "@/components/views/risk-view";
import { SettingsView } from "@/components/views/settings-view";
import { HistoryView } from "@/components/views/history-view";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Shield, Zap, LayoutDashboard, Settings, LogOut, Cpu, RotateCw, Edit2, History } from "lucide-react";
import coreImage from "@assets/generated_images/futuristic_ai_trading_bot_core_logo.png";
import { useSignals, useSettings, useUser, useStrategies, useUpdateSettings } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

function DashboardHome() {
  const { data: signals, isLoading: signalsLoading, refetch: refetchSignals, isFetching } = useSignals();
  const { data: strategies } = useStrategies();
  const { data: settings } = useSettings();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>("auto");
  const [isTerminalVisible, setIsTerminalVisible] = useState(true);

  const handleRefresh = async () => {
    try {
      const res = await fetch("/api/signals/generate", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategyId: selectedStrategyId === "auto" ? null : selectedStrategyId })
      });
      if (!res.ok) throw new Error("Failed to generate signal");
      
      const newSignal = await res.json();
      
      // Optimistically add new signal to cache without full refetch
      const currentSignals = queryClient.getQueryData<any[]>(["signals"]) || [];
      queryClient.setQueryData(["signals"], [newSignal, ...currentSignals]);
      
      const strategyName = strategies?.find(s => s.id === selectedStrategyId)?.name || "MACD Bot";
      const leverageText = newSignal.leverage ? `${newSignal.leverage}x leverage` : "";
      const confidenceText = newSignal.confidence ? `${newSignal.confidence}% confidence` : "";
      toast({
        title: "Signals Refreshed",
        description: `${strategyName} - ${confidenceText}${leverageText ? ", " + leverageText : ""}`,
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
      <div className="flex flex-col md:flex-row gap-6">
        <div className="h-[350px] flex-1 min-w-0">
          <PerformanceChart />
        </div>
        {isTerminalVisible && (
          <div className="h-[350px] md:w-[calc(33.333%-1rem)]">
            <BotTerminal isVisible={isTerminalVisible} onClose={() => setIsTerminalVisible(false)} />
          </div>
        )}
      </div>

      {/* Signals Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Active Signals
          </h2>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
            <Select value={selectedStrategyId} onValueChange={setSelectedStrategyId}>
              <SelectTrigger className="w-full sm:w-48 h-9 border-primary/50 text-primary text-xs sm:text-sm">
                <SelectValue placeholder="Strategy..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto (MACD Bot)</SelectItem>
                {strategies?.map((strategy) => (
                  <SelectItem key={strategy.id} value={strategy.id} disabled={!strategy.active}>
                    {strategy.name} {!strategy.active && "(Paused)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleRefresh}
              disabled={isFetching}
              className="border-primary text-primary hover:bg-primary/20 hover:shadow-[0_0_20px_rgba(0,255,148,0.5)] transition-all duration-300 group relative"
              data-testid="button-refresh-signals"
            >
              <RotateCw className={`h-4 w-4 transition-transform ${isFetching ? 'animate-spin' : 'group-hover:rotate-180'}`} />
              <span className="hidden sm:inline ml-2">Generate New</span>
              <div className="absolute inset-0 rounded border border-primary/0 group-hover:border-primary/50 transition-all duration-300" />
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleReset}
              className="border-red-500 text-red-400 hover:bg-red-600/20 hover:shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all duration-300 group relative"
              data-testid="button-reset-account"
            >
              <RotateCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-300" />
              <span className="hidden sm:inline ml-2">Reset</span>
              <div className="absolute inset-0 rounded border border-red-500/0 group-hover:border-red-500/50 transition-all duration-300" />
            </Button>
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
                  leverage: signal.leverage || 1,
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
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const { data: user, refetch: refetchUser } = useUser();
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editOpen, setEditOpen] = useState(false);
  const [editBalance, setEditBalance] = useState("");
  const [editDailyGoal, setEditDailyGoal] = useState("");

  const currentBalance = parseFloat(user?.balance || "100");
  const dailyTarget = parseFloat(settings?.dailyProfitTarget || "2.0");
  const currentGain = ((currentBalance - 100) / 100 * 100);

  const handleEditOpen = () => {
    setEditBalance(currentBalance.toString());
    setEditDailyGoal(dailyTarget.toString());
    setEditOpen(true);
  };

  const handleSaveChanges = async () => {
    try {
      const newBalance = parseFloat(editBalance);
      const newDailyGoal = parseFloat(editDailyGoal);

      if (newBalance <= 0 || newDailyGoal <= 0) {
        toast({
          title: "Invalid Input",
          description: "Balance and daily goal must be greater than 0",
          variant: "destructive",
        });
        return;
      }

      // Update balance via API
      const res = await fetch("/api/user/balance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ balance: newBalance.toFixed(2) }),
      });
      if (!res.ok) throw new Error("Failed to update balance");

      // Update daily goal
      await updateSettings.mutateAsync({ dailyProfitTarget: newDailyGoal.toString() });

      // Refetch to get updated data
      await refetchUser();
      queryClient.invalidateQueries({ queryKey: ["settings"] });

      toast({
        title: "Updated",
        description: `Balance: $${newBalance.toFixed(2)} | Daily Goal: ${newDailyGoal}%`,
      });
      setEditOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Logout failed");

      toast({
        title: "Logged Out",
        description: "See you next time!",
      });

      // Full page reload to reset auth state and redirect to login
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 lg:border-r border-b lg:border-b-0 border-border bg-sidebar flex flex-row lg:flex-col sticky top-0 lg:h-screen h-auto">
        <div className="p-4 lg:p-6 flex items-center gap-3 border-b border-border/50">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50 shadow-[0_0_15px_rgba(0,255,148,0.3)]">
             <Cpu className="h-4 w-4 text-primary" />
          </div>
          <span className="font-sans font-bold text-xl tracking-tight hidden lg:block">
            SIGNAL<span className="text-primary">BOT</span>
          </span>
        </div>

        <nav className="flex-1 p-2 lg:p-4 flex lg:flex-col gap-1 lg:space-y-2 overflow-x-auto lg:overflow-x-visible">
          {[
            { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
            { id: "strategy", icon: Zap, label: "Active Strategies" },
            { id: "history", icon: History, label: "History" },
            { id: "risk", icon: Shield, label: "Risk Settings" },
            { id: "settings", icon: Settings, label: "System Config" },
          ].map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "secondary" : "ghost"}
              size="sm"
              className={`flex-shrink-0 lg:w-full justify-center lg:justify-start gap-3 ${activeTab === item.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setActiveTab(item.id)}
              data-testid={`nav-${item.id}`}
              title={item.label}
            >
              <item.icon className="h-5 w-5" />
              <span className="hidden lg:block">{item.label}</span>
            </Button>
          ))}
        </nav>

        <div className="p-2 lg:p-4 border-t lg:border-t border-l lg:border-l-0 border-border/50">
          <div className="hidden lg:flex items-center gap-3 mb-4 p-3 bg-card/50 rounded-lg border border-border/50">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary overflow-hidden">
                {/* Avatar Placeholder */}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.username || "Trader_01"}</p>
              <p className="text-xs text-muted-foreground truncate">Pro Plan Active</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="w-full lg:w-full justify-center lg:justify-start gap-3 border-red-900/30 text-red-400 hover:text-red-300 hover:bg-red-950/30"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="h-5 w-5" />
            <span className="hidden lg:block">Disconnect</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto grid-bg scroll-smooth w-full">
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-10 px-3 md:px-6 py-3 md:h-16 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <h1 className="text-base sm:text-lg md:text-xl font-bold font-sans tracking-tight truncate">
            {activeTab === 'dashboard' && 'Mission Control'}
            {activeTab === 'strategy' && 'Strategy Lab'}
            {activeTab === 'history' && 'Trade History'}
            {activeTab === 'risk' && 'Risk Management'}
            {activeTab === 'settings' && 'System Config'}
          </h1>
          <div className="flex items-center gap-2 sm:gap-3 md:gap-6 flex-wrap justify-end">
            <div className="text-right">
              <p className="text-[9px] sm:text-xs text-muted-foreground uppercase tracking-wider">Daily Goal</p>
              <p className="text-xs sm:text-sm font-mono font-bold text-primary">{currentGain.toFixed(1)}%/{dailyTarget}%</p>
            </div>
            <div className="hidden sm:block h-8 w-[1px] bg-border" />
            <div className="text-right">
              <p className="text-[9px] sm:text-xs text-muted-foreground uppercase tracking-wider">Balance</p>
              <p className="text-xs sm:text-lg font-mono font-bold text-foreground" data-testid="balance-display">${currentBalance.toFixed(2)}</p>
            </div>
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleEditOpen}
                  className="text-primary hover:bg-primary/10"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Account Settings</DialogTitle>
                  <DialogDescription>Update your balance and daily profit goal.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Total Balance ($)</label>
                    <Input
                      type="number"
                      value={editBalance}
                      onChange={(e) => setEditBalance(e.target.value)}
                      className="font-mono"
                      step="0.01"
                      min="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Daily Profit Goal (%)</label>
                    <Input
                      type="number"
                      value={editDailyGoal}
                      onChange={(e) => setEditDailyGoal(e.target.value)}
                      className="font-mono"
                      step="0.1"
                      min="0.1"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={handleSaveChanges}
                      className="flex-1 bg-primary hover:bg-primary/90"
                    >
                      Save Changes
                    </Button>
                    <Button 
                      onClick={() => setEditOpen(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          {activeTab === 'dashboard' && <DashboardHome />}
          {activeTab === 'strategy' && <StrategiesView />}
          {activeTab === 'history' && <HistoryView />}
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
