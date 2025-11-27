import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Activity, TrendingUp, Clock, AlertCircle } from "lucide-react";

const STRATEGIES = [
  {
    id: "scalp-v2",
    name: "Micro-Scalp v2",
    description: "High-frequency signals for small price movements. Best for volatile markets.",
    risk: "High",
    winRate: 78,
    avgProfit: 1.2,
    active: true,
    metrics: { trades: 142, profitFactor: 2.1, drawdown: 4.5 }
  },
  {
    id: "trend-master",
    name: "Trend Master",
    description: "Follows major 4H market trends. Fewer trades, higher reliability.",
    risk: "Low",
    winRate: 85,
    avgProfit: 3.5,
    active: true,
    metrics: { trades: 24, profitFactor: 3.8, drawdown: 1.2 }
  },
  {
    id: "sentiment-ai",
    name: "Sentiment AI",
    description: "Experimental strategy based on social volume and news sentiment.",
    risk: "Med",
    winRate: 62,
    avgProfit: 5.1,
    active: false,
    metrics: { trades: 12, profitFactor: 1.5, drawdown: 8.2 }
  }
];

export function StrategiesView() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Trading Strategies</h2>
          <p className="text-muted-foreground">Manage active algorithms and view performance metrics.</p>
        </div>
        <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
          <Activity className="mr-2 h-4 w-4" />
          Backtest All
        </Button>
      </div>

      <div className="grid gap-6">
        {STRATEGIES.map((strategy) => (
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
                <Switch checked={strategy.active} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 pt-4 border-t border-border/50">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" /> Profit Factor
                    </span>
                    <span className="font-mono font-bold">{strategy.metrics.profitFactor}</span>
                  </div>
                  <Progress value={strategy.metrics.profitFactor * 20} className="h-1" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" /> Total Trades
                    </span>
                    <span className="font-mono font-bold">{strategy.metrics.trades}</span>
                  </div>
                  <Progress value={strategy.metrics.trades / 2} className="h-1" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" /> Max Drawdown
                    </span>
                    <span className="font-mono font-bold text-red-400">{strategy.metrics.drawdown}%</span>
                  </div>
                  <Progress value={strategy.metrics.drawdown * 5} className="h-1 bg-red-950" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
