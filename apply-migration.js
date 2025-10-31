#!/usr/bin/env node
/**
 * Supabase 마이그레이션 적용 스크립트
 * 
 * 사용법:
 * 1. .env 파일에 SUPABASE_SERVICE_ROLE_KEY를 추가하세요
 * 2. node apply-migration.js <migration-file.sql>
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env 파일 로드
config({ path: join(__dirname, '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error('❌ VITE_SUPABASE_URL이 .env 파일에 설정되어 있지 않습니다.');
  process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY가 .env 파일에 설정되어 있지 않습니다.');
  console.error('💡 Supabase 대시보드 > Settings > API > service_role key를 복사하여 .env에 추가하세요.');
  process.exit(1);
}

const migrationFile = process.argv[2] || 'supabase/migrations/20251030070000_create_verification_codes.sql';

try {
  console.log(`📖 마이그레이션 파일 읽기: ${migrationFile}`);
  const sql = readFileSync(join(__dirname, migrationFile), 'utf-8');
  
  console.log('🚀 Supabase에 마이그레이션 적용 중...');
  
  // Supabase Management API를 통한 SQL 실행
  // 참고: Supabase는 직접 SQL 실행 API를 제공하지 않으므로
  // Supabase 대시보드의 SQL Editor를 사용하거나
  // PostgreSQL 직접 연결을 사용해야 합니다.
  
  console.log('⚠️  Supabase는 공개 REST API로 직접 SQL을 실행할 수 없습니다.');
  console.log('📋 아래 SQL을 Supabase 대시보드의 SQL Editor에서 실행하세요:\n');
  console.log('─'.repeat(60));
  console.log(sql);
  console.log('─'.repeat(60));
  console.log('\n💡 또는 아래 링크에서 SQL Editor를 열 수 있습니다:');
  console.log(`   ${SUPABASE_URL.replace('.supabase.co', '.supabase.com')}/project/${process.env.VITE_SUPABASE_PROJECT_ID}/sql/new`);
  
} catch (error) {
  console.error('❌ 오류 발생:', error.message);
  process.exit(1);
}

