import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSignals, useStrategies } from "@/hooks/use-api";
import { formatDistanceToNow } from "date-fns";

export function HistoryView() {
  const { data: signals, isLoading } = useSignals(100);
  const { data: strategies } = useStrategies();

  const completedSignals = signals?.filter(s => s.status === "completed" && s.result) || [];
  const wins = completedSignals.filter(s => s.result === "tp").length;
  const losses = completedSignals.filter(s => s.result === "sl").length;
  const winRate = completedSignals.length > 0 ? ((wins / completedSignals.length) * 100).toFixed(1) : "0";

  // Group by strategy
  const groupedByStrategy = strategies?.reduce((acc: any, strategy) => {
    const strategySignals = completedSignals.filter(s => s.strategyId === strategy.id);
    if (strategySignals.length > 0) {
      const strategyWins = strategySignals.filter(s => s.result === "tp").length;
      acc[strategy.id] = {
        strategy,
        signals: strategySignals,
        wins: strategyWins,
        losses: strategySignals.length - strategyWins,
        winRate: ((strategyWins / strategySignals.length) * 100).toFixed(1),
      };
    }
    return acc;
  }, {}) || {};

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-card/50 border-primary/20">
          <CardContent className="pt-4 md:pt-6">
            <p className="text-xs md:text-sm text-muted-foreground uppercase">Total Trades</p>
            <p className="text-2xl md:text-3xl font-bold text-primary">{completedSignals.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-green-500/20">
          <CardContent className="pt-4 md:pt-6">
            <p className="text-xs md:text-sm text-muted-foreground uppercase">Wins</p>
            <p className="text-2xl md:text-3xl font-bold text-green-500">{wins}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-red-500/20">
          <CardContent className="pt-4 md:pt-6">
            <p className="text-xs md:text-sm text-muted-foreground uppercase">Losses</p>
            <p className="text-2xl md:text-3xl font-bold text-red-500">{losses}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-primary/20">
          <CardContent className="pt-4 md:pt-6">
            <p className="text-xs md:text-sm text-muted-foreground uppercase">Win Rate</p>
            <p className="text-2xl md:text-3xl font-bold text-primary">{winRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Strategy Performance */}
      <div className="space-y-3 md:space-y-4">
        <h2 className="text-lg md:text-xl font-bold">Strategy Performance</h2>
        {Object.entries(groupedByStrategy).map(([strategyId, data]: any) => (
          <Card key={strategyId} className="bg-card/50 border-primary/20">
            <CardHeader className="pb-3 md:pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-base md:text-lg">{data.strategy.name}</CardTitle>
                  <CardDescription className="text-xs md:text-sm">{data.signals.length} total trades</CardDescription>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 text-xs md:text-sm">
                    {data.wins} Wins
                  </Badge>
                  <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 text-xs md:text-sm">
                    {data.losses} Losses
                  </Badge>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs md:text-sm">
                    {data.winRate}% Win Rate
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.signals.slice(0, 5).map((signal: any) => (
                <div key={signal.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 bg-background/50 rounded border border-border/50">
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${signal.result === "tp" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {signal.pair}
                    </Badge>
                    <span className={`text-xs md:text-sm font-mono ${signal.type === "LONG" ? "text-green-500" : "text-red-500"}`}>
                      {signal.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs ${signal.result === "tp" ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-red-500/10 text-red-400 border-red-500/30"}`}>
                      {signal.result === "tp" ? "✓ Win" : "✗ Loss"}
                    </Badge>
                    <span className="text-xs md:text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(signal.completedAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* All Completed Signals */}
      <div className="space-y-3 md:space-y-4">
        <h2 className="text-lg md:text-xl font-bold">Trade History</h2>
        <div className="space-y-2">
          {completedSignals.length === 0 ? (
            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-6 text-center text-muted-foreground">
                No completed trades yet. Generate signals and mark them as TP or SL to see history.
              </CardContent>
            </Card>
          ) : (
            completedSignals.map((signal: any) => {
              const strategy = strategies?.find(s => s.id === signal.strategyId);
              return (
                <Card key={signal.id} className="bg-card/50 border-border/50">
                  <CardContent className="pt-4 md:pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={`text-xs ${signal.result === "tp" ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-red-500/10 text-red-400 border-red-500/30"}`}>
                            {signal.pair}
                          </Badge>
                          <span className={`text-xs md:text-sm font-bold ${signal.type === "LONG" ? "text-green-500" : "text-red-500"}`}>
                            {signal.type}
                          </span>
                          <Badge variant="outline" className="text-xs">{signal.leverage}x</Badge>
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground">{strategy?.name || "Unknown Strategy"}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className={`text-sm md:text-base font-bold ${signal.result === "tp" ? "text-green-500" : "text-red-500"}`}>
                            {signal.result === "tp" ? "✓ Win" : "✗ Loss"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(signal.completedAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
