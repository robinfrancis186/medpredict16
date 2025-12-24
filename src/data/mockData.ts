import { Patient, Vitals, XRayAnalysis, MedicalRecord, RiskAssessment } from '@/types/medical';

export const mockPatients: Patient[] = [
  {
    id: 'p-001',
    name: 'Michael Thompson',
    age: 58,
    gender: 'male',
    bloodGroup: 'O+',
    emergencyContact: '+1 (555) 123-4567',
    allergies: ['Penicillin', 'Sulfa drugs'],
    chronicConditions: ['Type 2 Diabetes', 'Hypertension'],
    lastVisit: '2024-01-15',
    riskLevel: 'high',
  },
  {
    id: 'p-002',
    name: 'Emily Rodriguez',
    age: 34,
    gender: 'female',
    bloodGroup: 'A+',
    emergencyContact: '+1 (555) 234-5678',
    allergies: ['Latex'],
    chronicConditions: ['Asthma'],
    lastVisit: '2024-01-18',
    riskLevel: 'medium',
  },
  {
    id: 'p-003',
    name: 'David Kim',
    age: 45,
    gender: 'male',
    bloodGroup: 'B-',
    emergencyContact: '+1 (555) 345-6789',
    allergies: [],
    chronicConditions: [],
    lastVisit: '2024-01-20',
    riskLevel: 'low',
  },
  {
    id: 'p-004',
    name: 'Sarah Mitchell',
    age: 67,
    gender: 'female',
    bloodGroup: 'AB+',
    emergencyContact: '+1 (555) 456-7890',
    allergies: ['Aspirin', 'Ibuprofen'],
    chronicConditions: ['COPD', 'Heart Disease'],
    lastVisit: '2024-01-22',
    riskLevel: 'high',
  },
  {
    id: 'p-005',
    name: 'James Anderson',
    age: 52,
    gender: 'male',
    bloodGroup: 'O-',
    emergencyContact: '+1 (555) 567-8901',
    allergies: ['Codeine'],
    chronicConditions: ['Previous Pneumonia'],
    lastVisit: '2024-01-23',
    riskLevel: 'medium',
  },
];

export const mockVitals: Record<string, Vitals[]> = {
  'p-001': [
    {
      id: 'v-001',
      patientId: 'p-001',
      timestamp: '2024-01-22T10:30:00',
      spO2: 92,
      temperature: 38.2,
      heartRate: 98,
      respiratoryRate: 22,
      bloodPressureSystolic: 145,
      bloodPressureDiastolic: 92,
      smokingHistory: true,
    },
    {
      id: 'v-002',
      patientId: 'p-001',
      timestamp: '2024-01-21T14:00:00',
      spO2: 94,
      temperature: 37.8,
      heartRate: 92,
      respiratoryRate: 20,
      bloodPressureSystolic: 142,
      bloodPressureDiastolic: 90,
      smokingHistory: true,
    },
  ],
  'p-002': [
    {
      id: 'v-003',
      patientId: 'p-002',
      timestamp: '2024-01-22T09:00:00',
      spO2: 96,
      temperature: 37.1,
      heartRate: 78,
      respiratoryRate: 16,
      bloodPressureSystolic: 118,
      bloodPressureDiastolic: 76,
      smokingHistory: false,
    },
  ],
};

export const mockXRayAnalyses: Record<string, XRayAnalysis[]> = {
  'p-001': [
    {
      id: 'xr-001',
      patientId: 'p-001',
      imageUrl: '/placeholder.svg',
      timestamp: '2024-01-22T11:00:00',
      pneumoniaProbability: 0.78,
      lungAbnormalityScore: 0.82,
      confidenceScore: 0.91,
      inferenceTime: 2.3,
    },
  ],
};

