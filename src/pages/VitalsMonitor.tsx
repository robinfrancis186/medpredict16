import { useState } from 'react';
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
import { mockPatients, calculateRiskAssessment } from '@/data/mockData';
import { RiskBadge } from '@/components/RiskBadge';
import { Vitals } from '@/types/medical';
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
} from 'lucide-react';
import { toast } from 'sonner';

export default function VitalsMonitor() {
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [vitals, setVitals] = useState({
    spO2: '',
    temperature: '',
    heartRate: '',
    respiratoryRate: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    smokingHistory: false,
  });
  const [riskResult, setRiskResult] = useState<ReturnType<typeof calculateRiskAssessment> | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const vitalsData: Vitals = {
      id: `v-${Date.now()}`,
      patientId: selectedPatient,
      timestamp: new Date().toISOString(),
      spO2: Number(vitals.spO2),
      temperature: Number(vitals.temperature),
      heartRate: Number(vitals.heartRate),
      respiratoryRate: Number(vitals.respiratoryRate),
      bloodPressureSystolic: Number(vitals.bloodPressureSystolic),
      bloodPressureDiastolic: Number(vitals.bloodPressureDiastolic),
      smokingHistory: vitals.smokingHistory,
    };

    const risk = calculateRiskAssessment(vitalsData, undefined);
    setRiskResult(risk);

    toast.success('Vitals recorded successfully', {
      description: `Risk assessment: ${risk.overallRisk.toUpperCase()} (${risk.vitalsRiskScore}%)`,
    });
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
    {
      key: 'spO2',
      label: 'SpO₂ (%)',
      icon: Droplets,
      placeholder: '95-100',
      unit: '%',
      min: 70,
      max: 100,
      warning: (v: number) => v < 94,
    },
    {
      key: 'temperature',
      label: 'Temperature',
      icon: Thermometer,
      placeholder: '36.5',
      unit: '°C',
      min: 35,
      max: 42,
      step: 0.1,
      warning: (v: number) => v > 38,
    },
    {
      key: 'heartRate',
      label: 'Heart Rate',
      icon: Heart,
      placeholder: '60-100',
      unit: 'bpm',
      min: 40,
      max: 200,
      warning: (v: number) => v < 60 || v > 100,
    },
    {
      key: 'respiratoryRate',
      label: 'Respiratory Rate',
      icon: Wind,
      placeholder: '12-20',
      unit: '/min',
      min: 8,
      max: 40,
      warning: (v: number) => v > 20,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
            Vitals Monitor
          </h1>
          <p className="text-muted-foreground mt-1">
            Record patient vitals and calculate risk scores
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Input form */}
          <div className="lg:col-span-2 space-y-4">
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

            <form onSubmit={handleSubmit}>
              {/* Vitals grid */}
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
                            onChange={(e) =>
                              setVitals({ ...vitals, [input.key]: e.target.value })
                            }
                            min={input.min}
                            max={input.max}
                            step={input.step || 1}
                            className={isWarning ? 'border-risk-medium focus-visible:ring-risk-medium' : ''}
                            required
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            {input.unit}
                          </span>
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
                      onChange={(e) =>
                        setVitals({ ...vitals, bloodPressureSystolic: e.target.value })
                      }
                      min={70}
                      max={200}
                      className="w-24"
                      required
                    />
                    <span className="text-muted-foreground">/</span>
                    <Input
                      type="number"
                      placeholder="80"
                      value={vitals.bloodPressureDiastolic}
                      onChange={(e) =>
                        setVitals({ ...vitals, bloodPressureDiastolic: e.target.value })
                      }
                      min={40}
                      max={130}
                      className="w-24"
                      required
                    />
                    <span className="text-sm text-muted-foreground">mmHg</span>
                  </div>
                </div>

                {/* Smoking history */}
                <div className="mt-4 flex items-center gap-3">
                  <Checkbox
                    id="smoking"
                    checked={vitals.smokingHistory}
                    onCheckedChange={(checked) =>
                      setVitals({ ...vitals, smokingHistory: checked as boolean })
                    }
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
                <Button type="submit" variant="medical" disabled={!selectedPatient} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  Record Vitals
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
                      <span className="text-3xl font-display font-bold text-foreground">
                        {riskResult.vitalsRiskScore}%
                      </span>
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
                <h3 className="font-display font-semibold text-foreground mb-2">
                  Enter Vitals
                </h3>
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
