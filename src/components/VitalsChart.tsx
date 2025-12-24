import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Heart, Thermometer, Wind } from 'lucide-react';

interface VitalRecord {
  id: string;
  recorded_at: string;
  spo2: number | null;
  temperature: number | null;
  heart_rate: number | null;
  respiratory_rate: number | null;
}

interface VitalsChartProps {
  vitals: VitalRecord[];
}

export function VitalsChart({ vitals }: VitalsChartProps) {
  // Format data for charts
  const chartData = vitals
    .slice()
    .reverse()
    .map((v) => ({
      date: new Date(v.recorded_at).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      spO2: v.spo2,
      temperature: v.temperature,
      heartRate: v.heart_rate,
      respiratoryRate: v.respiratory_rate,
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-semibold">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (vitals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Vitals History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No vitals data available for charting
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Vitals History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="spo2">SpO₂</TabsTrigger>
            <TabsTrigger value="heart">Heart Rate</TabsTrigger>
            <TabsTrigger value="temp">Temperature</TabsTrigger>
            <TabsTrigger value="resp">Respiratory</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs fill-muted-foreground"
                  tick={{ fontSize: 10 }}
                />
                <YAxis className="text-xs fill-muted-foreground" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="spO2"
                  name="SpO₂ (%)"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="heartRate"
                  name="Heart Rate (bpm)"
                  stroke="hsl(var(--chart-5))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="spo2" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis domain={[85, 100]} tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="spO2"
                  name="SpO₂ (%)"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ r: 5, fill: 'hsl(var(--primary))' }}
                  activeDot={{ r: 8 }}
                />
                {/* Reference line for normal range */}
                <Line
                  type="monotone"
                  dataKey={() => 94}
                  stroke="hsl(var(--risk-medium))"
                  strokeDasharray="5 5"
                  strokeWidth={1}
                  name="Low Threshold"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
              <Activity className="w-3 h-3" />
              Normal SpO₂: 95-100% | Dashed line indicates low threshold (94%)
            </p>
          </TabsContent>

          <TabsContent value="heart" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis domain={[40, 140]} tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="heartRate"
                  name="Heart Rate (bpm)"
                  stroke="hsl(var(--chart-5))"
                  strokeWidth={3}
                  dot={{ r: 5, fill: 'hsl(var(--chart-5))' }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
              <Heart className="w-3 h-3" />
              Normal Heart Rate: 60-100 bpm
            </p>
          </TabsContent>

          <TabsContent value="temp" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis domain={[35, 40]} tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  name="Temperature (°C)"
                  stroke="hsl(var(--chart-4))"
                  strokeWidth={3}
                  dot={{ r: 5, fill: 'hsl(var(--chart-4))' }}
                  activeDot={{ r: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey={() => 38}
                  stroke="hsl(var(--risk-high))"
                  strokeDasharray="5 5"
                  strokeWidth={1}
                  name="Fever Threshold"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
              <Thermometer className="w-3 h-3" />
              Normal Temperature: 36.1-37.2°C | Dashed line indicates fever threshold (38°C)
            </p>
          </TabsContent>

          <TabsContent value="resp" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis domain={[8, 30]} tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="respiratoryRate"
                  name="Respiratory Rate (/min)"
                  stroke="hsl(var(--secondary))"
                  strokeWidth={3}
                  dot={{ r: 5, fill: 'hsl(var(--secondary))' }}
                  activeDot={{ r: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey={() => 20}
                  stroke="hsl(var(--risk-medium))"
                  strokeDasharray="5 5"
                  strokeWidth={1}
                  name="High Threshold"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
              <Wind className="w-3 h-3" />
              Normal Respiratory Rate: 12-20 /min
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
