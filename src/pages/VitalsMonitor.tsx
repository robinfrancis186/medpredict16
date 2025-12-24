import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { RiskBadge } from '@/components/RiskBadge';
import { toast } from 'sonner';
import {
  Activity,
  Heart,
  Thermometer,
  Wind,
  Droplets,
  Cigarette,
  Save,
  RotateCcw,
  TrendingUp,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

interface Patient {
  id: string;
  name: string;
}

interface RiskResult {
  overallRisk: 'low' | 'medium' | 'high';
  vitalsRiskScore: number;
  explanation: string;
  factors: string[];
}

export default function VitalsMonitor() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [vitals, setVitals] = useState({
    spO2: '',
    temperature: '',
    heartRate: '',
    respiratoryRate: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    smokingHistory: false,
  });
  const [riskResult, setRiskResult] = useState<RiskResult | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('patients')
          .select('id, name')
          .order('name');

        if (error) throw error;
        setPatients(data || []);
      } catch (error) {
        console.error('Error fetching patients:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const calculateRisk = () => {
    let score = 0;
    const factors: string[] = [];

    const spO2 = Number(vitals.spO2);
    const temp = Number(vitals.temperature);
    const hr = Number(vitals.heartRate);
    const rr = Number(vitals.respiratoryRate);

    if (spO2 && spO2 < 94) {
      score += 30;
      factors.push('Low oxygen saturation (SpO2 < 94%)');
    }
    if (temp && temp > 38) {
      score += 20;
      factors.push('Elevated temperature (fever)');
    }
    if (hr && (hr > 100 || hr < 60)) {
      score += 15;
      factors.push('Abnormal heart rate');
    }
    if (rr && rr > 20) {
      score += 20;
      factors.push('Elevated respiratory rate');
    }
    if (vitals.smokingHistory) {
      score += 15;
      factors.push('Smoking history increases risk');
    }

    const overallRisk: 'low' | 'medium' | 'high' = score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low';
    const explanation =
      overallRisk === 'high'
        ? 'High risk detected. Immediate clinical review recommended.'
        : overallRisk === 'medium'
        ? 'Moderate risk. Follow-up assessment advised.'
        : 'Low risk profile. Continue standard monitoring.';

    return { overallRisk, vitalsRiskScore: Math.min(score, 100), explanation, factors };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatient) {
      toast.error('Please select a patient');
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase.from('vitals').insert({
        patient_id: selectedPatient,
        spo2: Number(vitals.spO2) || null,
        temperature: Number(vitals.temperature) || null,
        heart_rate: Number(vitals.heartRate) || null,
        respiratory_rate: Number(vitals.respiratoryRate) || null,
        blood_pressure_systolic: Number(vitals.bloodPressureSystolic) || null,
        blood_pressure_diastolic: Number(vitals.bloodPressureDiastolic) || null,
        smoking_history: vitals.smokingHistory,
      });

      if (error) throw error;

      const risk = calculateRisk();
      setRiskResult(risk);

      toast.success('Vitals recorded successfully', {
        description: `Risk assessment: ${risk.overallRisk.toUpperCase()} (${risk.vitalsRiskScore}%)`,
      });
    } catch (error: any) {
      console.error('Error saving vitals:', error);
      toast.error('Failed to save vitals', { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setVitals({
      spO2: '',
      temperature: '',
      heartRate: '',
      respiratoryRate: '',
      bloodPressureSystolic: '',
      bloodPressureDiastolic: '',
      smokingHistory: false,
    });
    setRiskResult(null);
  };

  const vitalInputs = [
    { key: 'spO2', label: 'SpO₂ (%)', icon: Droplets, placeholder: '95-100', unit: '%', min: 70, max: 100, warning: (v: number) => v < 94 },
    { key: 'temperature', label: 'Temperature', icon: Thermometer, placeholder: '36.5', unit: '°C', min: 35, max: 42, step: 0.1, warning: (v: number) => v > 38 },
    { key: 'heartRate', label: 'Heart Rate', icon: Heart, placeholder: '60-100', unit: 'bpm', min: 40, max: 200, warning: (v: number) => v < 60 || v > 100 },
    { key: 'respiratoryRate', label: 'Respiratory Rate', icon: Wind, placeholder: '12-20', unit: '/min', min: 8, max: 40, warning: (v: number) => v > 20 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Vitals Monitor</h1>
          <p className="text-muted-foreground mt-1">Record patient vitals and calculate risk scores</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Input form */}
          <div className="lg:col-span-2 space-y-4">
            {/* Patient selection */}
            <div className="bg-card rounded-xl border border-border p-5 shadow-soft">
              <Label className="text-sm font-medium text-foreground mb-3 block">Select Patient</Label>
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoading ? 'Loading...' : 'Choose a patient...'} />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="bg-card rounded-xl border border-border p-5 shadow-soft">
                <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Patient Vitals
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {vitalInputs.map((input) => {
                    const value = vitals[input.key as keyof typeof vitals];
                    const isWarning = value && input.warning(Number(value));

                    return (
                      <div key={input.key} className="space-y-2">
                        <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                          <input.icon className="w-4 h-4 text-muted-foreground" />
                          {input.label}
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder={input.placeholder}
                            value={value as string}
                            onChange={(e) => setVitals({ ...vitals, [input.key]: e.target.value })}
                            min={input.min}
                            max={input.max}
                            step={input.step || 1}
                            className={isWarning ? 'border-risk-medium focus-visible:ring-risk-medium' : ''}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{input.unit}</span>
                        </div>
                        {isWarning && (
                          <p className="text-xs text-risk-medium flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Abnormal value
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Blood Pressure */}
                <div className="mt-4 space-y-2">
                  <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    Blood Pressure
                  </Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      placeholder="120"
                      value={vitals.bloodPressureSystolic}
                      onChange={(e) => setVitals({ ...vitals, bloodPressureSystolic: e.target.value })}
                      min={70}
                      max={200}
                      className="w-24"
                    />
                    <span className="text-muted-foreground">/</span>
                    <Input
                      type="number"
                      placeholder="80"
                      value={vitals.bloodPressureDiastolic}
                      onChange={(e) => setVitals({ ...vitals, bloodPressureDiastolic: e.target.value })}
                      min={40}
                      max={130}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">mmHg</span>
                  </div>
                </div>

                {/* Smoking history */}
                <div className="mt-4 flex items-center gap-3">
                  <Checkbox
                    id="smoking"
                    checked={vitals.smokingHistory}
                    onCheckedChange={(checked) => setVitals({ ...vitals, smokingHistory: checked as boolean })}
                  />
                  <Label htmlFor="smoking" className="text-sm text-muted-foreground flex items-center gap-2 cursor-pointer">
                    <Cigarette className="w-4 h-4" />
                    Patient has smoking history
                  </Label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-4">
                <Button type="button" variant="outline" onClick={handleReset} className="flex-1">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                <Button type="submit" variant="medical" disabled={!selectedPatient || isSaving} className="flex-1">
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Record Vitals
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Risk assessment panel */}
          <div className="space-y-4">
            {riskResult ? (
              <>
                <div
                  className={`rounded-xl border p-6 shadow-soft ${
                    riskResult.overallRisk === 'high'
                      ? 'bg-risk-high/5 border-risk-high/20'
                      : riskResult.overallRisk === 'medium'
                      ? 'bg-risk-medium/5 border-risk-medium/20'
                      : 'bg-risk-low/5 border-risk-low/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-semibold text-foreground">Risk Assessment</h3>
                    <RiskBadge level={riskResult.overallRisk} size="lg" />
                  </div>
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20">
                      <span className="text-3xl font-display font-bold text-foreground">{riskResult.vitalsRiskScore}%</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Vitals Risk Score</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{riskResult.explanation}</p>
                </div>

                {riskResult.factors.length > 0 && (
                  <div className="bg-card rounded-xl border border-border p-5 shadow-soft">
                    <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-risk-medium" />
                      Risk Factors
                    </h3>
                    <ul className="space-y-2">
                      {riskResult.factors.map((factor, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="w-1.5 h-1.5 rounded-full bg-risk-medium mt-2 flex-shrink-0" />
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-card rounded-xl border border-border p-12 text-center shadow-soft">
                <div className="w-20 h-20 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-10 h-10 text-secondary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">Enter Vitals</h3>
                <p className="text-sm text-muted-foreground">
                  Fill in the patient's vital signs to calculate the risk assessment score.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
