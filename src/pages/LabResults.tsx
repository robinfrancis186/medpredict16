import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  Plus, 
  TestTube, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertTriangle,
  Search,
  Filter
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

interface Patient {
  id: string;
  name: string;
}

interface LabTestType {
  id: string;
  name: string;
  code: string;
  unit: string;
  category: string;
  min_normal: number | null;
  max_normal: number | null;
  critical_low: number | null;
  critical_high: number | null;
  description: string | null;
}

interface LabResult {
  id: string;
  patient_id: string;
  test_type_id: string;
  value: number;
  unit: string;
  status: string;
  notes: string | null;
  collected_at: string;
  resulted_at: string | null;
  created_at: string;
  lab_test_types?: LabTestType;
  patients?: { name: string };
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'critical_low':
    case 'critical_high':
      return 'bg-destructive text-destructive-foreground';
    case 'low':
    case 'high':
      return 'bg-risk-medium/20 text-risk-medium';
    default:
      return 'bg-chart-2/20 text-chart-2';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'low':
    case 'critical_low':
      return <TrendingDown className="h-4 w-4" />;
    case 'high':
    case 'critical_high':
      return <TrendingUp className="h-4 w-4" />;
    default:
      return <Minus className="h-4 w-4" />;
  }
};

const calculateStatus = (value: number, testType: LabTestType): string => {
  if (testType.critical_low !== null && value < testType.critical_low) return 'critical_low';
  if (testType.critical_high !== null && value > testType.critical_high) return 'critical_high';
  if (testType.min_normal !== null && value < testType.min_normal) return 'low';
  if (testType.max_normal !== null && value > testType.max_normal) return 'high';
  return 'normal';
};

