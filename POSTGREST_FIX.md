# PostgREST 스키마 캐시 문제 해결 가이드

## 문제
PostgREST가 `verification_codes` 테이블을 스키마 캐시에서 찾지 못하는 문제가 발생했습니다.

## 해결 방법

### 방법 1: Supabase 대시보드에서 API 재시작 (권장)

1. https://supabase.com/dashboard/project/sgmfdsutkehvsykxdzcd/settings/api 로 이동
2. **Restart API** 버튼 클릭
3. API가 재시작될 때까지 몇 초 기다림
4. 브라우저에서 페이지 새로고침

### 방법 2: 대기 후 재시도

PostgREST는 주기적으로(보통 1-2분마다) 스키마 캐시를 자동으로 새로고침합니다.
1. 몇 분 기다림
2. 브라우저를 완전히 새로고침 (Ctrl + Shift + R)
3. 다시 시도

### 방법 3: 브라우저 캐시 클리어

1. 개발자 도구 (F12) 열기
2. Network 탭에서 "Disable cache" 체크
3. 페이지 완전 새로고침 (Ctrl + Shift + R)

## 확인 방법

Supabase 대시보드에서:
- https://supabase.com/dashboard/project/sgmfdsutkehvsykxdzcd/editor
- `verification_codes` 테이블이 있는지 확인
- 테이블이 있으면 PostgREST 스키마 캐시 문제입니다

