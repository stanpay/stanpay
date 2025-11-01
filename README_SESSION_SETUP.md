# 세션 만료 시간 설정 가이드

## 로그아웃 감지 및 리다이렉트

로그인 상태에서 로그아웃이 감지되면 자동으로 로그인 페이지로 이동합니다.
- Main.tsx와 Payment.tsx에서 `INITIAL_SESSION` 이벤트를 감지하여 로그아웃 처리
- `SIGNED_OUT` 이벤트도 처리하여 로그아웃 감지

## Supabase 세션 만료 시간 설정 (7일)

### 방법 1: 스크립트 실행 (권장)

프로젝트 루트에 있는 `update-jwt-expiry.js` 스크립트를 실행하세요:

```bash
# Supabase Access Token 설정 (Supabase 대시보드에서 발급)
# https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN="your-access-token"

# 스크립트 실행
node update-jwt-expiry.js
```

### 방법 2: Supabase 대시보드에서 수동 설정

1. Supabase 대시보드에 로그인
2. 프로젝트 선택: `scfkcmonaucfwigwtzfp`
3. **Authentication** → **Settings** → **JWT Settings** 이동
4. **JWT Expiry** 필드를 `604800`초 (7일)로 설정
5. **Save** 클릭

### 확인

설정이 완료되면 새로운 로그인부터 7일간 세션이 유지됩니다.
기존 세션은 만료 시간이 지나면 갱신됩니다.

