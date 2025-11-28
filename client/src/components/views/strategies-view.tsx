import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { useStrategies, useUpdateStrategy } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function StrategiesView() {
  const { data: strategies, isLoading } = useStrategies();
  const updateStrategy = useUpdateStrategy();
  const { toast } = useToast();
  const [isBacktesting, setIsBacktesting] = useState(false);

  const handleToggle = async (id: string, currentActive: boolean) => {
    try {
      await updateStrategy.mutateAsync({
        id,
        updates: { active: !currentActive }
      });
      toast({
        title: currentActive ? "Strategy Paused" : "Strategy Activated",
        description: `Strategy has been ${currentActive ? 'paused' : 'activated'} successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update strategy",
        variant: "destructive",
      });
    }
  };

  const handleBacktestAll = async () => {
    setIsBacktesting(true);
    try {
      const res = await fetch("/api/strategies/backtest", { method: "POST" });
      if (!res.ok) throw new Error("Backtest failed");
      
      const results = await res.json();
      toast({
        title: "Backtest Complete",
        description: `Tested ${results.count} strategies. Win rates updated.`,
      });
      // Refetch strategies to show updated win rates
      await new Promise(resolve => setTimeout(resolve, 500));
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to run backtest",
        variant: "destructive",
      });
    } finally {
      setIsBacktesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Trading Strategies</h2>
          <p className="text-muted-foreground">Manage active algorithms and view performance metrics.</p>
        </div>
        <Button 
          variant="outline" 
          className="border-primary/50 text-primary hover:bg-primary/10"
          onClick={handleBacktestAll}
          disabled={isBacktesting}
        >
          <Activity className={`mr-2 h-4 w-4 ${isBacktesting ? 'animate-spin' : ''}`} />
          {isBacktesting ? 'Backtesting...' : 'Backtest All'}
        </Button>
      </div>

      <div className="grid gap-6">
        {strategies?.map((strategy) => (
          <Card key={strategy.id} className={`border-l-4 ${strategy.active ? 'border-l-primary bg-card/50' : 'border-l-muted bg-card/20'} backdrop-blur-sm transition-all`}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl">{strategy.name}</CardTitle>
                  <Badge variant={strategy.active ? "default" : "secondary"} className={strategy.active ? "bg-primary/20 text-primary hover:bg-primary/30" : ""}>
                    {strategy.active ? "ACTIVE" : "PAUSED"}
                  </Badge>
                  <Badge variant="outline" className={
                    strategy.risk === "High" ? "text-red-400 border-red-400/30" :
                    strategy.risk === "Med" ? "text-yellow-400 border-yellow-400/30" :
                    "text-green-400 border-green-400/30"
                  }>
                    {strategy.risk} Risk
                  </Badge>
                </div>
                <CardDescription className="max-w-md">{strategy.description}</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-muted-foreground">Win Rate</div>
                  <div className="text-2xl font-bold font-mono text-primary">{strategy.winRate}%</div>
                </div>
                <Switch 
                  checked={strategy.active} 
                  onCheckedChange={() => handleToggle(strategy.id, strategy.active)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 pt-4 border-t border-border/50">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" /> Profit Factor
                    </span>
                    <span className="font-mono font-bold">{strategy.profitFactor}</span>
                  </div>
                  <Progress value={parseFloat(strategy.profitFactor) * 20} className="h-1" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" /> Total Trades
                    </span>
                    <span className="font-mono font-bold">{strategy.totalTrades}</span>
                  </div>
                  <Progress value={strategy.totalTrades / 2} className="h-1" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" /> Max Drawdown
                    </span>
                    <span className="font-mono font-bold text-red-400">{strategy.maxDrawdown}%</span>
                  </div>
                  <Progress value={parseFloat(strategy.maxDrawdown) * 5} className="h-1 bg-red-950" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
