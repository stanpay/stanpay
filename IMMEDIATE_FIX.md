# 🚨 즉시 해결: PostgREST 스키마 캐시 문제

## 현재 상황
PostgREST OpenAPI 스키마에 `verification_codes` 테이블이 **없습니다**.
이는 PostgREST가 테이블을 인식하지 못하고 있다는 의미입니다.

## 즉시 실행해야 할 작업

### 1단계: Supabase 대시보드에서 API 재시작 (필수)

**가장 중요합니다!**

1. **API 설정 페이지로 이동**
   ```
   https://supabase.com/dashboard/project/sgmfdsutkehvsykxdzcd/settings/api
   ```

2. **API 재시작**
   - 페이지를 스크롤하여 **"Restart API"** 버튼 찾기
   - 또는 Settings → Infrastructure → "Restart API"
   - **Restart API** 버튼 클릭

3. **재시작 완료 대기**
   - 10-30초 정도 소요
   - "API restarted successfully" 메시지 확인

4. **브라우저 완전 새로고침**
   - Ctrl + Shift + R (하드 리로드)
   - 또는 개발자 도구 → Network 탭 → "Disable cache" 체크 후 새로고침

5. **테스트**
   - 인증번호 발송 기능 다시 시도

## 2단계: 테이블 재확인 (API 재시작 후)

API 재시작 후에도 문제가 있으면:

1. **테이블 존재 확인**
   - https://supabase.com/dashboard/project/sgmfdsutkehvsykxdzcd/editor
   - `verification_codes` 테이블이 있는지 확인

2. **테이블이 없다면 다시 생성**
   - https://supabase.com/dashboard/project/sgmfdsutkehvsykxdzcd/sql/new
   - 아래 SQL 실행:

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

CREATE POLICY IF NOT EXISTS "Anyone can insert verification codes"
  ON public.verification_codes FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Anyone can read verification codes"
  ON public.verification_codes FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Anyone can delete verification codes"
  ON public.verification_codes FOR DELETE USING (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.verification_codes TO anon, authenticated;
```

3. **SQL 실행 후 다시 API 재시작**

## 확인 방법

PostgREST 스키마가 업데이트되었는지 확인:
- 브라우저 콘솔에서 404 오류가 사라져야 합니다
- 인증번호 발송이 성공해야 합니다

## 근본 원인

PostgREST는 스키마 정보를 캐시합니다:
- 테이블 생성 후 즉시 인식되지 않을 수 있음
- API 재시작을 통해 스키마 캐시를 강제로 새로고침해야 함
- 또는 1-2분 대기 후 자동으로 새로고침됨


