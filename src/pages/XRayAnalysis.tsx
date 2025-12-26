import React, { useState, useRef, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ClinicalDisclaimer } from '@/components/ClinicalDisclaimer';
import { RiskBadge } from '@/components/RiskBadge';
import { ComparativeScanViewer } from '@/components/ComparativeScanViewer';
import { CollaborativeAnnotation } from '@/components/CollaborativeAnnotation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { generateAnalysisReport, downloadPdf } from '@/lib/pdfGenerator';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Upload,
  Scan,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  Download,
  RotateCcw,
  Loader2,
  Brain,
  HeartPulse,
  Stethoscope,
  ArrowLeftRight,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  blood_group: string;
  allergies: string[];
  chronic_conditions: string[];
}

interface AnalysisResult {
  diagnosisProbability: number;
  abnormalityScore: number;
  confidenceScore: number;
  inferenceTime: number;
  riskLevel: 'low' | 'medium' | 'high';
  explanation: string;
  factors: string[];
}

type ScanType = 'xray' | 'ct' | 'mri' | 'ecg' | 'ultrasound';

const scanTypes: { value: ScanType; label: string; icon: React.ElementType; description: string }[] = [
  { value: 'xray', label: 'Chest X-Ray', icon: Scan, description: 'Pneumonia & lung analysis' },
  { value: 'ct', label: 'CT Scan', icon: Brain, description: 'Multi-organ analysis' },
  { value: 'mri', label: 'MRI Scan', icon: Brain, description: 'Soft tissue imaging' },
  { value: 'ecg', label: 'ECG Analysis', icon: HeartPulse, description: 'Cardiac rhythm' },
  { value: 'ultrasound', label: 'Ultrasound', icon: Stethoscope, description: 'Real-time imaging' },
];

