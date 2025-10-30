-- Create gifticons table
CREATE TABLE IF NOT EXISTS public.gifticons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  brand text NOT NULL,
  name text NOT NULL,
  original_price integer NOT NULL,
  image text NOT NULL,
  expiry_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('사용가능', '사용완료', '판매완료')),
  is_selling boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payment_history table
CREATE TABLE IF NOT EXISTS public.payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  store text NOT NULL,
  date date NOT NULL,
  time time NOT NULL,
  amount integer NOT NULL,
  method text NOT NULL,
  status text NOT NULL CHECK (status IN ('완료', '취소')),
  created_at timestamptz DEFAULT now()
);

-- Create user_settings table for toggles
CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  -- Points settings
  happy_point boolean DEFAULT false,
  cjone boolean DEFAULT false,
  lpoint boolean DEFAULT false,
  hpoint boolean DEFAULT false,
  -- Membership settings
  starbucks boolean DEFAULT false,
  paik boolean DEFAULT false,
  twosome boolean DEFAULT false,
  mega_coffee boolean DEFAULT false,
  compose_coffee boolean DEFAULT false,
  ediya boolean DEFAULT false,
  -- Carrier settings
  skt boolean DEFAULT false,
  kt boolean DEFAULT false,
  lg_uplus boolean DEFAULT false,
  -- Payment methods
  kakaopay boolean DEFAULT false,
  samsungpay boolean DEFAULT false,
  naverpay boolean DEFAULT false,
  payco boolean DEFAULT false,
  tosspay boolean DEFAULT false,
  kbpay boolean DEFAULT false,
  shinhan boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gifticons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gifticons
CREATE POLICY "Users can view their own gifticons"
  ON public.gifticons FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own gifticons"
  ON public.gifticons FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gifticons"
  ON public.gifticons FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own gifticons"
  ON public.gifticons FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for payment_history
CREATE POLICY "Users can view their own payment history"
  ON public.payment_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment history"
  ON public.payment_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_settings
CREATE POLICY "Users can view their own settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Create trigger to update updated_at
CREATE TRIGGER update_gifticons_updated_at
  BEFORE UPDATE ON public.gifticons
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create function to automatically create user_settings when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger for new user settings
CREATE TRIGGER on_auth_user_created_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_settings();