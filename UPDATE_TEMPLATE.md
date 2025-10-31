# 이메일 템플릿 자동 업데이트

Supabase Management API를 사용하여 이메일 템플릿을 자동으로 업데이트합니다.

## 실행 방법

### 1. Access Token 발급
1. https://supabase.com/dashboard/account/tokens 접속
2. "Generate new token" 클릭
3. 토큰 이름 입력 (예: "Email Template Update")
4. 생성된 토큰 복사 (**한 번만 표시됨**)

### 2. 스크립트 실행

```bash
SUPABASE_ACCESS_TOKEN="your-token-here" node update-email-template.js
```

또는 환경 변수로 설정:

```bash
export SUPABASE_ACCESS_TOKEN="your-token-here"
node update-email-template.js
```

## 업데이트되는 내용

- **제목**: "스탠 로그인"
- **내용**: 
  - 인증번호 (OTP) 표시
  - 버튼 스타일의 매직링크
  - 반응형 디자인

## 확인

스크립트 실행 후:
1. 로그인 페이지에서 이메일 입력
2. 수신한 이메일 확인
3. 인증번호와 버튼 스타일 링크가 포함되어 있는지 확인
