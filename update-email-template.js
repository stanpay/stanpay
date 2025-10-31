#!/usr/bin/env node

/**
 * Supabase 이메일 템플릿 업데이트 스크립트
 * Management API를 사용하여 Magic Link 템플릿을 업데이트합니다.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 설정
const PROJECT_REF = 'scfkcmonaucfwigwtzfp';
const TEMPLATE_FILE = join(__dirname, 'supabase/templates/magic-link.html');

// 환경 변수에서 Access Token 읽기
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error('❌ SUPABASE_ACCESS_TOKEN 환경 변수가 설정되지 않았습니다.');
  console.error('');
  console.error('💡 Access Token을 설정하는 방법:');
  console.error('   1. https://supabase.com/dashboard/account/tokens 에서 Access Token 발급');
  console.error('   2. 다음 명령어로 실행:');
  console.error(`      SUPABASE_ACCESS_TOKEN="your-token" node ${__filename}`);
  console.error('');
  process.exit(1);
}

// 템플릿 파일 읽기
let templateContent;
try {
  templateContent = readFileSync(TEMPLATE_FILE, 'utf-8');
  console.log('✅ 템플릿 파일 읽기 성공:', TEMPLATE_FILE);
} catch (error) {
  console.error('❌ 템플릿 파일을 읽을 수 없습니다:', error.message);
  process.exit(1);
}

// JSON에서 특수 문자 이스케이프
const escapedContent = templateContent
  .replace(/\\/g, '\\\\')
  .replace(/"/g, '\\"')
  .replace(/\n/g, '\\n')
  .replace(/\r/g, '\\r');

// Management API 호출
const API_URL = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;

const requestBody = JSON.stringify({
  mailer_subjects_magic_link: '스탠 로그인',
  mailer_templates_magic_link_content: templateContent,
});

console.log('\n🚀 Management API를 통해 이메일 템플릿 업데이트 중...\n');

try {
  const response = await fetch(API_URL, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: requestBody,
  });

  const responseText = await response.text();
  let responseData;
  
  try {
    responseData = JSON.parse(responseText);
  } catch {
    responseData = responseText;
  }

  if (response.ok) {
    console.log('✅ 이메일 템플릿 업데이트 성공!');
    console.log('');
    console.log('📧 이제 이메일 발송 시 다음이 포함됩니다:');
    console.log('   • 인증번호 (OTP)');
    console.log('   • 버튼 스타일의 매직링크');
    console.log('');
    console.log('🧪 테스트: 로그인 페이지에서 이메일을 입력하여 테스트해보세요.');
  } else {
    console.error('❌ 이메일 템플릿 업데이트 실패');
    console.error('상태 코드:', response.status);
    console.error('응답:', responseData);
    
    if (response.status === 401) {
      console.error('');
      console.error('💡 Access Token이 유효하지 않습니다. 새로운 토큰을 발급받아주세요.');
    } else if (response.status === 403) {
      console.error('');
      console.error('💡 권한이 없습니다. Access Token에 프로젝트 수정 권한이 있는지 확인하세요.');
    }
    
    process.exit(1);
  }
} catch (error) {
  console.error('❌ 요청 오류:', error.message);
  console.error('');
  console.error('💡 네트워크 연결을 확인하거나 수동으로 설정하세요:');
  console.error('   https://supabase.com/dashboard/project/' + PROJECT_REF + '/auth/templates');
  process.exit(1);
}
