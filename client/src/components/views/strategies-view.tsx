import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { useStrategies, useUpdateStrategy } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";

const getLeverageRange = (risk: string): { min: number; max: number } => {
  switch (risk) {
    case "High":
      return { min: 6, max: 10 };
    case "Med":
      return { min: 4, max: 7 };
    case "Low":
      return { min: 1, max: 3 };
    default:
      return { min: 1, max: 5 };
  }
};

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
      
      const data = await res.json();
      
      // Show detailed backtest results
      let detailsHtml = `<div style="text-align: left; font-size: 12px; line-height: 1.6;">`;
      detailsHtml += `<p><strong>Backtest Results (100 trades per strategy, $100 starting capital)</strong></p>`;
      
      data.results.forEach((result: any) => {
        const profit = result.finalBalance - result.initialBalance;
        const profitPct = result.profitPercentage;
        detailsHtml += `
          <div style="margin-bottom: 15px; padding: 10px; background: rgba(0,255,148,0.05); border-left: 3px solid ${profitPct >= 0 ? '#00ff94' : '#ff4444'};">
            <strong>${result.name}</strong> (${result.leverage}x leverage)<br/>
            ✓ Win Rate: ${result.winRate}% | Wins: ${result.winningTrades}/100<br/>
            💰 Profit Factor: ${result.profitFactor} | Max Drawdown: ${result.maxDrawdown}%<br/>
            📊 Final: $${result.finalBalance} (${profitPct >= 0 ? '+' : ''}${profitPct.toFixed(2)}%) | Avg Win: ${result.avgWinPercentage}%
          </div>
        `;
      });
      detailsHtml += `</div>`;
      
      toast({
        title: "✅ Backtest Complete",
        description: `${data.count} strategies tested with 100 trades each. Results updated.`,
      });
      
      // Refetch strategies to show updated metrics
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Trading Strategies</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Manage active algorithms and view performance metrics.</p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          className="border-primary/50 text-primary hover:bg-primary/10 w-full sm:w-auto"
          onClick={handleBacktestAll}
          disabled={isBacktesting}
        >
          <Activity className={`mr-2 h-4 w-4 ${isBacktesting ? 'animate-spin' : ''}`} />
          {isBacktesting ? 'Backtesting...' : 'Backtest All'}
        </Button>
      </div>

      <div className="grid gap-4 sm:gap-6">
        {strategies?.map((strategy) => (
          <Card key={strategy.id} className={`border-l-4 ${strategy.active ? 'border-l-primary bg-card/50' : 'border-l-muted bg-card/20'} backdrop-blur-sm transition-all`}>
            <CardHeader className="flex flex-col space-y-3 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-wrap">
                    <CardTitle className="text-lg sm:text-xl">{strategy.name}</CardTitle>
                    <Badge variant={strategy.active ? "default" : "secondary"} className={`text-xs ${strategy.active ? "bg-primary/20 text-primary hover:bg-primary/30" : ""}`}>
                      {strategy.active ? "ACTIVE" : "PAUSED"}
                    </Badge>
                    <Badge variant="outline" className={`text-xs ${
                      strategy.risk === "High" ? "text-red-400 border-red-400/30" :
                      strategy.risk === "Med" ? "text-yellow-400 border-yellow-400/30" :
                      "text-green-400 border-green-400/30"
                    }`}>
                      {strategy.risk} Risk
                    </Badge>
                    <Badge variant="outline" className="text-xs text-yellow-500 border-yellow-500/30 font-mono">
                      {getLeverageRange(strategy.risk).min}x - {getLeverageRange(strategy.risk).max}x
                    </Badge>
                  </div>
                  <CardDescription className="text-xs sm:text-sm">{strategy.description}</CardDescription>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 justify-between sm:justify-normal">
                  <div className="text-right">
                    <div className="text-xs font-medium text-muted-foreground">Win Rate</div>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-primary">{strategy.winRate}%</div>
                  </div>
                  <Switch 
                    checked={strategy.active} 
                    onCheckedChange={() => handleToggle(strategy.id, strategy.active)}
                    title={strategy.active ? "Click to pause this strategy" : "Click to activate this strategy"}
                  />
                </div>
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
