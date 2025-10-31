-- Create used_gifticons table for second-hand gifticon marketplace
CREATE TABLE IF NOT EXISTS public.used_gifticons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  available_at text NOT NULL,
  expiry_date date NOT NULL,
  barcode text NOT NULL,
  original_price integer NOT NULL,
  sale_price integer NOT NULL,
  status text NOT NULL CHECK (status IN ('판매중', '대기중', '판매완료')),
  reserved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reserved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.used_gifticons ENABLE ROW LEVEL SECURITY;

-- Create index for reserved_at for auto-release functionality
CREATE INDEX IF NOT EXISTS idx_used_gifticons_reserved_at 
  ON public.used_gifticons(reserved_at) 
  WHERE status = '대기중';

-- Create index for status and sale_price for efficient querying
CREATE INDEX IF NOT EXISTS idx_used_gifticons_status_sale_price 
  ON public.used_gifticons(status, sale_price);

-- RLS Policies for used_gifticons
-- Only operators (sellers) can insert
CREATE POLICY "Only operators can insert used_gifticons"
  ON public.used_gifticons FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = COALESCE(
        current_setting('app.operator_email', true),
        (SELECT email FROM public.profiles WHERE id = auth.uid() LIMIT 1)
      )
    )
  );

-- All authenticated users can view items with status '판매중'
CREATE POLICY "Authenticated users can view available gifticons"
  ON public.used_gifticons FOR SELECT
  USING (
    auth.role() = 'authenticated' 
    AND status = '판매중'
  );

-- Users can update their own reserved items
CREATE POLICY "Users can update their reserved gifticons"
  ON public.used_gifticons FOR UPDATE
  USING (auth.uid() = reserved_by)
  WITH CHECK (auth.uid() = reserved_by);

-- Create trigger to update updated_at
CREATE TRIGGER update_used_gifticons_updated_at
  BEFORE UPDATE ON public.used_gifticons
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

