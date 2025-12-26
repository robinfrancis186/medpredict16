import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { format } from 'date-fns';

interface LabTestType {
  id: string;
  name: string;
  code: string;
  unit: string;
  min_normal: number | null;
  max_normal: number | null;
  critical_low: number | null;
  critical_high: number | null;
}

interface LabResult {
  id: string;
  patient_id: string;
  test_type_id: string;
  value: number;
  unit: string;
  status: string;
  collected_at: string;
  lab_test_types?: LabTestType;
}

interface EnhancedLabPanelProps {
  patientId: string;
  onAbnormalDetected?: (count: number) => void;
}

export function EnhancedLabPanel({ patientId, onAbnormalDetected }: EnhancedLabPanelProps) {
  const [results, setResults] = useState<LabResult[]>([]);
  const [testTypes, setTestTypes] = useState<LabTestType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<LabResult[]>([]);

  useEffect(() => {
    fetchData();
  }, [patientId]);

  useEffect(() => {
    if (selectedTest) {
      const filtered = results.filter(r => r.test_type_id === selectedTest);
      setTrendData(filtered.sort((a, b) => new Date(a.collected_at).getTime() - new Date(b.collected_at).getTime()));
    }
  }, [selectedTest, results]);

  const fetchData = async () => {
    setIsLoading(true);
    const [typesRes, resultsRes] = await Promise.all([
      supabase.from('lab_test_types').select('*'),
      supabase
        .from('lab_results')
        .select('*, lab_test_types(*)')
        .eq('patient_id', patientId)
        .order('collected_at', { ascending: false })
    ]);

    setTestTypes(typesRes.data || []);
    setResults(resultsRes.data || []);
    
    const abnormalCount = (resultsRes.data || []).filter(r => r.status !== 'normal').length;
    onAbnormalDetected?.(abnormalCount);
    
    setIsLoading(false);
  };

  const simulateLISSync = useCallback(async () => {
    setIsSyncing(true);
    
    // Simulate incoming LIS data
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate mock new results
    const randomTestType = testTypes[Math.floor(Math.random() * testTypes.length)];
    if (randomTestType) {
      const baseValue = (randomTestType.min_normal || 0) + (randomTestType.max_normal || 100) / 2;
      const variation = Math.random() * 0.4 - 0.2; // ±20% variation
      const newValue = baseValue * (1 + variation);
      
      let status = 'normal';
      if (randomTestType.critical_low && newValue < randomTestType.critical_low) status = 'critical_low';
      else if (randomTestType.critical_high && newValue > randomTestType.critical_high) status = 'critical_high';
      else if (randomTestType.min_normal && newValue < randomTestType.min_normal) status = 'low';
      else if (randomTestType.max_normal && newValue > randomTestType.max_normal) status = 'high';

      const { error } = await supabase.from('lab_results').insert({
        patient_id: patientId,
        test_type_id: randomTestType.id,
        value: Math.round(newValue * 100) / 100,
        unit: randomTestType.unit,
        status,
        resulted_at: new Date().toISOString()
      });

      if (!error) {
        toast.success('LIS Sync Complete', {
          description: `New ${randomTestType.name} result received${status !== 'normal' ? ' - ABNORMAL VALUE' : ''}`
        });
        await fetchData();
      }
    }
    
    setIsSyncing(false);
  }, [patientId, testTypes]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical_low':
      case 'low':
        return <TrendingDown className="w-4 h-4" />;
      case 'critical_high':
      case 'high':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical_low':
      case 'critical_high':
        return 'bg-destructive text-destructive-foreground';
      case 'low':
      case 'high':
        return 'bg-amber-500/20 text-amber-600';
      default:
        return 'bg-green-500/20 text-green-600';
    }
  };

  // Group results by test type for the latest of each
  const latestByType = results.reduce((acc, result) => {
    if (!acc[result.test_type_id] || new Date(result.collected_at) > new Date(acc[result.test_type_id].collected_at)) {
      acc[result.test_type_id] = result;
    }
    return acc;
  }, {} as Record<string, LabResult>);

  const abnormalResults = Object.values(latestByType).filter(r => r.status !== 'normal');
  const criticalResults = abnormalResults.filter(r => r.status.includes('critical'));

  const selectedTestType = selectedTest ? testTypes.find(t => t.id === selectedTest) : null;

  return (
    <div className="space-y-4">
      {/* Header with Sync Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Lab Results Integration</h3>
          <p className="text-sm text-muted-foreground">Auto-sync with Laboratory Information System</p>
        </div>
        <Button 
          variant="outline" 
          onClick={simulateLISSync} 
          disabled={isSyncing}
          className="gap-2"
        >
          <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
          {isSyncing ? 'Syncing...' : 'Sync LIS'}
        </Button>
      </div>

      {/* Alert Summary */}
      {criticalResults.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">
                  {criticalResults.length} Critical Value{criticalResults.length !== 1 ? 's' : ''} Detected
                </p>
                <p className="text-sm text-muted-foreground">
                  {criticalResults.map(r => r.lab_test_types?.name).join(', ')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Grid */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            Loading lab results...
          </div>
        ) : Object.values(latestByType).length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No lab results available
          </div>
        ) : (
          Object.values(latestByType).map(result => {
            const testType = result.lab_test_types;
            if (!testType) return null;
            
            const isSelected = selectedTest === result.test_type_id;
            const normalRange = testType.max_normal && testType.min_normal 
              ? testType.max_normal - testType.min_normal 
              : 100;
            const valuePosition = testType.min_normal !== null && testType.max_normal !== null
              ? Math.min(100, Math.max(0, ((result.value - testType.min_normal) / normalRange) * 100))
              : 50;

            return (
              <Card 
                key={result.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  isSelected && "ring-2 ring-primary",
                  result.status.includes('critical') && "border-destructive/50"
                )}
                onClick={() => setSelectedTest(isSelected ? null : result.test_type_id)}
              >
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{testType.name}</p>
                      <p className="text-xs text-muted-foreground">{testType.code}</p>
                    </div>
                    <Badge className={getStatusColor(result.status)}>
                      {getStatusIcon(result.status)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-mono">{result.value}</span>
                    <span className="text-sm text-muted-foreground">{result.unit}</span>
                  </div>
                  
                  {/* Visual Range Indicator */}
                  <div className="space-y-1">
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      {/* Normal range */}
                      <div 
                        className="absolute h-full bg-green-500/30"
                        style={{ left: '20%', right: '20%' }}
                      />
                      {/* Value marker */}
                      <div 
                        className={cn(
                          "absolute w-2 h-2 rounded-full top-0 -translate-x-1/2",
                          result.status === 'normal' ? "bg-green-500" : 
                          result.status.includes('critical') ? "bg-destructive" : "bg-amber-500"
                        )}
                        style={{ left: `${valuePosition}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{testType.min_normal ?? 'Low'}</span>
                      <span>{testType.max_normal ?? 'High'}</span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(result.collected_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Trend Chart */}
      {selectedTest && trendData.length > 1 && selectedTestType && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4" />
              {selectedTestType.name} Trend
            </CardTitle>
            <CardDescription>Historical values over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="collected_at" 
                    tickFormatter={(v) => format(new Date(v), 'MM/dd')}
                    className="text-xs"
                  />
                  <YAxis 
                    domain={['auto', 'auto']}
                    className="text-xs"
                  />
                  <Tooltip 
                    labelFormatter={(v) => format(new Date(v), 'MMM d, yyyy')}
                    formatter={(value: number) => [`${value} ${selectedTestType.unit}`, selectedTestType.name]}
                  />
                  {selectedTestType.min_normal !== null && selectedTestType.max_normal !== null && (
                    <ReferenceArea 
                      y1={selectedTestType.min_normal} 
                      y2={selectedTestType.max_normal} 
                      fill="hsl(var(--chart-2))" 
                      fillOpacity={0.1}
                    />
                  )}
                  {selectedTestType.min_normal !== null && (
                    <ReferenceLine 
                      y={selectedTestType.min_normal} 
                      stroke="hsl(var(--chart-2))" 
                      strokeDasharray="5 5"
                      label={{ value: 'Low', position: 'insideLeft', fontSize: 10 }}
                    />
                  )}
                  {selectedTestType.max_normal !== null && (
                    <ReferenceLine 
                      y={selectedTestType.max_normal} 
                      stroke="hsl(var(--chart-2))" 
                      strokeDasharray="5 5"
                      label={{ value: 'High', position: 'insideLeft', fontSize: 10 }}
                    />
                  )}
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
