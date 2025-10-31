# Supabase MCP 설정 가이드

Supabase MCP 연결을 위해 필요한 설정입니다.

## 문제 진단

Supabase MCP 서버는 `SUPABASE_ACCESS_TOKEN` 환경 변수가 필요합니다. 
현재 MCP 설정 파일 (`~/.cursor/mcp.json`)에 환경 변수가 추가되었지만, 실제 토큰 값을 설정해야 합니다.

## 해결 방법

### 1. Supabase Access Token 발급

1. Supabase 대시보드에 로그인: https://supabase.com/dashboard
2. **Account Settings** (우측 상단 프로필 아이콘) → **Access Tokens**로 이동
3. **Generate new token** 클릭
4. 토큰 이름 입력 (예: "MCP Access Token")
5. 생성된 토큰을 복사합니다 (**한 번만 표시되므로 반드시 복사하세요**)

### 2. MCP 설정 파일 업데이트

`~/.cursor/mcp.json` 파일을 열고 `SUPABASE_ACCESS_TOKEN` 값을 설정하세요:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-ref=sgmfdsutkehvsykxdzcd"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "여기에_발급받은_토큰_입력"
      }
    }
  }
}
```

### 3. Cursor 재시작

1. **Cursor 완전 종료**
   - 모든 Cursor 창을 닫습니다
   - 프로세스가 완전히 종료될 때까지 기다립니다

2. **Cursor 재시작**
   - Cursor를 다시 실행합니다
   - MCP 서버가 자동으로 연결됩니다

### 4. 연결 확인

- Cursor 재시작 후 잠시 기다리면 MCP가 연결됩니다
- 연결이 완료되면 SQL 실행을 요청할 수 있습니다

## 임시 해결책

MCP가 연결될 때까지 기다리지 않으려면:
- Supabase 대시보드에서 직접 SQL을 실행하세요:
- https://supabase.com/dashboard/project/sgmfdsutkehvsykxdzcd/sql/new

## 참고사항

- **Project Ref**: `sgmfdsutkehvsykxdzcd` (이미 설정됨)
- **Node.js 버전**: v22.21.0 (호환 가능)
- Access Token은 민감한 정보이므로 공유하지 마세요


