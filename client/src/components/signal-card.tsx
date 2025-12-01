import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Target, TrendingUp, AlertTriangle, Copy, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface SignalProps {
  id?: string;
  pair: string;
  type: "LONG" | "SHORT";
  entry: string;
  tp: string;
  sl: string;
  confidence: number;
  leverage: number;
  time: string;
  status: "active" | "pending" | "completed";
}

export function SignalCard({ signal, index, onTradeComplete }: { signal: SignalProps; index: number; onTradeComplete?: () => void }) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const copySignal = () => {
    navigator.clipboard.writeText(`${signal.type} ${signal.pair} @ ${signal.entry} TP: ${signal.tp} SL: ${signal.sl} ${signal.leverage}x`);
    toast({
      title: "Signal Copied",
      description: "Trade details copied to clipboard",
    });
  };

  const executeTrade = async (result: "tp" | "sl") => {
    setIsProcessing(true);
    try {
      // Optimistic update - update cache immediately
      const currentSignals = queryClient.getQueryData<any[]>(["signals"]) || [];
      const updatedSignals = currentSignals.map(s => 
        s.id === signal.id ? { ...s, status: "completed" } : s
      );
      queryClient.setQueryData(["signals"], updatedSignals);

      const res = await fetch("/api/trade/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          signalId: signal.id,
          result
        }),
      });
      if (!res.ok) throw new Error("Failed to execute trade");
      
      const data = await res.json();
      const profitLoss = parseFloat(data.profitLoss);
      const profitPercentage = parseFloat(data.profitPercentage);
      
      const displayProfit = `${profitLoss >= 0 ? '+' : ''}$${profitLoss.toFixed(2)} (${profitPercentage >= 0 ? '+' : ''}${profitPercentage.toFixed(1)}%)`;
      
      toast({
        title: result === "tp" ? "✅ Trade Won!" : "❌ Trade Lost",
        description: `P&L: ${displayProfit} | New Balance: $${data.newBalance}`,
      });
      
      // Refetch user balance after a short delay to get updated balance
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["user"] });
        queryClient.invalidateQueries({ queryKey: ["balanceHistory"] });
      }, 300);
      
      if (onTradeComplete) onTradeComplete();
    } catch (error) {
      // Revert on error
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      
      toast({
        title: "Error",
        description: "Failed to process trade",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="border-l-4 border-l-primary bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors group relative overflow-hidden">
        {/* Scanline effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 translate-y-[-100%] group-hover:translate-y-[100%] transition-all duration-1000 pointer-events-none" />

        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/50 font-mono">
              {signal.pair}
            </Badge>
            <span className={`text-sm font-bold ${signal.type === 'LONG' ? 'text-green-500' : 'text-red-500'}`}>
              {signal.type}
            </span>
          </div>
          <span className="text-xs text-muted-foreground font-mono">{signal.time}</span>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Entry</p>
              <p className="font-mono text-sm font-medium">{signal.entry}</p>
            </div>
            <div className="space-y-1 text-center">
              <p className="text-xs text-muted-foreground">Confidence</p>
              <div className="flex items-center justify-center gap-1 text-primary font-mono font-bold text-sm">
                <TrendingUp className="h-3 w-3" />
                {signal.confidence}%
              </div>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-xs text-muted-foreground">Leverage</p>
              <p className="font-mono text-sm font-bold text-yellow-400">{signal.leverage}x</p>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-border/50">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-green-400">
                <Target className="h-4 w-4" />
                <span>TP: <span className="font-mono">{signal.tp}</span></span>
              </div>
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-4 w-4" />
                <span>SL: <span className="font-mono">{signal.sl}</span></span>
              </div>
            </div>
          </div>

          {signal.status === "active" ? (
            <div className="grid grid-cols-2 gap-2 mt-4">
              <Button 
                size="sm" 
                disabled={isProcessing}
                onClick={() => executeTrade("tp")}
                className="h-8 text-xs font-mono bg-green-600/20 hover:bg-green-600/40 text-green-400"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" /> Hit TP
              </Button>
              <Button 
                size="sm" 
                disabled={isProcessing}
                onClick={() => executeTrade("sl")}
                className="h-8 text-xs font-mono bg-red-600/20 hover:bg-red-600/40 text-red-400"
              >
                <XCircle className="h-3 w-3 mr-1" /> Hit SL
              </Button>
            </div>
          ) : (
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full mt-4 h-8 text-xs font-mono uppercase tracking-wider hover:bg-primary/20 hover:text-primary transition-colors"
              onClick={copySignal}
            >
              <Copy className="h-3 w-3 mr-2" /> Copy Signal
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
