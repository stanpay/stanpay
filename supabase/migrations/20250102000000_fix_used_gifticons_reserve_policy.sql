-- Fix RLS policy for used_gifticons to allow users to reserve and release gifticons
-- 문제: 기존 UPDATE 정책은 reserved_by를 NULL로 설정하는 것을 허용하지 않음
-- 해결: 
-- 1. "판매중" 상태의 기프티콘을 예약(대기중으로 변경)할 수 있는 정책 추가
-- 2. 기존 정책 수정하여 예약 해제도 허용

-- 사용자가 "판매중" 상태의 기프티콘을 예약할 수 있도록 허용
CREATE POLICY "Users can reserve available gifticons"
  ON public.used_gifticons FOR UPDATE
  USING (
    -- 기존 행 조건: status가 '판매중'이고 reserved_by가 NULL
    status = '판매중' 
    AND reserved_by IS NULL
    AND auth.role() = 'authenticated'
  )
  WITH CHECK (
    -- 새 행 조건: reserved_by가 현재 사용자로 설정되고 status가 '대기중'
    auth.uid() = reserved_by
    AND status = '대기중'
  );

-- 기존 정책 수정: 예약 해제 및 결제 완료 처리 허용
DROP POLICY IF EXISTS "Users can update their reserved gifticons" ON public.used_gifticons;

CREATE POLICY "Users can update their reserved gifticons"
  ON public.used_gifticons FOR UPDATE
  USING (
    -- 기존 행: reserved_by가 현재 사용자와 일치
    auth.uid() = reserved_by
  )
  WITH CHECK (
    -- 새 행 조건들:
    -- 1. 예약 해제: reserved_by가 NULL이고 status가 '판매중'
    -- 2. 결제 완료: reserved_by가 현재 사용자이고 status가 '판매완료'
    -- 3. 일반 업데이트: reserved_by가 현재 사용자와 일치
    (reserved_by IS NULL AND status = '판매중')
    OR (auth.uid() = reserved_by AND status IN ('대기중', '판매완료'))
  );

