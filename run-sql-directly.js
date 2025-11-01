#!/usr/bin/env node
/**
 * Supabase SQL 직접 실행 스크립트
 * Supabase Management API를 통해 SQL 실행 시도
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env 파일 읽기
const envContent = readFileSync(join(__dirname, '.env'), 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  line = line.trim();
  if (line && !line.startsWith('#') && line.includes('=')) {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').replace(/^["']|["']$/g, '');
    envVars[key] = value;
  }
});

const SUPABASE_URL = envVars.VITE_SUPABASE_URL;
const SUPABASE_PROJECT_ID = envVars.VITE_SUPABASE_PROJECT_ID;
const SUPABASE_SERVICE_ROLE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PROJECT_ID) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

// SQL 파일 읽기
const sqlFile = join(__dirname, 'supabase/migrations/20251031012000_fix_verification_codes.sql');
const sql = readFileSync(sqlFile, 'utf-8');

console.log('📖 SQL 파일 읽기 완료');
console.log('🚀 Supabase Management API를 통한 SQL 실행 시도...\n');

// Supabase Management API 엔드포인트
// 참고: Supabase는 일반적으로 공개 API로 SQL을 직접 실행하지 않습니다.
// 하지만 Management API를 통한 시도
const projectRef = SUPABASE_PROJECT_ID;
const apiUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

// Management API를 통한 실행 시도 (실제로는 작동하지 않을 수 있음)
const options = {
  hostname: 'api.supabase.com',
  path: `/v1/projects/${projectRef}/database/query`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  },
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ SQL 실행 성공!');
      console.log('응답:', data);
    } else {
      console.error('❌ SQL 실행 실패');
      console.error('상태 코드:', res.statusCode);
      console.error('응답:', data);
      console.log('\n⚠️  Supabase Management API가 SQL 실행을 지원하지 않을 수 있습니다.');
      console.log('📋 아래 SQL을 Supabase 대시보드에서 직접 실행하세요:');
      console.log('\n' + '='.repeat(70));
      console.log(sql);
      console.log('='.repeat(70));
      console.log(`\n💡 SQL Editor: https://supabase.com/dashboard/project/${projectRef}/sql/new`);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ 요청 오류:', error.message);
  console.log('\n⚠️  Supabase Management API로 직접 SQL을 실행할 수 없습니다.');
  console.log('📋 아래 SQL을 Supabase 대시보드에서 직접 실행하세요:');
  console.log('\n' + '='.repeat(70));
  console.log(sql);
  console.log('='.repeat(70));
  console.log(`\n💡 SQL Editor: https://supabase.com/dashboard/project/${projectRef}/sql/new`);
});

// SQL 실행 요청 (실제로는 지원되지 않을 가능성이 높음)
req.write(JSON.stringify({ query: sql }));
req.end();



