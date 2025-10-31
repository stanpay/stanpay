-- Create verification_codes table for email verification
CREATE TABLE IF NOT EXISTS public.verification_codes (
  email TEXT NOT NULL PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON public.verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON public.verification_codes(expires_at);

-- Enable RLS on verification_codes
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert verification codes (for email verification)
CREATE POLICY "Anyone can insert verification codes"
  ON public.verification_codes
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to read verification codes (for verification)
CREATE POLICY "Anyone can read verification codes"
  ON public.verification_codes
  FOR SELECT
  USING (true);

-- Allow anyone to delete verification codes (after verification)
CREATE POLICY "Anyone can delete verification codes"
  ON public.verification_codes
  FOR DELETE
  USING (true);
