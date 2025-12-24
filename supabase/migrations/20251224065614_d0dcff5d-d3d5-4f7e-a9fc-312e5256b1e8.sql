-- Add unique patient_id for readable identification
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS patient_id TEXT UNIQUE;

-- Create a function to generate unique patient IDs
CREATE OR REPLACE FUNCTION public.generate_patient_id()
RETURNS TRIGGER AS $$
DECLARE
  new_id TEXT;
  prefix TEXT;
BEGIN
  -- Generate a unique patient ID like MED-2024-00001
  prefix := 'MED-' || EXTRACT(YEAR FROM NOW())::TEXT || '-';
  SELECT prefix || LPAD((COALESCE(MAX(SUBSTRING(patient_id FROM 10)::INTEGER), 0) + 1)::TEXT, 5, '0')
  INTO new_id
  FROM public.patients
  WHERE patient_id LIKE prefix || '%';
  
  NEW.patient_id := new_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-generate patient_id on insert
DROP TRIGGER IF EXISTS generate_patient_id_trigger ON public.patients;
CREATE TRIGGER generate_patient_id_trigger
  BEFORE INSERT ON public.patients
  FOR EACH ROW
  WHEN (NEW.patient_id IS NULL)
  EXECUTE FUNCTION public.generate_patient_id();

-- Update handle_new_user to link patient by email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  
  -- Create user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'patient')
  );
  
  -- If user is a patient and a patient record with matching email exists, link it
  IF COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'patient') = 'patient' THEN
    UPDATE public.patients 
    SET created_by = NEW.id
    WHERE LOWER(email) = LOWER(NEW.email)
      AND created_by IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Also update existing patients without patient_id
DO $$
DECLARE
  patient_record RECORD;
  new_id TEXT;
  counter INTEGER := 1;
BEGIN
  FOR patient_record IN 
    SELECT id FROM public.patients WHERE patient_id IS NULL ORDER BY created_at
  LOOP
    new_id := 'MED-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(counter::TEXT, 5, '0');
    UPDATE public.patients SET patient_id = new_id WHERE id = patient_record.id;
    counter := counter + 1;
  END LOOP;
END $$;