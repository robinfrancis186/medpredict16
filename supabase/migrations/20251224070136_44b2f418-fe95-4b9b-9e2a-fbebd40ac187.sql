-- Add approval status to patients table
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'approved';

-- Add constraint for valid statuses
ALTER TABLE public.patients 
ADD CONSTRAINT valid_approval_status 
CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Update RLS to allow patients to insert their own records (pending approval)
CREATE POLICY "Patients can insert own pending record"
ON public.patients
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND created_by = auth.uid()
  AND approval_status = 'pending'
);

-- Patients can only view approved records or their own pending records
DROP POLICY IF EXISTS "Patients can view their own patient record" ON public.patients;
CREATE POLICY "Patients can view their own patient record"
ON public.patients
FOR SELECT
USING (
  created_by = auth.uid() 
  AND (approval_status = 'approved' OR approval_status = 'pending')
);

-- Staff can update patient approval status
DROP POLICY IF EXISTS "Staff can update patients" ON public.patients;
CREATE POLICY "Staff can update patients"
ON public.patients
FOR UPDATE
USING (has_role(auth.uid(), 'doctor'::app_role) OR has_role(auth.uid(), 'nurse'::app_role));