export const mockMedicalRecords: Record<string, MedicalRecord[]> = {
  'p-001': [
    {
      id: 'mr-001',
      patientId: 'p-001',
      type: 'discharge_summary',
      title: 'Discharge Summary - Pneumonia Treatment',
      date: '2023-11-15',
      hospital: 'City General Hospital',
      notes: 'Patient was treated for community-acquired pneumonia. Completed 7-day antibiotic course.',
    },
    {
      id: 'mr-002',
      patientId: 'p-001',
      type: 'xray_report',
      title: 'Chest X-Ray Report',
      date: '2023-11-10',
      hospital: 'City General Hospital',
      notes: 'Right lower lobe consolidation consistent with pneumonia.',
    },
    {
      id: 'mr-003',
      patientId: 'p-001',
      type: 'prescription',
      title: 'Prescription - Antibiotics',
      date: '2023-11-10',
      hospital: 'City General Hospital',
    },
  ],
  'p-002': [
    {
      id: 'mr-004',
      patientId: 'p-002',
      type: 'diagnosis',
      title: 'Asthma Management Plan',
      date: '2024-01-05',
      hospital: 'Riverside Medical Center',
      notes: 'Mild persistent asthma. Prescribed inhaled corticosteroids.',
    },
  ],
};

export function calculateRiskAssessment(
  vitals: Vitals | undefined,
  xrayAnalysis: XRayAnalysis | undefined
): RiskAssessment {
  let imageRiskScore = 0;
  let vitalsRiskScore = 0;
  const factors: string[] = [];

  // Calculate image risk score
  if (xrayAnalysis) {
    imageRiskScore = (xrayAnalysis.pneumoniaProbability + xrayAnalysis.lungAbnormalityScore) / 2;
    if (xrayAnalysis.pneumoniaProbability > 0.7) {
      factors.push('High pneumonia probability detected');
    }
    if (xrayAnalysis.lungAbnormalityScore > 0.6) {
      factors.push('Significant lung abnormality observed');
    }
  }

  // Calculate vitals risk score
  if (vitals) {
    let vitalFactors = 0;
    
    if (vitals.spO2 < 94) {
      vitalFactors += 0.3;
      factors.push('Low oxygen saturation (SpO2 < 94%)');
    }
    if (vitals.temperature > 38) {
      vitalFactors += 0.2;
      factors.push('Elevated temperature (fever)');
    }
    if (vitals.heartRate > 100 || vitals.heartRate < 60) {
      vitalFactors += 0.15;
      factors.push('Abnormal heart rate');
    }
    if (vitals.respiratoryRate > 20) {
      vitalFactors += 0.2;
      factors.push('Elevated respiratory rate');
    }
    if (vitals.smokingHistory) {
      vitalFactors += 0.15;
      factors.push('Smoking history increases risk');
    }
    
    vitalsRiskScore = Math.min(vitalFactors, 1);
  }

  // Fuse scores
  const fusedScore = xrayAnalysis && vitals
    ? imageRiskScore * 0.6 + vitalsRiskScore * 0.4
    : xrayAnalysis
    ? imageRiskScore
    : vitalsRiskScore;

  // Determine risk level
  let overallRisk: 'low' | 'medium' | 'high';
  if (fusedScore >= 0.7) {
    overallRisk = 'high';
  } else if (fusedScore >= 0.4) {
    overallRisk = 'medium';
  } else {
    overallRisk = 'low';
  }

  // Generate explanation
  let explanation = '';
  if (overallRisk === 'high') {
    explanation = `High risk due to ${factors.slice(0, 2).join(' and ').toLowerCase()}. Immediate clinical attention recommended.`;
  } else if (overallRisk === 'medium') {
    explanation = `Moderate risk detected. ${factors[0] || 'Some indicators require monitoring'}. Follow-up assessment advised.`;
  } else {
    explanation = 'Low risk profile. Continue standard monitoring protocols.';
  }

  return {
    overallRisk,
    imageRiskScore: Math.round(imageRiskScore * 100),
    vitalsRiskScore: Math.round(vitalsRiskScore * 100),
    fusedScore: Math.round(fusedScore * 100),
    explanation,
    factors,
  };
}
