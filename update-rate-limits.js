#!/usr/bin/env node

/**
 * Supabase Auth Rate Limit 설정 스크립트
 * 이메일 재전송 제한을 완화합니다.
 */

// 설정
const PROJECT_REF = 'scfkcmonaucfwigwtzfp';

// 환경 변수에서 Access Token 읽기
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error('❌ SUPABASE_ACCESS_TOKEN 환경 변수가 설정되지 않았습니다.');
  console.error('');
  console.error('💡 .env 파일에서 토큰을 읽습니다...');
  console.error('');
  process.exit(1);
}

// Management API 호출
const API_URL = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;

console.log('\n📋 현재 Auth Rate Limit 설정 확인 중...\n');

try {
  // 현재 설정 조회
  const getResponse = await fetch(API_URL, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!getResponse.ok) {
    throw new Error(`현재 설정 조회 실패: ${getResponse.status}`);
  }

  const currentConfig = await getResponse.json();
  console.log('✅ 현재 설정 조회 성공');

  // 현재 rate limit 설정 확인
  const currentRateLimits = currentConfig.rate_limits || {};
  
  console.log('\n현재 Rate Limit 설정:');
  console.log(`  OTP period: ${currentRateLimits.otp?.period || '(기본값)'} 초`);
  console.log(`  OTP validity: ${currentRateLimits.otp?.validity || '(기본값)'} 초`);
  console.log(`  Magic Link period: ${currentRateLimits.magic_link?.period || '(기본값)'} 초`);
  console.log(`  Magic Link validity: ${currentRateLimits.magic_link?.validity || '(기본값)'} 초`);

  // Rate Limit 완화 설정 (최소 간격을 10초로 설정, 유효 기간은 60분으로 설정)
  const updateConfig = {
    rate_limits: {
      otp: {
        period: 10,  // 10초마다 재전송 가능 (기본값은 보통 60초)
        validity: 3600,  // 60분 유효 (기본값과 동일)
      },
      magic_link: {
        period: 10,  // 10초마다 재전송 가능 (기본값은 보통 60초)
        validity: 3600,  // 60분 유효 (기본값과 동일)
      },
    },
  };

  // 업데이트할 내용이 없으면 종료
  const needsUpdate = 
    currentRateLimits.otp?.period !== 10 ||
    currentRateLimits.magic_link?.period !== 10;

  if (!needsUpdate) {
    console.log('\n✅ 이미 Rate Limit이 완화되어 있습니다!');
    process.exit(0);
  }

  // 설정 업데이트
  console.log('\n🚀 Rate Limit 설정 완화 중...\n');
  console.log('업데이트될 설정:');
  console.log(`  OTP period: 10초 (기존: ${currentRateLimits.otp?.period || '기본값'}초)`);
  console.log(`  Magic Link period: 10초 (기존: ${currentRateLimits.magic_link?.period || '기본값'}초)`);

  const patchResponse = await fetch(API_URL, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateConfig),
  });

  const responseText = await patchResponse.text();
  let responseData;
  
  try {
    responseData = JSON.parse(responseText);
  } catch {
    responseData = responseText;
  }

  if (patchResponse.ok) {
    console.log('\n✅ Rate Limit 설정 완화 완료!');
    console.log('');
    console.log('📋 업데이트된 설정:');
    console.log('   • OTP 재전송 최소 간격: 10초');
    console.log('   • Magic Link 재전송 최소 간격: 10초');
    console.log('   • 유효 기간: 60분 (변경 없음)');
    console.log('');
    console.log('💡 이제 사용자가 10초 간격으로 인증 이메일을 재전송할 수 있습니다.');
  } else {
    console.error('❌ Rate Limit 설정 업데이트 실패');
    console.error('상태 코드:', patchResponse.status);
    console.error('응답:', responseData);
    
    if (patchResponse.status === 401) {
      console.error('');
      console.error('💡 Access Token이 유효하지 않습니다.');
    } else if (patchResponse.status === 403) {
      console.error('');
      console.error('💡 권한이 없습니다.');
    } else if (patchResponse.status === 400) {
      console.error('');
      console.error('💡 요청 형식이 올바르지 않습니다.');
      console.error('   Management API의 rate_limits 구조를 확인해주세요.');
    }
    
    process.exit(1);
  }
} catch (error) {
  console.error('❌ 오류 발생:', error.message);
  console.error('');
  console.error('💡 수동 설정 방법:');
  console.error('   https://supabase.com/dashboard/project/' + PROJECT_REF + '/auth/providers');
  console.error('   → Email Provider 설정에서 Rate Limit 조정');
  process.exit(1);
}

