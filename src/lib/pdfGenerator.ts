import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PatientData {
  name: string;
  age: number;
  gender: string;
  bloodGroup: string;
  allergies: string[];
  chronicConditions: string[];
}

interface VitalsData {
  spO2: number;
  temperature: number;
  heartRate: number;
  respiratoryRate: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  smokingHistory: boolean;
  recordedAt: string;
}

interface ScanData {
  scanType: string;
  diagnosisProbability: number;
  abnormalityScore: number;
  confidenceScore: number;
  inferenceTime: number;
  riskLevel: string;
  aiExplanation: string;
  aiFactors: string[];
  createdAt: string;
}

interface RiskAssessment {
  overallRisk: string;
  fusedScore: number;
  explanation: string;
  factors: string[];
}

export function generateAnalysisReport(
  patient: PatientData,
  vitals: VitalsData | null,
  scan: ScanData | null,
  risk: RiskAssessment,
  generatedBy: string
): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header
  doc.setFillColor(31, 79, 216);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('MedPredict', 20, 25);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('AI-Powered Clinical Decision Support', 20, 33);

  // Report title and date
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, pageWidth - 80, 25);
  doc.text(`By: ${generatedBy}`, pageWidth - 80, 33);

  yPos = 55;

  // Patient Information Section
  doc.setTextColor(31, 79, 216);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Patient Information', 20, yPos);

  yPos += 10;

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const patientInfo = [
    ['Name', patient.name],
    ['Age', `${patient.age} years`],
    ['Gender', patient.gender],
    ['Blood Group', patient.bloodGroup],
    ['Allergies', patient.allergies.length > 0 ? patient.allergies.join(', ') : 'None reported'],
    ['Chronic Conditions', patient.chronicConditions.length > 0 ? patient.chronicConditions.join(', ') : 'None reported'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: patientInfo,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 120 },
    },
    margin: { left: 20, right: 20 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Vitals Section (if available)
  if (vitals) {
    doc.setTextColor(31, 79, 216);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Patient Vitals', 20, yPos);

    yPos += 10;

    const vitalsData = [
      ['SpO₂', `${vitals.spO2}%`, vitals.spO2 < 94 ? 'LOW' : 'Normal'],
      ['Temperature', `${vitals.temperature}°C`, vitals.temperature > 38 ? 'ELEVATED' : 'Normal'],
      ['Heart Rate', `${vitals.heartRate} bpm`, vitals.heartRate > 100 || vitals.heartRate < 60 ? 'ABNORMAL' : 'Normal'],
      ['Respiratory Rate', `${vitals.respiratoryRate} /min`, vitals.respiratoryRate > 20 ? 'ELEVATED' : 'Normal'],
      ['Blood Pressure', `${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic} mmHg`, 'Recorded'],
      ['Smoking History', vitals.smokingHistory ? 'Yes' : 'No', vitals.smokingHistory ? 'Risk Factor' : '-'],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Vital Sign', 'Value', 'Status']],
      body: vitalsData,
      theme: 'striped',
      headStyles: { fillColor: [31, 182, 166], textColor: [255, 255, 255] },
      styles: { fontSize: 10, cellPadding: 4 },
      margin: { left: 20, right: 20 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // AI Analysis Section (if available)
  if (scan) {
    doc.setTextColor(31, 79, 216);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`AI ${scan.scanType.toUpperCase()} Analysis`, 20, yPos);

    yPos += 10;

    const analysisData = [
      ['Scan Type', scan.scanType.toUpperCase()],
      ['Diagnosis Probability', `${Math.round(scan.diagnosisProbability * 100)}%`],
      ['Abnormality Score', `${Math.round(scan.abnormalityScore * 100)}%`],
      ['Model Confidence', `${Math.round(scan.confidenceScore * 100)}%`],
      ['Inference Time', `${scan.inferenceTime.toFixed(1)}s`],
      ['Analysis Date', new Date(scan.createdAt).toLocaleDateString()],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [],
      body: analysisData,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 80 },
      },
      margin: { left: 20, right: 20 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Risk Assessment Section
  doc.setTextColor(31, 79, 216);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Risk Assessment', 20, yPos);

  yPos += 10;

  // Risk level box
  const riskColors: Record<string, [number, number, number]> = {
    low: [34, 197, 94],
    medium: [245, 158, 11],
    high: [220, 38, 38],
  };

  const riskColor = riskColors[risk.overallRisk] || [128, 128, 128];
  doc.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.roundedRect(20, yPos, 60, 20, 3, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`${risk.overallRisk.toUpperCase()} RISK`, 50, yPos + 13, { align: 'center' });

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(16);
  doc.text(`${risk.fusedScore}%`, 100, yPos + 13);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Fused Risk Score', 100, yPos + 20);

  yPos += 30;

  // Risk explanation
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  const splitExplanation = doc.splitTextToSize(risk.explanation, pageWidth - 40);
  doc.text(splitExplanation, 20, yPos);

  yPos += splitExplanation.length * 5 + 10;

  // Risk factors
  if (risk.factors.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('Contributing Factors:', 20, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    risk.factors.forEach((factor) => {
      doc.text(`• ${factor}`, 25, yPos);
      yPos += 6;
    });
  }

  // Clinical Disclaimer
  yPos = doc.internal.pageSize.getHeight() - 50;

  doc.setFillColor(254, 243, 199);
  doc.rect(15, yPos - 5, pageWidth - 30, 35, 'F');

  doc.setTextColor(180, 83, 9);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('CLINICAL DISCLAIMER', 20, yPos + 3);

  doc.setFont('helvetica', 'normal');
  const disclaimer = 'This report is generated by an AI-powered clinical decision support system intended to assist healthcare professionals. It does not provide a medical diagnosis and should not be used as a substitute for professional clinical judgment, examination, or standard diagnostic procedures. Final clinical decisions must be made by qualified healthcare providers.';
  const splitDisclaimer = doc.splitTextToSize(disclaimer, pageWidth - 45);
  doc.text(splitDisclaimer, 20, yPos + 10);

  // Footer
  doc.setTextColor(128, 128, 128);
  doc.setFontSize(8);
  doc.text(`MedPredict Clinical Report - Confidential - Page 1 of 1`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

  return doc;
}

export function downloadPdf(doc: jsPDF, filename: string) {
  doc.save(filename);
}
