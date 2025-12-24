-- Create lab tests reference table
CREATE TABLE public.lab_test_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  unit TEXT NOT NULL,
  category TEXT NOT NULL,
  min_normal NUMERIC,
  max_normal NUMERIC,
  critical_low NUMERIC,
  critical_high NUMERIC,
  description TEXT
);

-- Create lab results table
CREATE TABLE public.lab_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  test_type_id UUID NOT NULL REFERENCES public.lab_test_types(id),
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'normal' CHECK (status IN ('normal', 'low', 'high', 'critical_low', 'critical_high')),
  notes TEXT,
  ordered_by UUID,
  collected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resulted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lab_test_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;

-- Lab test types policies (read-only for all authenticated)
CREATE POLICY "Authenticated users can view lab test types" 
ON public.lab_test_types FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Lab results policies
CREATE POLICY "Staff can view all lab results" 
ON public.lab_results FOR SELECT 
USING (public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'nurse'));

CREATE POLICY "Staff can insert lab results" 
ON public.lab_results FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'nurse'));

CREATE POLICY "Staff can update lab results" 
ON public.lab_results FOR UPDATE 
USING (public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'nurse'));

-- Patient portal access - patients can view their linked records
CREATE POLICY "Patients can view their own lab results" 
ON public.lab_results FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.patients p 
    WHERE p.id = patient_id AND p.created_by = auth.uid()
  )
);

-- Add policy for patients to view their own medical records
CREATE POLICY "Patients can view their own medical records" 
ON public.medical_records FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.patients p 
    WHERE p.id = patient_id AND p.created_by = auth.uid()
  )
);

-- Add policy for patients to view their own scans
CREATE POLICY "Patients can view their own scans" 
ON public.medical_scans FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.patients p 
    WHERE p.id = patient_id AND p.created_by = auth.uid()
  )
);

-- Add policy for patients to view their own vitals
CREATE POLICY "Patients can view their own vitals" 
ON public.vitals FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.patients p 
    WHERE p.id = patient_id AND p.created_by = auth.uid()
  )
);

-- Add policy for patients to view their own patient record
CREATE POLICY "Patients can view their own patient record" 
ON public.patients FOR SELECT 
USING (created_by = auth.uid());

-- Insert common lab test types with reference ranges
INSERT INTO public.lab_test_types (name, code, unit, category, min_normal, max_normal, critical_low, critical_high, description) VALUES
('Hemoglobin', 'HGB', 'g/dL', 'Hematology', 12.0, 17.5, 7.0, 20.0, 'Protein in red blood cells that carries oxygen'),
('White Blood Cell Count', 'WBC', 'K/uL', 'Hematology', 4.5, 11.0, 2.0, 30.0, 'Infection-fighting cells'),
('Platelet Count', 'PLT', 'K/uL', 'Hematology', 150, 400, 50, 1000, 'Blood clotting cells'),
('Hematocrit', 'HCT', '%', 'Hematology', 36, 50, 20, 60, 'Percentage of red blood cells in blood'),
('Fasting Glucose', 'GLU', 'mg/dL', 'Chemistry', 70, 100, 40, 400, 'Blood sugar level'),
('HbA1c', 'A1C', '%', 'Chemistry', 4.0, 5.6, 3.0, 14.0, '3-month average blood sugar'),
('Creatinine', 'CREAT', 'mg/dL', 'Kidney', 0.7, 1.3, 0.3, 10.0, 'Kidney function marker'),
('Blood Urea Nitrogen', 'BUN', 'mg/dL', 'Kidney', 7, 20, 3, 100, 'Kidney function indicator'),
('eGFR', 'EGFR', 'mL/min', 'Kidney', 90, 120, 15, 150, 'Estimated glomerular filtration rate'),
('Total Cholesterol', 'CHOL', 'mg/dL', 'Lipid Panel', 0, 200, 0, 400, 'Total blood cholesterol'),
('LDL Cholesterol', 'LDL', 'mg/dL', 'Lipid Panel', 0, 100, 0, 300, 'Low-density lipoprotein'),
('HDL Cholesterol', 'HDL', 'mg/dL', 'Lipid Panel', 40, 60, 20, 100, 'High-density lipoprotein'),
('Triglycerides', 'TRIG', 'mg/dL', 'Lipid Panel', 0, 150, 0, 500, 'Blood fat levels'),
('AST', 'AST', 'U/L', 'Liver', 10, 40, 5, 1000, 'Liver enzyme'),
('ALT', 'ALT', 'U/L', 'Liver', 7, 56, 3, 1000, 'Liver enzyme'),
('Bilirubin Total', 'TBIL', 'mg/dL', 'Liver', 0.1, 1.2, 0, 15, 'Liver function marker'),
('TSH', 'TSH', 'mIU/L', 'Thyroid', 0.4, 4.0, 0.1, 10.0, 'Thyroid stimulating hormone'),
('Sodium', 'NA', 'mEq/L', 'Electrolytes', 136, 145, 120, 160, 'Electrolyte balance'),
('Potassium', 'K', 'mEq/L', 'Electrolytes', 3.5, 5.0, 2.5, 6.5, 'Electrolyte balance'),
('Calcium', 'CA', 'mg/dL', 'Electrolytes', 8.5, 10.5, 6.0, 14.0, 'Bone and nerve function');

-- Enable realtime for lab results
ALTER PUBLICATION supabase_realtime ADD TABLE public.lab_results;