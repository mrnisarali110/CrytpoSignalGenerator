import { useEffect, useState, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Terminal, Wifi, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const LOG_MESSAGES = [
  "Scanning BTC/USDT market depth...",
  "Analyzing 4h RSI divergence...",
  "Volume spike detected on ETH/USDT...",
  "Checking correlation matrix...",
  "Sentiment analysis: Neutral-Bullish...",
  "Calculating Fibonacci retracement levels...",
  "Verifying order book liquidity...",
  "Pattern match: Bull Flag (87% confidence)...",
  "Network latency: 12ms. Connection stable.",
  "Updating moving averages (EMA 20/50/200)...",
];

export function BotTerminal() {
  const [logs, setLogs] = useState<string[]>(["System initialized.", "Connecting to signal node..."]);
  const [isVisible, setIsVisible] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomMsg = LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)];
      const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
      
      setLogs(prev => {
        const newLogs = [...prev, `[${timestamp}] ${randomMsg}`];
        if (newLogs.length > 50) newLogs.shift();
        return newLogs;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  if (!isVisible) {
    return null;
  }

  return (
    <Card className="h-full bg-black border-primary/20 flex flex-col font-mono text-xs overflow-hidden shadow-[0_0_30px_rgba(0,255,148,0.05)]">
      <div className="flex items-center justify-between p-2 md:p-3 border-b border-primary/20 bg-primary/5">
        <div className="flex items-center gap-2 text-primary">
          <Terminal className="h-3 w-3" />
          <span className="uppercase tracking-wider font-bold text-xs md:text-sm">System Log</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-muted-foreground text-[10px]">ONLINE</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="h-6 w-6 p-0 ml-2 hover:bg-red-500/20 hover:text-red-400 transition-colors"
            data-testid="button-close-logs"
            title="Close system logs"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1 p-4" ref={containerRef}>
        <div className="space-y-1.5">
          {logs.map((log, i) => (
            <div key={i} className="text-muted-foreground hover:text-primary transition-colors cursor-default text-xs md:text-sm">
              <span className="text-primary/50 mr-2">{">"}</span>
              {log}
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>
    </Card>
  );
}
