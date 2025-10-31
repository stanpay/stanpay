# Supabase 이메일 템플릿 설정 가이드

이메일 템플릿에 인증번호와 버튼 스타일의 매직링크를 포함하도록 설정합니다.

## 방법 1: Supabase 대시보드에서 설정 (권장)

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard/project/scfkcmonaucfwigwtzfp/auth/templates

2. **Magic Link 템플릿 수정**
   - "Magic Link" 템플릿을 선택합니다
   - 제목: `스탠 로그인`
   - 아래 HTML 내용을 복사하여 붙여넣습니다

3. **템플릿 HTML 내용**

`supabase/templates/magic-link.html` 파일의 내용을 복사하여 Supabase 대시보드의 Magic Link 템플릿에 붙여넣으세요.

또는 아래 내용을 직접 사용할 수 있습니다:

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #1a1a1a; font-size: 32px; font-weight: 700;">스탠</h1>
              <p style="margin: 8px 0 0; color: #666; font-size: 16px;">결제의 기준이 되다</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 24px;">로그인 인증</h2>
              <p style="margin: 0 0 24px; color: #333; font-size: 16px;">
                안녕하세요! 아래 인증번호를 입력하거나 버튼을 클릭하여 로그인하세요.
              </p>
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center; border: 2px dashed #e0e0e0;">
                <p style="margin: 0 0 12px; color: #666; font-size: 14px;">인증번호</p>
                <p style="margin: 0; color: #1a1a1a; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">{{ .Token }}</p>
              </div>
              <div style="margin: 32px 0; text-align: center;">
                <p style="margin: 0 0 16px; color: #666; font-size: 14px;">또는 아래 버튼을 클릭하여 로그인하세요</p>
                <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">로그인하기</a>
              </div>
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e0e0e0;">
                <p style="margin: 0; color: #999; font-size: 12px; line-height: 1.5;">
                  • 이 인증번호는 10분간 유효합니다.<br>
                  • 링크와 인증번호는 한 번만 사용 가능합니다.<br>
                  • 이 요청을 하지 않으셨다면 무시하셔도 됩니다.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #f8f9fa; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; color: #999; font-size: 12px;">© 2024 스탠. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

## 방법 2: Management API 사용

Management API를 사용하여 프로그래밍 방식으로 템플릿을 업데이트할 수 있습니다.

### 설정 방법

1. **Access Token 발급**
   - https://supabase.com/dashboard/account/tokens 에서 Access Token 발급

2. **API 호출**

```bash
export SUPABASE_ACCESS_TOKEN="your-access-token"
export PROJECT_REF="scfkcmonaucfwigwtzfp"

curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mailer_subjects_magic_link": "스탠 로그인",
    "mailer_templates_magic_link_content": "<!DOCTYPE html>... [위의 HTML 내용]"
  }'
```

## 확인 사항

템플릿에는 다음 변수가 포함되어야 합니다:

- `{{ .Token }}` - 6자리 인증번호 (OTP)
- `{{ .ConfirmationURL }}` - 매직링크 URL (버튼에 사용)

## 주의사항

- 템플릿을 수정한 후 이메일 발송 테스트를 진행하세요
- 일부 이메일 클라이언트에서는 인라인 CSS가 제대로 적용되지 않을 수 있습니다
- 버튼 스타일은 대부분의 이메일 클라이언트에서 잘 작동합니다

## 테스트

템플릿을 설정한 후:

1. 로그인 페이지에서 이메일 입력
2. 수신한 이메일 확인
3. 인증번호 표시 확인
4. 버튼 스타일의 매직링크 확인
