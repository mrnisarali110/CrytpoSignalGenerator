import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Key, Smartphone, Globe, CheckCircle2 } from "lucide-react";

export function SettingsView() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Configuration</h2>
          <p className="text-muted-foreground">Manage API connections and notification preferences.</p>
        </div>
      </div>

      <Tabs defaultValue="exchange" className="space-y-6">
        <TabsList className="bg-card border border-border/50">
          <TabsTrigger value="exchange">Exchange API</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>

        <TabsContent value="exchange" className="space-y-6">
          <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Exchange Connection
              </CardTitle>
              <CardDescription>Connect your exchange account to enable auto-trading.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Select Exchange</Label>
                <Select defaultValue="binance">
                  <SelectTrigger>
                    <SelectValue placeholder="Select exchange" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="binance">Binance</SelectItem>
                    <SelectItem value="bybit">Bybit</SelectItem>
                    <SelectItem value="kucoin">KuCoin</SelectItem>
                    <SelectItem value="bitget">Bitget</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>API Key</Label>
                <div className="relative">
                  <Input type="password" value="sk_live_xxxxxxxxxxxxxxxx" className="pl-10 font-mono" readOnly />
                  <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>API Secret</Label>
                <Input type="password" value="xxxxxxxxxxxxxxxxxxxxxxxx" className="font-mono" readOnly />
              </div>

              <div className="pt-4 flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle2 className="h-4 w-4" />
                Connection Verified
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Alerts
              </CardTitle>
              <CardDescription>Where should the bot send trade updates?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                    <div className="space-y-1">
                        <Label>Telegram Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive instant alerts for buy/sell signals.</p>
                    </div>
                    <Button variant="outline" size="sm">Connect Telegram</Button>
                </div>
                
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                    <div className="space-y-1">
                        <Label>Email Reports</Label>
                        <p className="text-sm text-muted-foreground">Daily performance summaries.</p>
                    </div>
                    <Input className="w-64" placeholder="user@example.com" />
                </div>

                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <Label>Mobile Push</Label>
                        <p className="text-sm text-muted-foreground">Push notifications to the mobile app.</p>
                    </div>
                    <Button variant="secondary" disabled><Smartphone className="mr-2 h-4 w-4" /> Coming Soon</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
