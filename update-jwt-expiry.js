#!/usr/bin/env node

/**
 * Supabase JWT Expiry 설정 스크립트
 * JWT 만료 시간을 7일로 설정합니다.
 */

// 설정
const PROJECT_REF = 'scfkcmonaucfwigwtzfp';
const JWT_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7일 = 604800초

// 환경 변수에서 Access Token 읽기
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error('❌ SUPABASE_ACCESS_TOKEN 환경 변수가 설정되지 않았습니다.');
  console.error('');
  console.error('💡 다음 명령어로 실행하세요:');
  console.error('   SUPABASE_ACCESS_TOKEN="your-token" node update-jwt-expiry.js');
  console.error('');
  console.error('   또는 .env 파일에 SUPABASE_ACCESS_TOKEN을 추가한 후:');
  console.error('   node update-jwt-expiry.js');
  console.error('');
  process.exit(1);
}

// Management API 호출
const API_URL = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;

console.log('\n📋 현재 Auth 설정 확인 중...\n');

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

  // 현재 JWT expiry 설정 확인
  const currentJwtExpiry = currentConfig.jwt_expiry || 3600; // 기본값 1시간
  
  console.log('\n현재 JWT 설정:');
  console.log(`  JWT Expiry: ${currentJwtExpiry}초 (${(currentJwtExpiry / 3600).toFixed(1)}시간)`);

  // 이미 7일로 설정되어 있으면 종료
  if (currentJwtExpiry === JWT_EXPIRY_SECONDS) {
    console.log('\n✅ 이미 JWT Expiry가 7일로 설정되어 있습니다!');
    console.log(`   현재 설정: ${JWT_EXPIRY_SECONDS}초 (7일)`);
    process.exit(0);
  }

  // JWT Expiry를 7일로 설정
  const updateConfig = {
    jwt_expiry: JWT_EXPIRY_SECONDS,
  };

  // 설정 업데이트
  console.log('\n🚀 JWT Expiry를 7일로 설정 중...\n');
  console.log('업데이트될 설정:');
  console.log(`  JWT Expiry: ${JWT_EXPIRY_SECONDS}초 (7일)`);
  console.log(`  기존 설정: ${currentJwtExpiry}초 (${(currentJwtExpiry / 3600).toFixed(1)}시간)`);

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
    console.log('\n✅ JWT Expiry 설정 완료!');
    console.log('');
    console.log('📋 업데이트된 설정:');
    console.log(`   • JWT Expiry: ${JWT_EXPIRY_SECONDS}초 (7일)`);
    console.log('');
    console.log('💡 새로운 로그인부터 7일간 유지됩니다.');
    console.log('   기존 세션은 만료 시간이 지나면 갱신됩니다.');
  } else {
    console.error('❌ JWT Expiry 설정 업데이트 실패');
    console.error('상태 코드:', patchResponse.status);
    console.error('응답:', responseData);
    
    if (patchResponse.status === 401) {
      console.error('');
      console.error('💡 Access Token이 유효하지 않습니다.');
      console.error('   Supabase 대시보드에서 새로운 Access Token을 발급받으세요:');
      console.error('   https://supabase.com/dashboard/account/tokens');
    } else if (patchResponse.status === 403) {
      console.error('');
      console.error('💡 권한이 없습니다. Project Owner 권한이 필요합니다.');
    } else if (patchResponse.status === 400) {
      console.error('');
      console.error('💡 요청 형식이 올바르지 않습니다.');
      console.error('   Management API의 jwt_expiry 구조를 확인해주세요.');
    }
    
    console.error('');
    console.error('💡 수동 설정 방법:');
    console.error(`   https://supabase.com/dashboard/project/${PROJECT_REF}/auth/settings`);
    console.error('   → JWT Settings에서 JWT Expiry를 604800초(7일)로 설정');
    
    process.exit(1);
  }
} catch (error) {
  console.error('❌ 오류 발생:', error.message);
  console.error('');
  console.error('💡 수동 설정 방법:');
  console.error(`   https://supabase.com/dashboard/project/${PROJECT_REF}/auth/settings`);
  console.error('   → JWT Settings에서 JWT Expiry를 604800초(7일)로 설정');
  process.exit(1);
}

