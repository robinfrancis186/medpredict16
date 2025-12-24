import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ClinicalDisclaimer } from '@/components/ClinicalDisclaimer';
import { VitalsChart } from '@/components/VitalsChart';
import { PatientSelfRegistration } from '@/components/PatientSelfRegistration';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { 
  User, 
  Calendar, 
  FileText, 
  TestTube, 
  Activity,
  Clock,
  LogOut,
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  ClockIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PatientData {
  id: string;
  patient_id: string;
  name: string;
  age: number;
  gender: string;
  blood_group: string;
  allergies: string[];
  chronic_conditions: string[];
  approval_status: string;
}

interface Appointment {
  id: string;
  scheduled_at: string;
  department: string;
  status: string;
  notes: string | null;
}

interface LabResult {
  id: string;
  value: number;
  unit: string;
  status: string;
  collected_at: string;
  lab_test_types: {
    name: string;
    code: string;
    min_normal: number | null;
    max_normal: number | null;
  };
}

interface MedicalRecord {
  id: string;
  title: string;
  type: string;
  date: string;
  hospital: string | null;
}

interface Vital {
  id: string;
  heart_rate: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  temperature: number | null;
  spo2: number | null;
  respiratory_rate: number | null;
  recorded_at: string;
}

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

export default function PatientPortal() {
  const { user, profile, signOut } = useAuth();
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [loading, setLoading] = useState(true);
  const [wasAutoLinked, setWasAutoLinked] = useState(false);
  const hasShownToast = useRef(false);

  useEffect(() => {
    if (user) {
      fetchPatientData();
    }
  }, [user]);

  // Show success toast when auto-linked - must be before any early returns
  useEffect(() => {
    if (wasAutoLinked && patientData && !hasShownToast.current) {
      hasShownToast.current = true;
      toast.success('Account Linked Successfully!', {
        description: `Your account has been connected to your patient record. You now have access to your medical records, appointments, lab results, and vitals.`,
        duration: 6000,
      });
    }
  }, [wasAutoLinked, patientData]);

  const fetchPatientData = async () => {
    if (!user) return;
    setLoading(true);

    // First try to find patient linked by user ID
    let { data: patientRecord } = await supabase
      .from('patients')
      .select('*')
      .eq('created_by', user.id)
      .maybeSingle();

    // If not found, try to find by email and link it
    if (!patientRecord && user.email) {
      const { data: patientByEmail } = await supabase
        .from('patients')
        .select('*')
        .ilike('email', user.email)
        .is('created_by', null)
        .maybeSingle();

      if (patientByEmail && patientByEmail.approval_status === 'approved') {
        // Link this patient to the current user
        const { error } = await supabase
          .from('patients')
          .update({ created_by: user.id })
          .eq('id', patientByEmail.id);

        if (!error) {
          patientRecord = { ...patientByEmail, created_by: user.id };
          setWasAutoLinked(true);
        }
      }
    }

    if (patientRecord) {
      setPatientData(patientRecord);

      // Fetch related data in parallel
      const [appointmentsRes, labResultsRes, recordsRes, vitalsRes] = await Promise.all([
        supabase
          .from('appointments')
          .select('*')
          .eq('patient_id', patientRecord.id)
          .gte('scheduled_at', new Date().toISOString())
          .order('scheduled_at')
          .limit(10),
        supabase
          .from('lab_results')
          .select('*, lab_test_types(*)')
          .eq('patient_id', patientRecord.id)
          .order('collected_at', { ascending: false })
          .limit(20),
        supabase
          .from('medical_records')
          .select('*')
          .eq('patient_id', patientRecord.id)
          .order('date', { ascending: false })
          .limit(20),
        supabase
          .from('vitals')
          .select('*')
          .eq('patient_id', patientRecord.id)
          .order('recorded_at', { ascending: false })
          .limit(30)
      ]);

      setAppointments(appointmentsRes.data || []);
      setLabResults(labResultsRes.data || []);
      setMedicalRecords(recordsRes.data || []);
      setVitals(vitalsRes.data || []);
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/auth';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <ShieldCheck className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading your health records...</p>
        </div>
      </div>
    );
  }

  if (!patientData) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-foreground">MedPredict</h1>
                <p className="text-xs text-muted-foreground">Patient Portal</p>
              </div>
            </div>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-6 py-12">
          <PatientSelfRegistration onSuccess={fetchPatientData} />
        </main>
      </div>
    );
  }

  // Show pending status
  if (patientData.approval_status === 'pending') {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-foreground">MedPredict</h1>
                <p className="text-xs text-muted-foreground">Patient Portal</p>
              </div>
            </div>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-6 py-12">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <ClockIcon className="h-12 w-12 text-risk-medium mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Registration Pending</h2>
              <p className="text-muted-foreground mb-4">
                Your patient registration is being reviewed by our healthcare staff. You'll have full access once approved.
              </p>
              <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">{patientData.name}</p>
                <p className="font-mono text-xs">{patientData.patient_id}</p>
              </div>
              <Button variant="outline" onClick={handleLogout} className="mt-4">
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const latestVital = vitals[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">MedPredict</h1>
              <p className="text-xs text-muted-foreground">Patient Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{patientData.name}</p>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Welcome Card */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">Welcome, {patientData.name.split(' ')[0]}!</h2>
                <p className="text-muted-foreground">Here's an overview of your health records</p>
                <div className="flex flex-wrap gap-4 mt-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Badge variant="secondary" className="font-mono">{patientData.patient_id}</Badge>
                  </span>
                  <span className="flex items-center gap-1">
                    <Badge variant="outline">{patientData.age} years</Badge>
                  </span>
                  <span className="flex items-center gap-1">
                    <Badge variant="outline">{patientData.gender}</Badge>
                  </span>
                  <span className="flex items-center gap-1">
                    <Badge variant="outline">Blood: {patientData.blood_group}</Badge>
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{appointments.length}</p>
                  <p className="text-sm text-muted-foreground">Upcoming Appointments</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-chart-2/10">
                  <TestTube className="h-5 w-5 text-chart-2" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{labResults.length}</p>
                  <p className="text-sm text-muted-foreground">Lab Results</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-chart-3/10">
                  <FileText className="h-5 w-5 text-chart-3" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{medicalRecords.length}</p>
                  <p className="text-sm text-muted-foreground">Medical Records</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-chart-4/10">
                  <Activity className="h-5 w-5 text-chart-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{latestVital?.heart_rate || '--'}</p>
                  <p className="text-sm text-muted-foreground">Last Heart Rate (bpm)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="appointments" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="appointments" className="gap-2">
              <Calendar className="h-4 w-4" />
              Appointments
            </TabsTrigger>
            <TabsTrigger value="lab-results" className="gap-2">
              <TestTube className="h-4 w-4" />
              Lab Results
            </TabsTrigger>
            <TabsTrigger value="records" className="gap-2">
              <FileText className="h-4 w-4" />
              Records
            </TabsTrigger>
            <TabsTrigger value="vitals" className="gap-2">
              <Activity className="h-4 w-4" />
              Vitals
            </TabsTrigger>
          </TabsList>

          {/* Appointments Tab */}
          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
                <CardDescription>Your scheduled visits and consultations</CardDescription>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No upcoming appointments scheduled</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map(apt => (
                      <div key={apt.id} className="flex items-center gap-4 p-4 rounded-lg border">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{apt.department}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(apt.scheduled_at), 'EEEE, MMMM d, yyyy')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {format(new Date(apt.scheduled_at), 'h:mm a')}
                          </p>
                        </div>
                        <Badge className={cn(
                          apt.status === 'confirmed' ? 'bg-chart-2/20 text-chart-2' :
                          apt.status === 'cancelled' ? 'bg-destructive/20 text-destructive' :
                          'bg-primary/20 text-primary'
                        )}>
                          {apt.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lab Results Tab */}
          <TabsContent value="lab-results">
            <Card>
              <CardHeader>
                <CardTitle>Lab Test Results</CardTitle>
                <CardDescription>Your recent laboratory test results with reference ranges</CardDescription>
              </CardHeader>
              <CardContent>
                {labResults.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <TestTube className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No lab results available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {labResults.map(result => (
                      <div key={result.id} className="flex items-center gap-4 p-4 rounded-lg border">
                        <div className={cn("p-2 rounded-full", getStatusColor(result.status))}>
                          {getStatusIcon(result.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{result.lab_test_types.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {result.lab_test_types.code}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(result.collected_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-semibold">
                            {result.value} <span className="text-muted-foreground">{result.unit}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Range: {result.lab_test_types.min_normal}-{result.lab_test_types.max_normal}
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
          </TabsContent>

          {/* Records Tab */}
          <TabsContent value="records">
            <Card>
              <CardHeader>
                <CardTitle>Medical Records</CardTitle>
                <CardDescription>Your medical history and documents</CardDescription>
              </CardHeader>
              <CardContent>
                {medicalRecords.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No medical records available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {medicalRecords.map(record => (
                      <div key={record.id} className="flex items-center gap-4 p-4 rounded-lg border">
                        <div className="p-3 rounded-lg bg-muted">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{record.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {record.hospital && `${record.hospital} • `}
                            {format(new Date(record.date), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {record.type.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vitals Tab */}
          <TabsContent value="vitals">
            <Card>
              <CardHeader>
                <CardTitle>Vitals History</CardTitle>
                <CardDescription>Your vital signs over time</CardDescription>
              </CardHeader>
              <CardContent>
                {vitals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No vitals recorded yet</p>
                  </div>
                ) : (
                  <VitalsChart vitals={vitals} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Health Alerts */}
        {(patientData.allergies?.length > 0 || patientData.chronic_conditions?.length > 0) && (
          <Card className="border-risk-medium/50 bg-risk-medium/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-risk-medium">
                <AlertCircle className="h-5 w-5" />
                Health Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {patientData.allergies?.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Allergies</p>
                  <div className="flex flex-wrap gap-2">
                    {patientData.allergies.map((allergy, i) => (
                      <Badge key={i} variant="destructive">{allergy}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {patientData.chronic_conditions?.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Chronic Conditions</p>
                  <div className="flex flex-wrap gap-2">
                    {patientData.chronic_conditions.map((condition, i) => (
                      <Badge key={i} variant="outline">{condition}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <ClinicalDisclaimer variant="footer" />
      </main>
    </div>
  );
}
