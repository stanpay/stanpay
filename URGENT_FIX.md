# 🚨 긴급 해결: verification_codes 테이블 문제

## 현재 상황
PostgREST OpenAPI 스키마에 `verification_codes` 테이블이 **없습니다**.
이로 인해 인증번호 발송이 실패하고 있습니다.

## 즉시 실행할 작업

### 1단계: Supabase 대시보드에서 API 재시작 (필수 - 가장 중요)

**이것이 가장 빠르고 확실한 해결 방법입니다!**

1. **Supabase 대시보드 접속**
   ```
   https://supabase.com/dashboard/project/sgmfdsutkehvsykxdzcd/settings/api
   ```

2. **API 재시작**
   - 페이지 하단 또는 Infrastructure 섹션에서
   - **"Restart API"** 또는 **"Restart"** 버튼 클릭
   - 재시작 완료까지 10-30초 대기

3. **브라우저 완전 새로고침**
   - Ctrl + Shift + R (Windows/Linux)
   - Cmd + Shift + R (Mac)

4. **테스트**
   - 인증번호 발송 기능 다시 시도

### 2단계: API 재시작 후에도 실패하면

테이블이 실제로 생성되지 않았을 수 있습니다.

1. **Supabase SQL Editor 접속**
   ```
   https://supabase.com/dashboard/project/sgmfdsutkehvsykxdzcd/sql/new
   ```

2. **아래 SQL 실행**
```sql
CREATE TABLE IF NOT EXISTS public.verification_codes (
  email TEXT NOT NULL PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON public.verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON public.verification_codes(expires_at);

ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert verification codes" ON public.verification_codes;
DROP POLICY IF EXISTS "Anyone can read verification codes" ON public.verification_codes;
DROP POLICY IF EXISTS "Anyone can delete verification codes" ON public.verification_codes;

CREATE POLICY "Anyone can insert verification codes"
  ON public.verification_codes FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read verification codes"
  ON public.verification_codes FOR SELECT USING (true);

CREATE POLICY "Anyone can delete verification codes"
  ON public.verification_codes FOR DELETE USING (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.verification_codes TO anon, authenticated;
```

3. **SQL 실행 후 다시 API 재시작**

## 확인 방법

PostgREST 스키마가 업데이트되었는지 확인:
1. 브라우저 콘솔에서 404 오류가 사라져야 함
2. 인증번호 발송이 성공해야 함

## 원인

- PostgREST는 스키마 정보를 캐시합니다
- 테이블 생성 후 즉시 인식되지 않을 수 있습니다
- API 재시작을 통해 스키마 캐시를 강제로 새로고침해야 합니다


