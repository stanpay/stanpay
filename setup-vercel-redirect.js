#!/usr/bin/env node

/**
 * Supabase Redirect URL 설정 스크립트
 * Management API를 사용하여 배포 URL을 redirect allowlist에 추가합니다.
 */

// 설정
const PROJECT_REF = 'scfkcmonaucfwigwtzfp';
const DEPLOY_URL = 'https://stanpay.vercel.app';
const REDIRECT_URL = `${DEPLOY_URL}/main`;

// 환경 변수에서 Access Token 읽기
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error('❌ SUPABASE_ACCESS_TOKEN 환경 변수가 설정되지 않았습니다.');
  console.error('');
  console.error('💡 .env 파일에 이미 저장되어 있습니다. 다음 명령어로 실행하세요:');
  console.error(`   node setup-vercel-redirect.js`);
  console.error('');
  console.error('   또는 직접 실행:');
  console.error(`   SUPABASE_ACCESS_TOKEN="your-token" node setup-vercel-redirect.js`);
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

  // 현재 redirect URLs 확인
  const currentSiteUrl = currentConfig.SITE_URL || '';
  const currentRedirectUrls = currentConfig.URI_ALLOW_LIST || [];

  console.log(`\n현재 Site URL: ${currentSiteUrl || '(설정 안됨)'}`);
  console.log(`현재 Redirect URLs: ${currentRedirectUrls.length > 0 ? currentRedirectUrls.join(', ') : '(없음)'}`);

  // 업데이트할 설정 준비
  const updateConfig = {};

  // Site URL 업데이트 (배포 URL로 설정)
  if (currentSiteUrl !== DEPLOY_URL) {
    updateConfig.SITE_URL = DEPLOY_URL;
    console.log(`\n📝 Site URL 업데이트: ${DEPLOY_URL}`);
  }

  // Redirect URLs 추가
  const newRedirectUrls = [...currentRedirectUrls];
  const redirectsToAdd = [
    `${DEPLOY_URL}/main`,
    `${DEPLOY_URL}/**`,  // 모든 경로 지원 (Vercel preview 배포 포함)
    'http://localhost:5173/main',  // 개발 환경
    'http://localhost:5173/**',   // 개발 환경 모든 경로
  ];

  redirectsToAdd.forEach(url => {
    if (!newRedirectUrls.includes(url)) {
      newRedirectUrls.push(url);
      console.log(`📝 Redirect URL 추가: ${url}`);
    }
  });

  if (JSON.stringify(newRedirectUrls.sort()) !== JSON.stringify(currentRedirectUrls.sort())) {
    updateConfig.URI_ALLOW_LIST = newRedirectUrls;
  }

  // 업데이트할 내용이 없으면 종료
  if (Object.keys(updateConfig).length === 0) {
    console.log('\n✅ 이미 모든 설정이 완료되어 있습니다!');
    process.exit(0);
  }

  // 설정 업데이트
  console.log('\n🚀 Supabase Auth 설정 업데이트 중...\n');

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
    console.log('✅ Supabase Auth 설정 업데이트 성공!');
    console.log('');
    console.log('📋 업데이트된 설정:');
    if (updateConfig.SITE_URL) {
      console.log(`   Site URL: ${updateConfig.SITE_URL}`);
    }
    if (updateConfig.URI_ALLOW_LIST) {
      console.log(`   Redirect URLs:`);
      updateConfig.URI_ALLOW_LIST.forEach(url => {
        console.log(`     - ${url}`);
      });
    }
    console.log('');
    console.log('🎉 이제 매직링크가 올바르게 작동합니다!');
    console.log('');
    console.log('💡 다음 단계:');
    console.log('   1. Vercel 환경 변수 설정 (선택사항):');
    console.log('      VITE_SITE_URL=https://stanpay.vercel.app');
    console.log('   2. 배포 후 테스트:');
    console.log('      https://stanpay.vercel.app 에서 이메일 로그인 테스트');
  } else {
    console.error('❌ 설정 업데이트 실패');
    console.error('상태 코드:', patchResponse.status);
    console.error('응답:', responseData);
    
    if (patchResponse.status === 401) {
      console.error('');
      console.error('💡 Access Token이 유효하지 않습니다.');
    } else if (patchResponse.status === 403) {
      console.error('');
      console.error('💡 권한이 없습니다.');
    }
    
    process.exit(1);
  }
} catch (error) {
  console.error('❌ 오류 발생:', error.message);
  console.error('');
  console.error('💡 수동 설정 방법:');
  console.error('   https://supabase.com/dashboard/project/' + PROJECT_REF + '/auth/url-configuration');
  process.exit(1);
}
