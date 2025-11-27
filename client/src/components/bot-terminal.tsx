import { useEffect, useState, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Terminal, Wifi } from "lucide-react";

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
  const scrollRef = useRef<HTMLDivElement>(null);

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
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [logs]);

  return (
    <Card className="h-full bg-black border-primary/20 flex flex-col font-mono text-xs overflow-hidden shadow-[0_0_30px_rgba(0,255,148,0.05)]">
      <div className="flex items-center justify-between p-2 border-b border-primary/20 bg-primary/5">
        <div className="flex items-center gap-2 text-primary">
          <Terminal className="h-3 w-3" />
          <span className="uppercase tracking-wider font-bold">System Log</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-muted-foreground text-[10px]">ONLINE</span>
        </div>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-1.5">
          {logs.map((log, i) => (
            <div key={i} className="text-muted-foreground hover:text-primary transition-colors cursor-default">
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
