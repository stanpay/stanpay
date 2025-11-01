# PostgREST 스키마 캐시 문제 - 즉시 해결 방법

## 문제
PostgREST가 `verification_codes` 테이블을 스키마 캐시에서 찾지 못하고 있습니다.
테이블은 생성되었지만 PostgREST가 이를 인식하지 못하는 상황입니다.

## 즉시 해결 방법 (필수)

### 1단계: Supabase 대시보드에서 API 재시작

**가장 중요하고 효과적인 방법입니다.**

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard/project/sgmfdsutkehvsykxdzcd/settings/api

2. **API 재시작**
   - 페이지 하단의 **"Restart API"** 또는 **"Restart"** 버튼 클릭
   - 또는 Settings → API → "Restart API" 버튼

3. **재시작 완료 대기**
   - 몇 초에서 수십 초 소요
   - 재시작 완료 메시지 확인

4. **브라우저 새로고침**
   - Ctrl + Shift + R (하드 리로드)
   - 또는 브라우저 완전 종료 후 재시작

5. **테스트**
   - 인증번호 발송 기능 다시 시도

## 추가 확인 사항

### 테이블 존재 확인

Supabase 대시보드에서:
- https://supabase.com/dashboard/project/sgmfdsutkehvsykxdzcd/editor
- 왼쪽 사이드바에서 `verification_codes` 테이블이 보이는지 확인
- 테이블이 있으면 → PostgREST 스키마 캐시 문제 확정

### 테이블이 없는 경우

테이블이 없다면 다시 생성:
- https://supabase.com/dashboard/project/sgmfdsutkehvsykxdzcd/sql/new
- `supabase/migrations/20251031012000_fix_verification_codes.sql` 파일의 SQL 실행

## 왜 이런 문제가 발생하나요?

PostgREST는 성능을 위해 스키마 정보를 캐시합니다:
- 테이블 생성 직후에는 캐시에 반영되지 않을 수 있음
- 스키마 캐시는 주기적으로(1-2분마다) 자동 새로고침됨
- 하지만 즉시 반영하려면 API 재시작이 필요함

## 재시작 후에도 문제가 있으면?

1. 몇 분 더 기다림 (자동 새로고침 대기)
2. Supabase 프로젝트 전체 재시작
3. Supabase 지원팀에 문의