export default function XRayAnalysis() {
  const { profile } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [selectedScanType, setSelectedScanType] = useState<ScanType>('xray');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [latestScanId, setLatestScanId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      const { data } = await supabase.from('patients').select('*').order('name');
      setPatients(data || []);
    };
    fetchPatients();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedImage || !consentAccepted || !selectedPatient) return;

    setIsAnalyzing(true);
    const startTime = Date.now();

    try {
      const patient = patients.find((p) => p.id === selectedPatient);
      
      // Call the real AI edge function
      const { data, error } = await supabase.functions.invoke('analyze-scan', {
        body: {
          imageBase64: uploadedImage,
          scanType: scanTypes.find(t => t.value === selectedScanType)?.label || selectedScanType,
          patientInfo: patient ? {
            name: patient.name,
            age: patient.age,
            gender: patient.gender,
            chronicConditions: patient.chronic_conditions,
            allergies: patient.allergies
          } : undefined
        }
      });

      if (error) throw error;

      const inferenceTime = (Date.now() - startTime) / 1000;

      const result: AnalysisResult = {
        diagnosisProbability: (data.confidenceScore || 70) / 100,
        abnormalityScore: (data.abnormalityScore || 30) / 100,
        confidenceScore: (data.confidenceScore || 85) / 100,
        inferenceTime,
        riskLevel: data.riskLevel || 'medium',
        explanation: data.aiExplanation || data.primaryDiagnosis || 'Analysis completed',
        factors: data.keyFactors || data.recommendations || [],
      };

      // Save to database
      await supabase.from('medical_scans').insert({
        patient_id: selectedPatient,
        scan_type: selectedScanType,
        diagnosis_probability: result.diagnosisProbability,
        abnormality_score: result.abnormalityScore,
        confidence_score: result.confidenceScore,
        inference_time: result.inferenceTime,
        risk_level: result.riskLevel,
        ai_explanation: result.explanation,
        ai_factors: result.factors,
      });

      // Create notification for high-risk results
      if (result.riskLevel === 'high') {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('notifications').insert({
            user_id: user.id,
            title: 'High Risk Scan Detected',
            message: `${patient?.name || 'Patient'}'s ${scanTypes.find(t => t.value === selectedScanType)?.label} shows high risk indicators. Immediate review recommended.`,
            type: 'high_risk_alert',
            patient_id: selectedPatient
          });
        }
      }

      setAnalysisResult(result);
      toast.success('Analysis complete', { description: `Risk level: ${result.riskLevel.toUpperCase()}` });
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error('Analysis failed', { description: 'Please try again or contact support.' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setUploadedImage(null);
    setAnalysisResult(null);
    setConsentAccepted(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportPdf = async () => {
    if (!analysisResult || !selectedPatient) return;
    setIsExporting(true);

    const patient = patients.find((p) => p.id === selectedPatient);
    if (!patient) return;

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
        null,
        {
          scanType: selectedScanType,
          diagnosisProbability: analysisResult.diagnosisProbability,
          abnormalityScore: analysisResult.abnormalityScore,
          confidenceScore: analysisResult.confidenceScore,
          inferenceTime: analysisResult.inferenceTime,
          riskLevel: analysisResult.riskLevel,
          aiExplanation: analysisResult.explanation,
          aiFactors: analysisResult.factors,
          createdAt: new Date().toISOString(),
        },
        {
          overallRisk: analysisResult.riskLevel,
          fusedScore: Math.round((analysisResult.diagnosisProbability + analysisResult.abnormalityScore) * 50),
          explanation: analysisResult.explanation,
          factors: analysisResult.factors,
        },
        profile?.full_name || 'Medical Staff'
      );

      downloadPdf(doc, `${patient.name.replace(/\s+/g, '_')}_${selectedScanType}_analysis_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Report exported');
    } catch (error) {
      toast.error('Failed to export');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Medical Scan Analysis</h1>
          <p className="text-muted-foreground mt-1">AI-powered diagnostic imaging analysis with visualization</p>
        </div>

        {/* Scan type selection */}
        <Tabs value={selectedScanType} onValueChange={(v) => setSelectedScanType(v as ScanType)} className="space-y-4">
          <TabsList className="bg-muted/50 p-1 h-auto flex-wrap">
            {scanTypes.map((type) => (
              <TabsTrigger key={type.value} value={type.value} className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <type.icon className="w-4 h-4" />
                {type.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Upload section */}
            <div className="space-y-4">
              {/* Patient selection */}
              <div className="bg-card rounded-xl border border-border p-5 shadow-soft">
                <Label className="text-sm font-medium text-foreground mb-3 block">Select Patient</Label>
                <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a patient..." />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name} - {patient.age}y, {patient.gender}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Upload area */}
              <div className="bg-card rounded-xl border border-border p-5 shadow-soft">
                <Label className="text-sm font-medium text-foreground mb-3 block">
                  Upload {scanTypes.find((t) => t.value === selectedScanType)?.label}
                </Label>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                {!uploadedImage ? (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-square max-h-80 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-4 hover:border-primary/50 hover:bg-primary/5 transition-all"
                  >
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-foreground">Click to upload</p>
                      <p className="text-sm text-muted-foreground">JPEG, PNG, DICOM (max 10MB)</p>
                    </div>
                  </button>
                ) : (
                  <div className="relative aspect-square max-h-80 rounded-xl overflow-hidden bg-muted">
                    <img src={uploadedImage} alt="Uploaded scan" className="w-full h-full object-contain" />
                    {showHeatmap && analysisResult && (
                      <div className="absolute inset-0 bg-gradient-to-br from-risk-medium/30 via-transparent to-risk-high/40 mix-blend-multiply" />
                    )}
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <div className="text-center">
                          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
                          <p className="font-medium text-foreground">Analyzing scan...</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Consent */}
              {uploadedImage && !analysisResult && <ClinicalDisclaimer variant="consent" />}

              {uploadedImage && !analysisResult && (
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <Checkbox id="consent" checked={consentAccepted} onCheckedChange={(checked) => setConsentAccepted(checked as boolean)} />
                  <Label htmlFor="consent" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                    I understand that this AI analysis is for clinical decision support only.
                  </Label>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {uploadedImage && !analysisResult && (
                  <>
                    <Button variant="outline" onClick={resetAnalysis} className="flex-1">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                    <Button variant="medical" onClick={handleAnalyze} disabled={!consentAccepted || isAnalyzing || !selectedPatient} className="flex-1">
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Scan className="w-4 h-4 mr-2" />
                          Analyze Scan
                        </>
                      )}
                    </Button>
                  </>
                )}

                {analysisResult && (
                  <>
                    <Button variant="outline" onClick={resetAnalysis} className="flex-1">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      New Analysis
                    </Button>
                    <Button variant="outline" onClick={() => setShowHeatmap(!showHeatmap)} className="flex-1">
                      {showHeatmap ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                      {showHeatmap ? 'Hide' : 'Show'} Heatmap
                    </Button>
                    <Button variant="medical" onClick={handleExportPdf} disabled={isExporting} className="flex-1">
                      {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                      Export PDF
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Results section */}
            <div className="space-y-4">
              {analysisResult ? (
                <>
                  <div
                    className={cn(
                      'rounded-xl border p-6 shadow-soft',
                      analysisResult.riskLevel === 'high' && 'bg-risk-high/5 border-risk-high/20',
                      analysisResult.riskLevel === 'medium' && 'bg-risk-medium/5 border-risk-medium/20',
                      analysisResult.riskLevel === 'low' && 'bg-risk-low/5 border-risk-low/20'
                    )}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display font-semibold text-foreground">Analysis Result</h3>
                      <RiskBadge level={analysisResult.riskLevel} size="lg" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{analysisResult.explanation}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-secondary" />
                        Confidence: {Math.round(analysisResult.confidenceScore * 100)}%
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {analysisResult.inferenceTime.toFixed(1)}s
                      </div>
                    </div>
                  </div>

                  <div className="bg-card rounded-xl border border-border p-5 shadow-soft">
                    <h3 className="font-display font-semibold text-foreground mb-4">Detailed Metrics</h3>
                    <div className="space-y-4">
                      <MetricBar label="Diagnosis Probability" value={analysisResult.diagnosisProbability} />
                      <MetricBar label="Abnormality Score" value={analysisResult.abnormalityScore} />
                      <MetricBar label="Model Confidence" value={analysisResult.confidenceScore} />
                    </div>
                  </div>

                  {analysisResult.factors.length > 0 && (
                    <div className="bg-card rounded-xl border border-border p-5 shadow-soft">
                      <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-risk-medium" />
                        Key Findings
                      </h3>
                      <ul className="space-y-2">
                        {analysisResult.factors.map((factor, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-risk-medium mt-2" />
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-card rounded-xl border border-border p-12 text-center shadow-soft">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    {React.createElement(scanTypes.find((t) => t.value === selectedScanType)?.icon || Scan, { className: 'w-10 h-10 text-primary' })}
                  </div>
                  <h3 className="font-display font-semibold text-foreground mb-2">Ready for Analysis</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Select a patient, upload a {scanTypes.find((t) => t.value === selectedScanType)?.label.toLowerCase()} image, and accept the disclaimer to begin AI analysis.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
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
        <span className="font-medium text-foreground">{label}</span>
        <span className="font-semibold text-foreground">{percentage}%</span>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${getColor()}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
