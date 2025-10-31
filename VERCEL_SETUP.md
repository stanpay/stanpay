# Vercel 환경 변수 설정 가이드

배포 환경에서 매직링크가 올바르게 작동하도록 Vercel 환경 변수를 설정하세요.

## 필수 환경 변수 설정

### Vercel 대시보드에서 설정

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard
   - 프로젝트 선택: `stanpay`

2. **Settings → Environment Variables**

3. **환경 변수 추가**
   - **Name**: `VITE_SITE_URL`
   - **Value**: `https://stanpay.vercel.app`
   - **Environment**: 
     - ✅ Production
     - ✅ Preview (선택사항, preview 배포도 지원하려면)
     - ⬜ Development (로컬 개발용이므로 불필요)

4. **Save** 클릭

### 또는 Vercel CLI로 설정

```bash
vercel env add VITE_SITE_URL production
# Value: https://stanpay.vercel.app
```

## 배포 재시작

환경 변수를 추가한 후:
1. 배포를 다시 트리거하거나
2. 자동으로 재배포되기를 기다리거나
3. 수동으로 Redeploy

## 확인

설정 후:
1. https://stanpay.vercel.app 에서 이메일 로그인 테스트
2. 수신한 이메일의 매직링크 클릭
3. `https://stanpay.vercel.app/main`으로 리다이렉트되는지 확인

## 중요 사항

- ✅ 환경 변수 설정 후 **반드시 재배포**해야 적용됩니다
- ✅ Vite는 빌드 타임에 환경 변수를 번들에 포함시킵니다
- ✅ 기존 배포에는 환경 변수가 포함되지 않으므로 재배포 필요