export default function LabResults() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [testTypes, setTestTypes] = useState<LabTestType[]>([]);
  const [results, setResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedTestType, setSelectedTestType] = useState('');
  const [testValue, setTestValue] = useState('');
  const [notes, setNotes] = useState('');
  const [filterPatient, setFilterPatient] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResultForTrend, setSelectedResultForTrend] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<LabResult[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const { createNotification } = useNotifications();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedResultForTrend) {
      fetchTrendData();
    }
  }, [selectedResultForTrend]);

  const fetchData = async () => {
    setLoading(true);
    
    const [patientsRes, testTypesRes, resultsRes] = await Promise.all([
      supabase.from('patients').select('id, name').order('name'),
      supabase.from('lab_test_types').select('*').order('category, name'),
      supabase.from('lab_results').select(`
        *,
        lab_test_types(*),
        patients:patient_id(name)
      `).order('collected_at', { ascending: false }).limit(100)
    ]);

    setPatients(patientsRes.data || []);
    setTestTypes(testTypesRes.data || []);
    setResults(resultsRes.data || []);
    setLoading(false);
  };

  const fetchTrendData = async () => {
    const result = results.find(r => r.id === selectedResultForTrend);
    if (!result) return;

    const { data } = await supabase
      .from('lab_results')
      .select('*, lab_test_types(*)')
      .eq('patient_id', result.patient_id)
      .eq('test_type_id', result.test_type_id)
      .order('collected_at', { ascending: true })
      .limit(20);

    setTrendData(data || []);
  };

  const handleAddResult = async () => {
    if (!selectedPatient || !selectedTestType || !testValue) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const testType = testTypes.find(t => t.id === selectedTestType);
    if (!testType) return;

    const numValue = parseFloat(testValue);
    const status = calculateStatus(numValue, testType);

    const { error } = await supabase.from('lab_results').insert({
      patient_id: selectedPatient,
      test_type_id: selectedTestType,
      value: numValue,
      unit: testType.unit,
      status,
      notes: notes || null,
      ordered_by: user?.id,
      resulted_at: new Date().toISOString()
    });

    if (error) {
      console.error('Error adding lab result:', error);
      toast({
        title: "Error",
        description: "Failed to add lab result",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Lab Result Added",
        description: `${testType.name}: ${numValue} ${testType.unit}`
      });

      // Create notification for critical values
      if (status.includes('critical')) {
        const patient = patients.find(p => p.id === selectedPatient);
        if (user) {
          await createNotification(
            user.id,
            'Critical Lab Value Alert',
            `${patient?.name}'s ${testType.name} is ${status === 'critical_high' ? 'critically high' : 'critically low'} at ${numValue} ${testType.unit}`,
            'test_result',
            selectedPatient
          );
        }
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    }
  };

  const resetForm = () => {
    setSelectedPatient('');
    setSelectedTestType('');
    setTestValue('');
    setNotes('');
  };

  const categories = [...new Set(testTypes.map(t => t.category))];

  const filteredResults = results.filter(result => {
    if (filterPatient !== 'all' && result.patient_id !== filterPatient) return false;
    if (filterCategory !== 'all' && result.lab_test_types?.category !== filterCategory) return false;
    if (filterStatus !== 'all') {
      if (filterStatus === 'abnormal' && result.status === 'normal') return false;
      if (filterStatus === 'critical' && !result.status.includes('critical')) return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTest = result.lab_test_types?.name.toLowerCase().includes(query);
      const matchesPatient = result.patients?.name.toLowerCase().includes(query);
      if (!matchesTest && !matchesPatient) return false;
    }
    return true;
  });

  const selectedTestTypeData = testTypes.find(t => t.id === selectedTestType);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Lab Results</h1>
            <p className="text-muted-foreground">Manage lab test results with reference ranges and trend analysis</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Result
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add Lab Result</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Patient</Label>
                  <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map(patient => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Test Type</Label>
                  <Select value={selectedTestType} onValueChange={setSelectedTestType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select test" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <div key={category}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{category}</div>
                          {testTypes.filter(t => t.category === category).map(test => (
                            <SelectItem key={test.id} value={test.id}>
                              {test.name} ({test.code})
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTestTypeData && (
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <p className="font-medium">{selectedTestTypeData.name}</p>
                    <p className="text-muted-foreground">{selectedTestTypeData.description}</p>
                    <p className="mt-1">
                      Normal range: {selectedTestTypeData.min_normal} - {selectedTestTypeData.max_normal} {selectedTestTypeData.unit}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Value {selectedTestTypeData && `(${selectedTestTypeData.unit})`}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={testValue}
                    onChange={(e) => setTestValue(e.target.value)}
                    placeholder="Enter result value"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes..."
                  />
                </div>

                <Button className="w-full" onClick={handleAddResult}>
                  Add Lab Result
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tests or patients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={filterPatient} onValueChange={setFilterPatient}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Patients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Patients</SelectItem>
                  {patients.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="abnormal">Abnormal Only</SelectItem>
                  <SelectItem value="critical">Critical Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-[1fr_400px] gap-6">
          {/* Results List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Recent Results
              </CardTitle>
              <CardDescription>
                {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading results...</div>
              ) : filteredResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No lab results found</div>
              ) : (
                <div className="space-y-3">
                  {filteredResults.map(result => (
                    <div
                      key={result.id}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50",
                        selectedResultForTrend === result.id && "ring-2 ring-primary"
                      )}
                      onClick={() => setSelectedResultForTrend(result.id)}
                    >
                      <div className={cn("p-2 rounded-full", getStatusColor(result.status))}>
                        {getStatusIcon(result.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{result.lab_test_types?.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {result.lab_test_types?.code}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {result.patients?.name} • {format(new Date(result.collected_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-semibold">
                          {result.value} <span className="text-muted-foreground">{result.unit}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Range: {result.lab_test_types?.min_normal}-{result.lab_test_types?.max_normal}
                        </p>
                      </div>
                      <Badge className={getStatusColor(result.status)}>
                        {result.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trend Analysis
              </CardTitle>
              <CardDescription>
                {selectedResultForTrend 
                  ? `${trendData[0]?.lab_test_types?.name || 'Test'} over time`
                  : 'Select a result to view trends'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedResultForTrend && trendData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="collected_at" 
                        tickFormatter={(val) => format(new Date(val), 'MM/dd')}
                        className="text-xs"
                      />
                      <YAxis className="text-xs" />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload?.length) {
                            const data = payload[0].payload as LabResult;
                            return (
                              <div className="bg-popover border rounded-lg p-3 shadow-lg">
                                <p className="font-medium">{data.lab_test_types?.name}</p>
                                <p className="text-lg font-mono">{data.value} {data.unit}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(data.collected_at), 'PPp')}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      {trendData[0]?.lab_test_types?.min_normal && trendData[0]?.lab_test_types?.max_normal && (
                        <ReferenceArea
                          y1={trendData[0].lab_test_types.min_normal}
                          y2={trendData[0].lab_test_types.max_normal}
                          fill="hsl(var(--chart-2))"
                          fillOpacity={0.1}
                        />
                      )}
                      {trendData[0]?.lab_test_types?.min_normal && (
                        <ReferenceLine 
                          y={trendData[0].lab_test_types.min_normal} 
                          stroke="hsl(var(--chart-2))"
                          strokeDasharray="5 5"
                          label={{ value: 'Min', position: 'left', fontSize: 10 }}
                        />
                      )}
                      {trendData[0]?.lab_test_types?.max_normal && (
                        <ReferenceLine 
                          y={trendData[0].lab_test_types.max_normal} 
                          stroke="hsl(var(--chart-2))"
                          strokeDasharray="5 5"
                          label={{ value: 'Max', position: 'left', fontSize: 10 }}
                        />
                      )}
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Select a lab result to view historical trends</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
