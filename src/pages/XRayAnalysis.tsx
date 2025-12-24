import { useState, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ClinicalDisclaimer } from '@/components/ClinicalDisclaimer';
import { RiskBadge } from '@/components/RiskBadge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockPatients } from '@/data/mockData';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalysisResult {
  pneumoniaProbability: number;
  lungAbnormalityScore: number;
  confidenceScore: number;
  inferenceTime: number;
  riskLevel: 'low' | 'medium' | 'high';
  explanation: string;
}

export default function XRayAnalysis() {
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!uploadedImage || !consentAccepted) return;

    setIsAnalyzing(true);

    // Simulate AI analysis
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Mock result
    const pneumoniaProbability = Math.random() * 0.5 + 0.3;
    const lungAbnormalityScore = Math.random() * 0.4 + 0.4;
    const fusedScore = (pneumoniaProbability + lungAbnormalityScore) / 2;

    const result: AnalysisResult = {
      pneumoniaProbability,
      lungAbnormalityScore,
      confidenceScore: 0.85 + Math.random() * 0.1,
      inferenceTime: 2.3 + Math.random() * 1.5,
      riskLevel: fusedScore >= 0.7 ? 'high' : fusedScore >= 0.4 ? 'medium' : 'low',
      explanation:
        fusedScore >= 0.7
          ? 'High probability of pneumonia detected with significant lung opacity. Immediate clinical review recommended.'
          : fusedScore >= 0.4
          ? 'Moderate abnormality detected. Further examination advised.'
          : 'No significant abnormalities detected. Continue standard monitoring.',
    };

    setAnalysisResult(result);
    setIsAnalyzing(false);
  };

  const resetAnalysis = () => {
    setUploadedImage(null);
    setAnalysisResult(null);
    setConsentAccepted(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
            X-Ray Analysis
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered chest X-ray analysis with Grad-CAM visualization
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Upload section */}
          <div className="space-y-4">
            {/* Patient selection */}
            <div className="bg-card rounded-xl border border-border p-5 shadow-soft">
              <Label className="text-sm font-medium text-foreground mb-3 block">
                Select Patient
              </Label>
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a patient..." />
                </SelectTrigger>
                <SelectContent>
                  {mockPatients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name} - {patient.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Upload area */}
            <div className="bg-card rounded-xl border border-border p-5 shadow-soft">
              <Label className="text-sm font-medium text-foreground mb-3 block">
                Upload Chest X-Ray
              </Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
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
                    <p className="text-sm text-muted-foreground">JPEG, PNG (max 10MB)</p>
                  </div>
                </button>
              ) : (
                <div className="relative aspect-square max-h-80 rounded-xl overflow-hidden bg-muted">
                  <img
                    src={uploadedImage}
                    alt="Uploaded X-ray"
                    className="w-full h-full object-contain"
                  />
                  {showHeatmap && analysisResult && (
                    <div className="absolute inset-0 bg-gradient-to-br from-risk-medium/30 via-transparent to-risk-high/40 mix-blend-multiply" />
                  )}
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
                        <p className="font-medium text-foreground">Analyzing X-ray...</p>
                        <p className="text-sm text-muted-foreground">Please wait</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Consent */}
            {uploadedImage && !analysisResult && (
              <ClinicalDisclaimer variant="consent" />
            )}

            {uploadedImage && !analysisResult && (
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <Checkbox
                  id="consent"
                  checked={consentAccepted}
                  onCheckedChange={(checked) => setConsentAccepted(checked as boolean)}
                />
                <Label htmlFor="consent" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                  I understand that this AI analysis is for clinical decision support only and does
                  not constitute a medical diagnosis.
                </Label>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              {uploadedImage && !analysisResult && (
                <>
                  <Button variant="outline" onClick={resetAnalysis} className="flex-1">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                  <Button
                    variant="medical"
                    onClick={handleAnalyze}
                    disabled={!consentAccepted || isAnalyzing}
                    className="flex-1"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Scan className="w-4 h-4 mr-2" />
                        Analyze X-Ray
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
                    {showHeatmap ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-2" />
                        Hide Heatmap
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Show Heatmap
                      </>
                    )}
                  </Button>
                  <Button variant="medical" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Results section */}
          <div className="space-y-4">
            {analysisResult ? (
              <>
                {/* Risk summary */}
                <div className={cn(
                  'rounded-xl border p-6 shadow-soft',
                  analysisResult.riskLevel === 'high' && 'bg-risk-high/5 border-risk-high/20',
                  analysisResult.riskLevel === 'medium' && 'bg-risk-medium/5 border-risk-medium/20',
                  analysisResult.riskLevel === 'low' && 'bg-risk-low/5 border-risk-low/20'
                )}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-semibold text-foreground">Analysis Result</h3>
                    <RiskBadge level={analysisResult.riskLevel} size="lg" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {analysisResult.explanation}
                  </p>
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

                {/* Detailed metrics */}
                <div className="bg-card rounded-xl border border-border p-5 shadow-soft">
                  <h3 className="font-display font-semibold text-foreground mb-4">
                    Detailed Analysis
                  </h3>
                  <div className="space-y-4">
                    <MetricBar
                      label="Pneumonia Probability"
                      value={analysisResult.pneumoniaProbability}
                      description="Likelihood of pneumonia based on pattern analysis"
                    />
                    <MetricBar
                      label="Lung Abnormality Score"
                      value={analysisResult.lungAbnormalityScore}
                      description="Overall assessment of lung tissue irregularities"
                    />
                    <MetricBar
                      label="Model Confidence"
                      value={analysisResult.confidenceScore}
                      description="AI model's confidence in the analysis"
                    />
                  </div>
                </div>

                {/* Heatmap explanation */}
                <div className="bg-card rounded-xl border border-border p-5 shadow-soft">
                  <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-primary" />
                    Grad-CAM Visualization
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    The highlighted regions on the X-ray indicate areas that most influenced the AI's
                    prediction. Warmer colors (red/orange) represent higher activation.
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-r from-risk-low to-risk-medium" />
                      <span className="text-xs text-muted-foreground">Low activation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-r from-risk-medium to-risk-high" />
                      <span className="text-xs text-muted-foreground">High activation</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-card rounded-xl border border-border p-12 text-center shadow-soft">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Scan className="w-10 h-10 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">
                  Ready for Analysis
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Upload a chest X-ray image and accept the clinical disclaimer to begin
                  AI-powered analysis.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function MetricBar({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
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
      <div className="h-3 bg-muted rounded-full overflow-hidden mb-1">
        <div
          className={`h-full rounded-full transition-all duration-700 ${getColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
