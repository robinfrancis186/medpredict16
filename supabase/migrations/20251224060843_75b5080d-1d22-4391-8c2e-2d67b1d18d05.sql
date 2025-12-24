-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('doctor', 'nurse', 'patient');

-- Create enum for gender
CREATE TYPE public.gender_type AS ENUM ('male', 'female', 'other');

-- Create enum for record types
CREATE TYPE public.record_type AS ENUM ('discharge_summary', 'diagnosis', 'xray_report', 'ct_report', 'prescription', 'lab_result', 'mri_report', 'ultrasound_report', 'blood_test', 'ecg_report');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'patient',
  UNIQUE (user_id, role)
);

-- Create patients table
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age > 0 AND age < 150),
  gender gender_type NOT NULL,
  blood_group TEXT NOT NULL,
  emergency_contact TEXT NOT NULL,
  allergies TEXT[] DEFAULT '{}',
  chronic_conditions TEXT[] DEFAULT '{}',
  email TEXT,
  phone TEXT,
  address TEXT,
  date_of_birth DATE,
  avatar_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create vitals table
CREATE TABLE public.vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  spo2 INTEGER CHECK (spo2 >= 0 AND spo2 <= 100),
  temperature DECIMAL(4,1) CHECK (temperature >= 30 AND temperature <= 45),
  heart_rate INTEGER CHECK (heart_rate >= 20 AND heart_rate <= 300),
  respiratory_rate INTEGER CHECK (respiratory_rate >= 5 AND respiratory_rate <= 60),
  blood_pressure_systolic INTEGER CHECK (blood_pressure_systolic >= 50 AND blood_pressure_systolic <= 300),
  blood_pressure_diastolic INTEGER CHECK (blood_pressure_diastolic >= 30 AND blood_pressure_diastolic <= 200),
  smoking_history BOOLEAN DEFAULT false,
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create medical_scans table (for X-rays, CT, MRI, etc.)
CREATE TABLE public.medical_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  scan_type TEXT NOT NULL DEFAULT 'xray',
  image_url TEXT,
  heatmap_url TEXT,
  diagnosis_probability DECIMAL(4,3),
  abnormality_score DECIMAL(4,3),
  confidence_score DECIMAL(4,3),
  inference_time DECIMAL(5,2),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  ai_explanation TEXT,
  ai_factors TEXT[],
  notes TEXT,
  analyzed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create medical_records table
CREATE TABLE public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  type record_type NOT NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  hospital TEXT,
  file_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create analysis_reports table (for PDF exports)
CREATE TABLE public.analysis_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  scan_id UUID REFERENCES public.medical_scans(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL DEFAULT 'xray_analysis',
  report_data JSONB,
  pdf_url TEXT,
  generated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_reports ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    public.has_role(auth.uid(), 'doctor') OR 
    public.has_role(auth.uid(), 'nurse')
  );

-- User roles policies
CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own role during signup"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Patients policies (doctors and nurses can CRUD, patients read-only for own records)
CREATE POLICY "Staff can view all patients"
  ON public.patients FOR SELECT
  USING (
    public.has_role(auth.uid(), 'doctor') OR 
    public.has_role(auth.uid(), 'nurse')
  );

CREATE POLICY "Staff can insert patients"
  ON public.patients FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'doctor') OR 
    public.has_role(auth.uid(), 'nurse')
  );

CREATE POLICY "Staff can update patients"
  ON public.patients FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'doctor') OR 
    public.has_role(auth.uid(), 'nurse')
  );

CREATE POLICY "Staff can delete patients"
  ON public.patients FOR DELETE
  USING (public.has_role(auth.uid(), 'doctor'));

-- Vitals policies
CREATE POLICY "Staff can view all vitals"
  ON public.vitals FOR SELECT
  USING (
    public.has_role(auth.uid(), 'doctor') OR 
    public.has_role(auth.uid(), 'nurse')
  );

CREATE POLICY "Staff can insert vitals"
  ON public.vitals FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'doctor') OR 
    public.has_role(auth.uid(), 'nurse')
  );

CREATE POLICY "Staff can update vitals"
  ON public.vitals FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'doctor') OR 
    public.has_role(auth.uid(), 'nurse')
  );

-- Medical scans policies
CREATE POLICY "Staff can view all scans"
  ON public.medical_scans FOR SELECT
  USING (
    public.has_role(auth.uid(), 'doctor') OR 
    public.has_role(auth.uid(), 'nurse')
  );

CREATE POLICY "Staff can insert scans"
  ON public.medical_scans FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'doctor') OR 
    public.has_role(auth.uid(), 'nurse')
  );

CREATE POLICY "Staff can update scans"
  ON public.medical_scans FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'doctor') OR 
    public.has_role(auth.uid(), 'nurse')
  );

-- Medical records policies
CREATE POLICY "Staff can view all records"
  ON public.medical_records FOR SELECT
  USING (
    public.has_role(auth.uid(), 'doctor') OR 
    public.has_role(auth.uid(), 'nurse')
  );

CREATE POLICY "Staff can insert records"
  ON public.medical_records FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'doctor') OR 
    public.has_role(auth.uid(), 'nurse')
  );

CREATE POLICY "Staff can update records"
  ON public.medical_records FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'doctor') OR 
    public.has_role(auth.uid(), 'nurse')
  );

-- Analysis reports policies
CREATE POLICY "Staff can view all reports"
  ON public.analysis_reports FOR SELECT
  USING (
    public.has_role(auth.uid(), 'doctor') OR 
    public.has_role(auth.uid(), 'nurse')
  );

CREATE POLICY "Doctors can insert reports"
  ON public.analysis_reports FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'doctor'));

-- Create storage buckets for medical files
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-scans', 'medical-scans', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-records', 'medical-records', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies for medical-scans
CREATE POLICY "Staff can view medical scans"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'medical-scans' AND (
    public.has_role(auth.uid(), 'doctor') OR 
    public.has_role(auth.uid(), 'nurse')
  ));

CREATE POLICY "Staff can upload medical scans"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'medical-scans' AND (
    public.has_role(auth.uid(), 'doctor') OR 
    public.has_role(auth.uid(), 'nurse')
  ));

-- Storage policies for medical-records
CREATE POLICY "Staff can view medical records files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'medical-records' AND (
    public.has_role(auth.uid(), 'doctor') OR 
    public.has_role(auth.uid(), 'nurse')
  ));

CREATE POLICY "Staff can upload medical records files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'medical-records' AND (
    public.has_role(auth.uid(), 'doctor') OR 
    public.has_role(auth.uid(), 'nurse')
  ));

-- Storage policies for avatars
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'patient')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();