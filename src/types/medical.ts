export type UserRole = 'doctor' | 'nurse' | 'patient';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  bloodGroup: string;
  emergencyContact: string;
  allergies: string[];
  chronicConditions: string[];
  avatar?: string;
  lastVisit: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface Vitals {
  id: string;
  patientId: string;
  timestamp: string;
  spO2: number;
  temperature: number;
  heartRate: number;
  respiratoryRate: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  smokingHistory: boolean;
}

export interface XRayAnalysis {
  id: string;
  patientId: string;
  imageUrl: string;
  timestamp: string;
  pneumoniaProbability: number;
  lungAbnormalityScore: number;
  confidenceScore: number;
  inferenceTime: number;
  heatmapUrl?: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  type: 'discharge_summary' | 'diagnosis' | 'xray_report' | 'ct_report' | 'prescription' | 'lab_result';
  title: string;
  date: string;
  hospital: string;
  fileUrl?: string;
  notes?: string;
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high';
  imageRiskScore: number;
  vitalsRiskScore: number;
  fusedScore: number;
  explanation: string;
  factors: string[];
}
