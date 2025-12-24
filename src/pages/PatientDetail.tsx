import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RiskBadge } from '@/components/RiskBadge';
import { ClinicalDisclaimer } from '@/components/ClinicalDisclaimer';
import { VitalsChart } from '@/components/VitalsChart';
import { PatientLinkDialog } from '@/components/PatientLinkDialog';
import { PatientEditDialog } from '@/components/PatientEditDialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { generateAnalysisReport, downloadPdf } from '@/lib/pdfGenerator';
import { toast } from 'sonner';
import {
  ArrowLeft,
  User,
  Phone,
  Droplets,
  AlertTriangle,
  Activity,
  FileText,
  Scan,
  Clock,
  Heart,
  Thermometer,
  Wind,
  Download,
  Share2,
  Calendar,
  Loader2,
  Pencil,
  TrendingUp,
  Link2,
} from 'lucide-react';

interface Patient {
  id: string;
  patient_id: string | null;
  name: string;
  age: number;
  gender: string;
  blood_group: string;
  emergency_contact: string;
  allergies: string[];
  chronic_conditions: string[];
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
}

interface Vitals {
  id: string;
  patient_id: string;
  recorded_at: string;
  spo2: number | null;
  temperature: number | null;
  heart_rate: number | null;
  respiratory_rate: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  smoking_history: boolean | null;
}

interface MedicalScan {
  id: string;
  patient_id: string;
  scan_type: string;
  diagnosis_probability: number | null;
  abnormality_score: number | null;
  confidence_score: number | null;
  inference_time: number | null;
  risk_level: string | null;
  ai_explanation: string | null;
  ai_factors: string[] | null;
  created_at: string;
}

