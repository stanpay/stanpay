# 배포 환경 설정 가이드

매직링크가 배포 환경에서 올바르게 작동하도록 설정하는 방법입니다.

## 환경 변수 설정

### 배포 플랫폼별 설정

배포 환경 변수에 `VITE_SITE_URL`을 추가하세요:

#### Vercel
1. 프로젝트 설정 → Environment Variables
2. Name: `VITE_SITE_URL`
3. Value: 배포된 사이트 URL (예: `https://your-app.vercel.app`)
4. Environment: Production

#### Netlify
1. Site settings → Environment variables
2. Key: `VITE_SITE_URL`
3. Value: 배포된 사이트 URL (예: `https://your-app.netlify.app`)
4. Scope: Production

#### 기타 플랫폼
배포 플랫폼의 환경 변수 설정에서 다음을 추가:
```
VITE_SITE_URL=https://your-domain.com
```

### 로컬 개발 환경

로컬 개발 시에는 `.env` 파일에 추가:
```env
# 로컬 개발용 (선택사항, 설정하지 않으면 자동으로 localhost 사용)
VITE_SITE_URL=http://localhost:5173
```

## Supabase Redirect URL 설정

Supabase 대시보드에서 배포 URL을 allowlist에 추가해야 합니다.

### 설정 방법

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard/project/scfkcmonaucfwigwtzfp/auth/url-configuration

2. **Site URL 설정**
   - **Site URL**: 배포된 프로덕션 URL 설정 (예: `https://your-app.vercel.app`)

3. **Redirect URLs 추가**
   - **Additional Redirect URLs**에 다음 추가:
     - `https://your-app.vercel.app/main` (또는 배포된 도메인/main)
     - 개발 환경용: `http://localhost:5173/main`

### Wildcard 사용 (선택사항)

여러 환경(프로덕션, 스테이징 등)을 지원하려면 wildcard를 사용할 수 있습니다:

```
https://your-app.vercel.app/**
http://localhost:5173/**
```

**주의**: 프로덕션 환경에서는 보안을 위해 정확한 URL을 사용하는 것을 권장합니다.

## 작동 원리

1. **개발 환경** (`VITE_SITE_URL` 미설정):
   - `window.location.origin` 사용 (예: `http://localhost:5173`)
   - 매직링크가 로컬 개발 서버로 리다이렉트

2. **배포 환경** (`VITE_SITE_URL` 설정됨):
   - 환경 변수의 URL 사용 (예: `https://your-app.vercel.app`)
   - 매직링크가 배포된 사이트로 리다이렉트

## 확인 사항

설정 후 다음을 확인하세요:

1. ✅ 환경 변수 `VITE_SITE_URL`이 배포 환경에 설정되어 있는지
2. ✅ Supabase 대시보드에서 배포 URL이 allowlist에 추가되어 있는지
3. ✅ 매직링크 클릭 시 배포된 사이트로 리다이렉트되는지
4. ✅ 로그인 후 `/main` 페이지로 정상 이동하는지

## 문제 해결

### 매직링크가 localhost로 리다이렉트되는 경우
- 배포 환경 변수 `VITE_SITE_URL`이 설정되어 있는지 확인
- 빌드 후 재배포 (환경 변수 변경 시 재빌드 필요)

### "redirect_to url is not allowed" 오류
- Supabase 대시보드의 redirect URL allowlist에 배포 URL이 추가되어 있는지 확인
- URL에 `/main` 경로까지 포함되어 있는지 확인

### 개발 환경에서 작동하지 않는 경우
- `.env` 파일에 `VITE_SITE_URL`이 설정되어 있다면 제거하거나 `http://localhost:5173`으로 설정
