# 스탠(Stan) - 결제의 기준이 되다

심플하고 스마트한 결제 플랫폼입니다.

## 프로젝트 개요

스탠(Stan)은 기프티콘, 멤버십 할인, 포인트 적립을 통합하여 최적의 결제 방법을 제안하는 결제 플랫폼입니다.

## 기술 스택

- **Frontend**
  - Vite
  - React 18
  - TypeScript
  - Tailwind CSS
  - shadcn/ui
  - React Router

- **Backend & Database**
  - Supabase (PostgreSQL, Authentication, Storage)
  - Supabase Functions (Edge Functions)

## 시작하기

### 사전 요구사항

- Node.js 18 이상
- npm 또는 yarn
- Supabase 계정 및 프로젝트

### 설치 및 실행

1. **저장소 클론**
```sh
git clone <YOUR_GIT_URL>
cd stanpay
```

2. **의존성 설치**
```sh
npm install
```

3. **환경 변수 설정**

`.env` 파일을 생성하고 다음 변수를 설정하세요:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

`.env.example` 파일을 참고하세요.

4. **개발 서버 실행**
```sh
npm run dev
```

5. **프로덕션 빌드**
```sh
npm run build
```

## Supabase 설정

이 프로젝트는 Supabase를 백엔드로 사용합니다.

### 데이터베이스

주요 테이블:
- `profiles` - 사용자 프로필
- `gifticons` - 기프티콘 정보
- `payment_history` - 결제 내역
- `user_settings` - 사용자 설정
- `verification_codes` - 이메일 인증 코드
- `support_messages` - 고객 지원 메시지

### 마이그레이션 실행

Supabase 마이그레이션을 실행하려면:

```sh
# Supabase CLI 설치
npm install -g supabase

# 로컬 Supabase 시작 (선택사항)
supabase start

# 마이그레이션 적용
supabase db push
```

또는 Supabase 대시보드에서 SQL 편집기를 통해 마이그레이션 파일을 직접 실행할 수 있습니다.

## 프로젝트 구조

```
stanpay/
├── src/
│   ├── components/     # 재사용 가능한 컴포넌트
│   ├── pages/          # 페이지 컴포넌트
│   ├── integrations/   # 외부 서비스 연동
│   │   └── supabase/   # Supabase 클라이언트 설정
│   ├── hooks/          # 커스텀 훅
│   └── lib/            # 유틸리티 함수
├── supabase/
│   ├── migrations/     # 데이터베이스 마이그레이션
│   └── functions/      # Edge Functions
└── public/            # 정적 파일
```

## 주요 기능

- 🔐 이메일 인증 기반 로그인
- 🎁 기프티콘 관리 및 판매
- 💳 최적화된 결제 방법 제안
- 📍 위치 기반 매장 추천
- 💰 포인트 및 멤버십 통합
- 📊 결제 내역 및 통계
- 💬 실시간 고객 지원

## 라이선스

이 프로젝트는 비공개 프로젝트입니다.