interface MedicalRecord {
  id: string;
  patient_id: string;
  type: string;
  title: string;
  date: string;
  hospital: string | null;
  notes: string | null;
}

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [vitals, setVitals] = useState<Vitals[]>([]);
  const [scans, setScans] = useState<MedicalScan[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setIsLoading(true);

      try {
        // Fetch patient
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (patientError) throw patientError;
        setPatient(patientData);

        // Fetch vitals
        const { data: vitalsData } = await supabase
          .from('vitals')
          .select('*')
          .eq('patient_id', id)
          .order('recorded_at', { ascending: false })
          .limit(20);
        setVitals(vitalsData || []);

        // Fetch scans
        const { data: scansData } = await supabase
          .from('medical_scans')
          .select('*')
          .eq('patient_id', id)
          .order('created_at', { ascending: false });
        setScans(scansData || []);

        // Fetch records
        const { data: recordsData } = await supabase
          .from('medical_records')
          .select('*')
          .eq('patient_id', id)
          .order('date', { ascending: false });
        setRecords(recordsData || []);
      } catch (error) {
        console.error('Error fetching patient data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const latestVitals = vitals[0];
  const latestScan = scans[0];

  // Calculate risk assessment
  const calculateRisk = () => {
    let score = 0;
    const factors: string[] = [];

    if (latestVitals) {
      if (latestVitals.spo2 && latestVitals.spo2 < 94) {
        score += 30;
        factors.push('Low oxygen saturation');
      }
      if (latestVitals.temperature && latestVitals.temperature > 38) {
        score += 20;
        factors.push('Elevated temperature');
      }
      if (latestVitals.heart_rate && (latestVitals.heart_rate > 100 || latestVitals.heart_rate < 60)) {
        score += 15;
        factors.push('Abnormal heart rate');
      }
      if (latestVitals.smoking_history) {
        score += 15;
        factors.push('Smoking history');
      }
    }

    if (latestScan) {
      if (latestScan.diagnosis_probability && latestScan.diagnosis_probability > 0.7) {
        score += 30;
        factors.push('High AI diagnosis probability');
      }
    }

    if (patient) {
      if (patient.chronic_conditions.length > 0) {
        score += 10;
        factors.push('Chronic conditions present');
      }
    }

    const overallRisk: 'low' | 'medium' | 'high' = score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low';
    const explanation = overallRisk === 'high'
      ? 'High risk detected. Immediate clinical review recommended.'
      : overallRisk === 'medium'
      ? 'Moderate risk. Follow-up assessment advised.'
      : 'Low risk. Continue standard monitoring.';

    return { overallRisk, fusedScore: Math.min(score, 100), explanation, factors };
  };

  const risk = calculateRisk();

  const handleExportPdf = async () => {
    if (!patient) return;
    setIsGeneratingPdf(true);

    try {
      const doc = generateAnalysisReport(
        {
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          bloodGroup: patient.blood_group,
          allergies: patient.allergies,
          chronicConditions: patient.chronic_conditions,
        },
        latestVitals ? {
          spO2: latestVitals.spo2 || 0,
          temperature: Number(latestVitals.temperature) || 0,
          heartRate: latestVitals.heart_rate || 0,
          respiratoryRate: latestVitals.respiratory_rate || 0,
          bloodPressureSystolic: latestVitals.blood_pressure_systolic || 0,
          bloodPressureDiastolic: latestVitals.blood_pressure_diastolic || 0,
          smokingHistory: latestVitals.smoking_history || false,
          recordedAt: latestVitals.recorded_at,
        } : null,
        latestScan ? {
          scanType: latestScan.scan_type,
          diagnosisProbability: Number(latestScan.diagnosis_probability) || 0,
          abnormalityScore: Number(latestScan.abnormality_score) || 0,
          confidenceScore: Number(latestScan.confidence_score) || 0,
          inferenceTime: Number(latestScan.inference_time) || 0,
          riskLevel: latestScan.risk_level || 'unknown',
          aiExplanation: latestScan.ai_explanation || '',
          aiFactors: latestScan.ai_factors || [],
          createdAt: latestScan.created_at,
        } : null,
        risk,
        profile?.full_name || 'Medical Staff'
      );

      downloadPdf(doc, `${patient.name.replace(/\s+/g, '_')}_medical_report_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Report exported', { description: 'PDF downloaded successfully.' });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to export', { description: 'Please try again.' });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!patient) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Patient not found</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link to="/patients">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Patients
            </Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/patients">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-display font-bold text-foreground">{patient.name}</h1>
            <p className="text-muted-foreground font-mono">{patient.patient_id || 'ID pending'}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowLinkDialog(true)}>
              <Link2 className="w-4 h-4 mr-2" />
              Link Account
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
              disabled={isGeneratingPdf}
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Export PDF
            </Button>
          </div>
        </div>

        {/* Patient Edit Dialog */}
        <PatientEditDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          patient={patient}
          onSuccess={() => {
            supabase
              .from('patients')
              .select('*')
              .eq('id', id)
              .maybeSingle()
              .then(({ data }) => setPatient(data));
          }}
        />

        {/* Patient Link Dialog */}
        <PatientLinkDialog
          open={showLinkDialog}
          onOpenChange={setShowLinkDialog}
          patientId={patient.id}
          patientName={patient.name}
          currentEmail={patient.email}
          onSuccess={() => {
            // Refresh patient data
            supabase
              .from('patients')
              .select('*')
              .eq('id', id)
              .maybeSingle()
              .then(({ data }) => setPatient(data));
          }}
        />

        {/* Emergency banner */}
        {risk.overallRisk === 'high' && <ClinicalDisclaimer variant="emergency" />}

        {/* Patient overview cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Basic info */}
          <div className="bg-card rounded-xl border border-border p-5 shadow-soft">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{patient.name}</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {patient.age} years • {patient.gender}
                </p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-risk-high" />
                <span className="text-muted-foreground">Blood Group:</span>
                <span className="font-medium text-foreground">{patient.blood_group}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Emergency:</span>
                <span className="font-medium text-foreground">{patient.emergency_contact}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Registered:</span>
                <span className="font-medium text-foreground">
                  {new Date(patient.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Allergies & Conditions */}
          <div className="bg-card rounded-xl border border-border p-5 shadow-soft">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-risk-medium" />
              Critical Information
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Allergies</p>
                {patient.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {patient.allergies.map((allergy) => (
                      <span key={allergy} className="px-2 py-1 rounded-md bg-risk-high/10 text-risk-high text-xs font-medium">
                        {allergy}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No known allergies</p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Chronic Conditions</p>
                {patient.chronic_conditions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {patient.chronic_conditions.map((condition) => (
                      <span key={condition} className="px-2 py-1 rounded-md bg-risk-medium/10 text-risk-medium text-xs font-medium">
                        {condition}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No chronic conditions</p>
                )}
              </div>
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="bg-card rounded-xl border border-border p-5 shadow-soft">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Risk Assessment
            </h3>
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 mb-2">
                <span className="text-2xl font-display font-bold text-foreground">{risk.fusedScore}%</span>
              </div>
              <RiskBadge level={risk.overallRisk} size="md" />
            </div>
            <p className="text-xs text-muted-foreground text-center">{risk.explanation}</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="vitals" className="space-y-4">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="vitals" className="gap-2">
              <Activity className="w-4 h-4" />
              Vitals
            </TabsTrigger>
            <TabsTrigger value="charts" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Charts
            </TabsTrigger>
            <TabsTrigger value="scans" className="gap-2">
              <Scan className="w-4 h-4" />
              Scans
            </TabsTrigger>
            <TabsTrigger value="records" className="gap-2">
              <FileText className="w-4 h-4" />
              Records
            </TabsTrigger>
          </TabsList>

          {/* Vitals Tab */}
          <TabsContent value="vitals" className="animate-fade-in">
            {latestVitals ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <VitalCard
                  icon={Activity}
                  label="SpO₂"
                  value={`${latestVitals.spo2 || '-'}%`}
                  status={latestVitals.spo2 && latestVitals.spo2 < 94 ? 'warning' : 'normal'}
                  reference="Normal: 95-100%"
                />
                <VitalCard
                  icon={Thermometer}
                  label="Temperature"
                  value={`${latestVitals.temperature || '-'}°C`}
                  status={latestVitals.temperature && Number(latestVitals.temperature) > 38 ? 'warning' : 'normal'}
                  reference="Normal: 36.1-37.2°C"
                />
                <VitalCard
                  icon={Heart}
                  label="Heart Rate"
                  value={`${latestVitals.heart_rate || '-'} bpm`}
                  status={latestVitals.heart_rate && latestVitals.heart_rate > 100 ? 'warning' : 'normal'}
                  reference="Normal: 60-100 bpm"
                />
                <VitalCard
                  icon={Wind}
                  label="Respiratory Rate"
                  value={`${latestVitals.respiratory_rate || '-'} /min`}
                  status={latestVitals.respiratory_rate && latestVitals.respiratory_rate > 20 ? 'warning' : 'normal'}
                  reference="Normal: 12-20 /min"
                />
              </div>
            ) : (
              <EmptyState icon={Activity} message="No vitals recorded yet" />
            )}
          </TabsContent>

          {/* Charts Tab */}
          <TabsContent value="charts" className="animate-fade-in">
            <VitalsChart vitals={vitals} />
          </TabsContent>

          {/* Scans Tab */}
          <TabsContent value="scans" className="animate-fade-in">
            {scans.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {scans.map((scan) => (
                  <div key={scan.id} className="bg-card rounded-xl border border-border p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-foreground capitalize">{scan.scan_type} Analysis</h3>
                      {scan.risk_level && <RiskBadge level={scan.risk_level as any} size="sm" />}
                    </div>
                    <div className="space-y-3">
                      <MetricBar label="Diagnosis Probability" value={Number(scan.diagnosis_probability) || 0} />
                      <MetricBar label="Abnormality Score" value={Number(scan.abnormality_score) || 0} />
                      <MetricBar label="Confidence" value={Number(scan.confidence_score) || 0} />
                    </div>
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {new Date(scan.created_at).toLocaleDateString()}
                      </span>
                      <span className="font-medium text-foreground">{scan.inference_time}s</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Scan} message="No scans available" />
            )}
          </TabsContent>

          {/* Records Tab */}
          <TabsContent value="records" className="animate-fade-in">
            {records.length > 0 ? (
              <div className="bg-card rounded-xl border border-border divide-y divide-border">
                {records.map((record) => (
                  <div key={record.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{record.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {record.hospital || 'Unknown'} • {new Date(record.date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded bg-muted text-xs font-medium text-muted-foreground capitalize">
                      {record.type.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={FileText} message="No medical records available" />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function VitalCard({
  icon: Icon,
  label,
  value,
  status,
  reference,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  status: 'normal' | 'warning';
  reference: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-soft">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${status === 'warning' ? 'bg-risk-medium/10' : 'bg-secondary/10'}`}>
          <Icon className={`w-5 h-5 ${status === 'warning' ? 'text-risk-medium' : 'text-secondary'}`} />
        </div>
        {status === 'warning' && <AlertTriangle className="w-5 h-5 text-risk-medium animate-pulse" />}
      </div>
      <p className="text-2xl font-display font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-xs text-muted-foreground mt-2">{reference}</p>
    </div>
  );
}

function MetricBar({ label, value }: { label: string; value: number }) {
  const percentage = Math.round(value * 100);
  const getColor = () => {
    if (percentage >= 70) return 'bg-risk-high';
    if (percentage >= 40) return 'bg-risk-medium';
    return 'bg-risk-low';
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{percentage}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${getColor()}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="bg-card rounded-xl border border-border p-12 text-center">
      <Icon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
