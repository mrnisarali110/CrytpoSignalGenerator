import { useState } from "react";
import { BotTerminal } from "@/components/bot-terminal";
import { PerformanceChart } from "@/components/performance-chart";
import { SignalCard } from "@/components/signal-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Zap, LayoutDashboard, Settings, LogOut, Cpu } from "lucide-react";
import coreImage from "@assets/generated_images/futuristic_ai_trading_bot_core_logo.png";

const MOCK_SIGNALS = [
  {
    pair: "BTC/USDT",
    type: "LONG" as const,
    entry: "94,250.00",
    tp: "95,100.00",
    sl: "93,800.00",
    confidence: 92,
    time: "2m ago",
    status: "active" as const
  },
  {
    pair: "ETH/USDT",
    type: "SHORT" as const,
    entry: "3,450.50",
    tp: "3,380.00",
    sl: "3,490.00",
    confidence: 88,
    time: "15m ago",
    status: "active" as const
  },
  {
    pair: "SOL/USDT",
    type: "LONG" as const,
    entry: "142.20",
    tp: "145.00",
    sl: "140.50",
    confidence: 85,
    time: "1h ago",
    status: "completed" as const
  }
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");

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
              <p className="text-sm font-medium truncate">Trader_01</p>
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
      <main className="flex-1 overflow-y-auto grid-bg">
        <header className="h-16 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-10 px-6 flex items-center justify-between">
          <h1 className="text-xl font-bold font-sans tracking-tight">Mission Control</h1>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Daily Goal</p>
              <p className="text-sm font-mono font-bold text-primary">1.5% / 2.0%</p>
            </div>
            <div className="h-8 w-[1px] bg-border" />
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Balance</p>
              <p className="text-lg font-mono font-bold text-foreground">$110.30</p>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6 max-w-7xl mx-auto">
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
              <Badge variant="outline" className="font-mono text-xs">
                AUTO-TRADING: ON
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {MOCK_SIGNALS.map((signal, i) => (
                <SignalCard key={i} signal={signal} index={i} />
              ))}
            </div>
          </div>
          
          {/* Decorative Footer */}
          <div className="flex justify-center py-10 opacity-50">
            <img src={coreImage} alt="Core" className="w-32 h-32 object-contain mix-blend-screen opacity-30" />
          </div>
        </div>
      </main>
    </div>
  );
}
