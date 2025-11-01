# Supabase verification_codes 테이블 생성 가이드

`verification_codes` 테이블이 PostgREST 스키마 캐시에 나타나지 않는 문제가 발생할 수 있습니다.

## 해결 방법

### 1. Supabase 대시보드에서 직접 SQL 실행

1. https://supabase.com/dashboard/project/sgmfdsutkehvsykxdzcd/sql/new 에 접속
2. 아래 SQL을 복사하여 실행:

```sql
-- Drop existing table if it exists (for clean migration)
DROP TABLE IF EXISTS public.verification_codes CASCADE;

-- Create verification_codes table for email verification
CREATE TABLE public.verification_codes (
  email TEXT NOT NULL PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX idx_verification_codes_email ON public.verification_codes(email);
CREATE INDEX idx_verification_codes_expires_at ON public.verification_codes(expires_at);

-- Enable RLS on verification_codes
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can insert verification codes" ON public.verification_codes;
DROP POLICY IF EXISTS "Anyone can read verification codes" ON public.verification_codes;
DROP POLICY IF EXISTS "Anyone can delete verification codes" ON public.verification_codes;

-- Create RLS policies
CREATE POLICY "Anyone can insert verification codes"
  ON public.verification_codes
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read verification codes"
  ON public.verification_codes
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can delete verification codes"
  ON public.verification_codes
  FOR DELETE
  USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.verification_codes TO anon, authenticated;
```

### 2. PostgREST 스키마 캐시 새로고침

SQL 실행 후:
1. Supabase 대시보드에서 **Settings** → **API**로 이동
2. 또는 API 재시작이 필요할 수 있습니다

### 3. 브라우저 캐시 클리어

1. 개발자 도구 (F12) 열기
2. Network 탭에서 "Disable cache" 체크
3. Ctrl + Shift + R (하드 리로드)

### 4. 개발 서버 재시작

```bash
npm run dev
```



