import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { mockPatients, mockVitals, mockXRayAnalyses, mockMedicalRecords, calculateRiskAssessment } from '@/data/mockData';
import { RiskBadge } from '@/components/RiskBadge';
import { ClinicalDisclaimer } from '@/components/ClinicalDisclaimer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from 'lucide-react';

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const patient = mockPatients.find((p) => p.id === id);
  const vitals = mockVitals[id || ''] || [];
  const xrayAnalyses = mockXRayAnalyses[id || ''] || [];
  const records = mockMedicalRecords[id || ''] || [];

  const latestVitals = vitals[0];
  const latestXray = xrayAnalyses[0];
  const riskAssessment = calculateRiskAssessment(latestVitals, latestXray);

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
            <p className="text-muted-foreground">Patient ID: {patient.id}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Emergency info banner for high risk */}
        {patient.riskLevel === 'high' && (
          <ClinicalDisclaimer variant="emergency" />
        )}

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
                <span className="font-medium text-foreground">{patient.bloodGroup}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Emergency:</span>
                <span className="font-medium text-foreground">{patient.emergencyContact}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Last Visit:</span>
                <span className="font-medium text-foreground">
                  {new Date(patient.lastVisit).toLocaleDateString()}
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
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Allergies
                </p>
                {patient.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {patient.allergies.map((allergy) => (
                      <span
                        key={allergy}
                        className="px-2 py-1 rounded-md bg-risk-high/10 text-risk-high text-xs font-medium"
                      >
                        {allergy}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No known allergies</p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Chronic Conditions
                </p>
                {patient.chronicConditions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {patient.chronicConditions.map((condition) => (
                      <span
                        key={condition}
                        className="px-2 py-1 rounded-md bg-risk-medium/10 text-risk-medium text-xs font-medium"
                      >
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
                <span className="text-2xl font-display font-bold text-foreground">
                  {riskAssessment.fusedScore}%
                </span>
              </div>
              <RiskBadge level={riskAssessment.overallRisk} size="md" />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {riskAssessment.explanation}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="vitals" className="space-y-4">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="vitals" className="gap-2">
              <Activity className="w-4 h-4" />
              Vitals
            </TabsTrigger>
            <TabsTrigger value="xray" className="gap-2">
              <Scan className="w-4 h-4" />
              X-Ray Analysis
            </TabsTrigger>
            <TabsTrigger value="records" className="gap-2">
              <FileText className="w-4 h-4" />
              Medical Records
            </TabsTrigger>
          </TabsList>

          {/* Vitals Tab */}
          <TabsContent value="vitals" className="animate-fade-in">
            {latestVitals ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <VitalCard
                  icon={Activity}
                  label="SpO₂"
                  value={`${latestVitals.spO2}%`}
                  status={latestVitals.spO2 < 94 ? 'warning' : 'normal'}
                  reference="Normal: 95-100%"
                />
                <VitalCard
                  icon={Thermometer}
                  label="Temperature"
                  value={`${latestVitals.temperature}°C`}
                  status={latestVitals.temperature > 38 ? 'warning' : 'normal'}
                  reference="Normal: 36.1-37.2°C"
                />
                <VitalCard
                  icon={Heart}
                  label="Heart Rate"
                  value={`${latestVitals.heartRate} bpm`}
                  status={latestVitals.heartRate > 100 ? 'warning' : 'normal'}
                  reference="Normal: 60-100 bpm"
                />
                <VitalCard
                  icon={Wind}
                  label="Respiratory Rate"
                  value={`${latestVitals.respiratoryRate} /min`}
                  status={latestVitals.respiratoryRate > 20 ? 'warning' : 'normal'}
                  reference="Normal: 12-20 /min"
                />
              </div>
            ) : (
              <EmptyState icon={Activity} message="No vitals recorded yet" />
            )}
          </TabsContent>

          {/* X-Ray Tab */}
          <TabsContent value="xray" className="animate-fade-in">
            {latestXray ? (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-card rounded-xl border border-border p-5">
                  <h3 className="font-semibold text-foreground mb-4">X-Ray Image</h3>
                  <div className="aspect-square bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50" />
                    <Scan className="w-16 h-16 text-muted-foreground/50 relative z-10" />
                    <p className="absolute bottom-4 text-sm text-muted-foreground">
                      Chest X-Ray Preview
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-card rounded-xl border border-border p-5">
                    <h3 className="font-semibold text-foreground mb-4">AI Analysis Results</h3>
                    <div className="space-y-4">
                      <AnalysisMetric
                        label="Pneumonia Probability"
                        value={latestXray.pneumoniaProbability}
                      />
                      <AnalysisMetric
                        label="Lung Abnormality Score"
                        value={latestXray.lungAbnormalityScore}
                      />
                      <AnalysisMetric
                        label="Confidence Score"
                        value={latestXray.confidenceScore}
                      />
                    </div>
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        Inference Time
                      </span>
                      <span className="font-medium text-foreground">{latestXray.inferenceTime}s</span>
                    </div>
                  </div>
                  <ClinicalDisclaimer variant="consent" />
                </div>
              </div>
            ) : (
              <EmptyState icon={Scan} message="No X-ray analysis available" />
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
                        {record.hospital} • {new Date(record.date).toLocaleDateString()}
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
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          status === 'warning' ? 'bg-risk-medium/10' : 'bg-secondary/10'
        }`}>
          <Icon className={`w-5 h-5 ${status === 'warning' ? 'text-risk-medium' : 'text-secondary'}`} />
        </div>
        {status === 'warning' && (
          <AlertTriangle className="w-5 h-5 text-risk-medium animate-pulse-gentle" />
        )}
      </div>
      <p className="text-2xl font-display font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-xs text-muted-foreground mt-2">{reference}</p>
    </div>
  );
}

function AnalysisMetric({ label, value }: { label: string; value: number }) {
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
        <div
          className={`h-full rounded-full transition-all duration-500 ${getColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="bg-card rounded-xl border border-border p-12 text-center">
      <Icon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
      <p className="text-muted-foreground">{message}</p>
      <Button variant="outline" className="mt-4">
        Add New Record
      </Button>
    </div>
  );
}
