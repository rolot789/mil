-- Create mil_db table for storing military barcode entries
-- This table stores id (military ID) and serial (6-digit code) pairs

CREATE TABLE IF NOT EXISTS public.mil_db (
  id TEXT PRIMARY KEY,
  serial TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Since this is an internal admin tool without user auth,
-- we disable RLS and allow public access via anon key
ALTER TABLE public.mil_db DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.mil_db TO anon;
GRANT ALL ON public.mil_db TO authenticated;

-- Insert sample data (same as original list.json)
INSERT INTO public.mil_db (id, serial) VALUES
  ('25-72000001', '123456'),
  ('25-72000002', '234567'),
  ('25-72000003', '345678'),
  ('25-72000004', '456789'),
  ('25-72000005', '567890')
ON CONFLICT (id) DO NOTHING;
