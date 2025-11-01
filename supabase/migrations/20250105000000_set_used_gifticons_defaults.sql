-- Set default values for used_gifticons table
-- status의 기본값을 '판매중'으로 설정
-- seller_id의 기본값을 'admin'으로 설정

ALTER TABLE public.used_gifticons 
  ALTER COLUMN status SET DEFAULT '판매중';

ALTER TABLE public.used_gifticons 
  ALTER COLUMN seller_id SET DEFAULT 'admin';

