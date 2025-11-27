import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const data = [
  { day: "Day 1", balance: 100 },
  { day: "Day 2", balance: 101.5 },
  { day: "Day 3", balance: 103.2 },
  { day: "Day 4", balance: 104.8 },
  { day: "Day 5", balance: 106.5 },
  { day: "Day 6", balance: 108.1 },
  { day: "Day 7", balance: 110.3 },
];

export function PerformanceChart() {
  return (
    <Card className="h-full bg-card/50 backdrop-blur-sm border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium text-muted-foreground">
          Account Growth Protocol
        </CardTitle>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/50 animate-pulse">
          +10.3% TOTAL
        </Badge>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.2} vertical={false} />
            <XAxis 
              dataKey="day" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(value) => `$${value}`} 
              domain={['dataMin - 1', 'dataMax + 1']}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--foreground))'
              }}
              itemStyle={{ color: 'hsl(var(--primary))' }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, "Balance"]}
            />
            <Area 
              type="monotone" 
              dataKey="balance" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorBalance)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
