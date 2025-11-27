import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldAlert, AlertTriangle, Lock } from "lucide-react";
import { useSettings, useUpdateSettings } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export function RiskView() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const { toast } = useToast();

  const [riskPerTrade, setRiskPerTrade] = useState(2.0);
  const [maxLeverage, setMaxLeverage] = useState(10);
  const [maxDailyDrawdown, setMaxDailyDrawdown] = useState("5.0");
  const [dailyProfitTarget, setDailyProfitTarget] = useState("2.0");
  const [compoundProfits, setCompoundProfits] = useState(true);

  useEffect(() => {
    if (settings) {
      setRiskPerTrade(parseFloat(settings.riskPerTrade));
      setMaxLeverage(settings.maxLeverage);
      setMaxDailyDrawdown(settings.maxDailyDrawdown);
      setDailyProfitTarget(settings.dailyProfitTarget);
      setCompoundProfits(settings.compoundProfits);
    }
  }, [settings]);

  const handleUpdate = async (updates: any) => {
    try {
      await updateSettings.mutateAsync(updates);
      toast({
        title: "Settings Updated",
        description: "Risk management settings have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Risk Management</h2>
          <p className="text-muted-foreground">Configure safety protocols and capital preservation rules.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              Position Sizing
            </CardTitle>
            <CardDescription>Define how much capital to allocate per trade.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Risk Per Trade</Label>
                <span className="font-mono text-primary font-bold">{riskPerTrade.toFixed(1)}%</span>
              </div>
              <Slider 
                value={[riskPerTrade]} 
                onValueChange={(value) => setRiskPerTrade(value[0])}
                onValueCommit={(value) => handleUpdate({ riskPerTrade: value[0].toString() })}
                max={5} 
                step={0.5} 
                className="[&>.absolute]:bg-primary" 
              />
              <p className="text-xs text-muted-foreground">Recommended: 1-2% for small accounts.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Max Leverage</Label>
                <span className="font-mono text-primary font-bold">{maxLeverage}x</span>
              </div>
              <Slider 
                value={[maxLeverage]} 
                onValueChange={(value) => setMaxLeverage(value[0])}
                onValueCommit={(value) => handleUpdate({ maxLeverage: value[0] })}
                max={50} 
                step={1} 
              />
              <p className="text-xs text-muted-foreground">Warning: Higher leverage increases liquidation risk.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-red-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Emergency Stops
            </CardTitle>
            <CardDescription>Hard limits that will pause trading automatically.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Max Daily Drawdown</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    className="w-20 h-8 font-mono text-right" 
                    value={maxDailyDrawdown}
                    onChange={(e) => setMaxDailyDrawdown(e.target.value)}
                    onBlur={() => handleUpdate({ maxDailyDrawdown })}
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Take Profit Target (Daily)</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    className="w-20 h-8 font-mono text-right" 
                    value={dailyProfitTarget}
                    onChange={(e) => setDailyProfitTarget(e.target.value)}
                    onBlur={() => handleUpdate({ dailyProfitTarget })}
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
              </div>
            </div>
            
            <Alert variant="destructive" className="bg-red-950/20 border-red-900/50 text-red-200">
              <Lock className="h-4 w-4" />
              <AlertTitle>Kill Switch</AlertTitle>
              <AlertDescription>
                Automatically liquidates all positions if BTC drops more than 10% in 1 hour.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 bg-card/50 backdrop-blur-sm">
            <CardHeader>
                <CardTitle>Capital Protection</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-1">
                        <Label className="text-base">Compound Profits</Label>
                        <p className="text-sm text-muted-foreground">Re-invest daily profits into the trading balance automatically.</p>
                    </div>
                    <Switch 
                      checked={compoundProfits} 
                      onCheckedChange={(checked) => {
                        setCompoundProfits(checked);
                        handleUpdate({ compoundProfits: checked });
                      }}
                    />
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
