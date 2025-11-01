-- stores 테이블 데이터 입력 예시 SQL
-- 이 SQL을 Supabase 대시보드에서 실행하거나, 필요에 따라 수정하여 사용하세요.

-- 1. 투썸플레이스 매장 예시
INSERT INTO public.stores (
  franchise_id,
  name,
  kakao_place_id,
  gifticon_available,
  local_currency_available,
  parking_available,
  free_parking,
  parking_size
)
SELECT 
  f.id,
  '투썸플레이스 강남역점',
  '12345678', -- 실제 Kakao Maps place.id로 교체 필요
  true,  -- 기프티콘 사용가능
  false, -- 지역화폐 사용불가
  true,  -- 주차가능
  false, -- 무료주차 아님
  '보통' -- 주차장 규모: '넓음', '보통', '좁음' 중 선택
FROM public.franchises f
WHERE f.name = '투썸플레이스'
LIMIT 1
ON CONFLICT (kakao_place_id) DO UPDATE
SET 
  name = EXCLUDED.name,
  gifticon_available = EXCLUDED.gifticon_available,
  local_currency_available = EXCLUDED.local_currency_available,
  parking_available = EXCLUDED.parking_available,
  free_parking = EXCLUDED.free_parking,
  parking_size = EXCLUDED.parking_size;

-- 2. 파스쿠찌 매장 예시
INSERT INTO public.stores (
  franchise_id,
  name,
  kakao_place_id,
  gifticon_available,
  local_currency_available,
  parking_available,
  free_parking,
  parking_size
)
SELECT 
  f.id,
  '파스쿠찌 삼성점',
  '87654321', -- 실제 Kakao Maps place.id로 교체 필요
  true,  -- 기프티콘 사용가능
  true,  -- 지역화폐 사용가능
  true,  -- 주차가능
  true,  -- 무료주차
  '넓음' -- 주차장 규모
FROM public.franchises f
WHERE f.name = '파스쿠찌'
LIMIT 1
ON CONFLICT (kakao_place_id) DO UPDATE
SET 
  name = EXCLUDED.name,
  gifticon_available = EXCLUDED.gifticon_available,
  local_currency_available = EXCLUDED.local_currency_available,
  parking_available = EXCLUDED.parking_available,
  free_parking = EXCLUDED.free_parking,
  parking_size = EXCLUDED.parking_size;

-- 3. 여러 매장을 한 번에 입력하는 예시 (배치 입력)
-- Main 페이지에서 검색된 매장 정보를 기반으로 입력할 수 있습니다.
-- 예: 투썸플레이스 매장들
INSERT INTO public.stores (
  franchise_id,
  name,
  kakao_place_id,
  gifticon_available,
  local_currency_available,
  parking_available,
  free_parking,
  parking_size
)
VALUES
  (
    (SELECT id FROM public.franchises WHERE name = '투썸플레이스' LIMIT 1),
    '투썸플레이스 논현점',
    '11111111', -- 실제 place.id
    true,
    false,
    true,
    false,
    '보통'
  ),
  (
    (SELECT id FROM public.franchises WHERE name = '투썸플레이스' LIMIT 1),
    '투썸플레이스 선릉점',
    '22222222', -- 실제 place.id
    true,
    true,
    true,
    true,
    '넓음'
  )
ON CONFLICT (kakao_place_id) DO UPDATE
SET 
  name = EXCLUDED.name,
  gifticon_available = EXCLUDED.gifticon_available,
  local_currency_available = EXCLUDED.local_currency_available,
  parking_available = EXCLUDED.parking_available,
  free_parking = EXCLUDED.free_parking,
  parking_size = EXCLUDED.parking_size;

-- 4. 현재 입력된 매장 데이터 확인
SELECT 
  s.id,
  f.name as franchise_name,
  s.name as store_name,
  s.kakao_place_id,
  s.gifticon_available,
  s.local_currency_available,
  s.parking_available,
  s.free_parking,
  s.parking_size
FROM public.stores s
JOIN public.franchises f ON s.franchise_id = f.id
ORDER BY f.name, s.name;

