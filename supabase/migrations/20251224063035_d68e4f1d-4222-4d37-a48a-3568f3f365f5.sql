-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('high_risk_alert', 'appointment_reminder', 'test_result', 'system')),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL,
  department TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create notifications" 
ON public.notifications FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Appointments policies
CREATE POLICY "Doctors can view all appointments" 
ON public.appointments FOR SELECT 
USING (public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Nurses can view all appointments" 
ON public.appointments FOR SELECT 
USING (public.has_role(auth.uid(), 'nurse'));

CREATE POLICY "Patients can view their own appointments" 
ON public.appointments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.patients p 
    WHERE p.id = patient_id AND p.created_by = auth.uid()
  )
);

CREATE POLICY "Doctors can create appointments" 
ON public.appointments FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'nurse'));

CREATE POLICY "Doctors can update appointments" 
ON public.appointments FOR UPDATE 
USING (public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'nurse'));

CREATE POLICY "Doctors can delete appointments" 
ON public.appointments FOR DELETE 
USING (public.has_role(auth.uid(), 'doctor'));

-- Trigger for appointments updated_at
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;