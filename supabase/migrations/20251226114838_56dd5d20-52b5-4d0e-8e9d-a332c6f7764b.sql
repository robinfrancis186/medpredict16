-- Add scan_annotations table for collaborative annotations
CREATE TABLE public.scan_annotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id UUID NOT NULL REFERENCES public.medical_scans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  annotation_type TEXT NOT NULL DEFAULT 'marker', -- marker, region, text, freehand
  x_position FLOAT NOT NULL,
  y_position FLOAT NOT NULL,
  width FLOAT,
  height FLOAT,
  content TEXT,
  color TEXT DEFAULT '#ff0000',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scan_annotations ENABLE ROW LEVEL SECURITY;

-- Staff can view all annotations
CREATE POLICY "Staff can view scan annotations"
  ON public.scan_annotations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('doctor', 'nurse')
    )
  );

-- Staff can create annotations
CREATE POLICY "Staff can create annotations"
  ON public.scan_annotations
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('doctor', 'nurse')
    )
  );

-- Users can update their own annotations
CREATE POLICY "Users can update own annotations"
  ON public.scan_annotations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own annotations
CREATE POLICY "Users can delete own annotations"
  ON public.scan_annotations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime for annotations
ALTER PUBLICATION supabase_realtime ADD TABLE public.scan_annotations;

-- Add trigger for updated_at
CREATE TRIGGER update_scan_annotations_updated_at
  BEFORE UPDATE ON public.scan_annotations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();