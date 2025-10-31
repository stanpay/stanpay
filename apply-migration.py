#!/usr/bin/env python3
"""
Supabase 마이그레이션 적용 스크립트

Supabase는 REST API로 직접 SQL을 실행할 수 없으므로,
이 스크립트는 마이그레이션 SQL을 출력하여 사용자가 
Supabase 대시보드에서 직접 실행할 수 있도록 합니다.

또는 psycopg2를 사용하여 PostgreSQL에 직접 연결할 수도 있습니다.
"""
import os
import sys
from pathlib import Path

# .env 파일 간단 로드
def load_env():
    env_file = Path('.env')
    if env_file.exists():
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    value = value.strip('"\'')
                    os.environ[key] = value

load_env()

SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_PROJECT_ID = os.getenv('VITE_SUPABASE_PROJECT_ID')

if not SUPABASE_URL:
    print("❌ VITE_SUPABASE_URL이 .env 파일에 설정되어 있지 않습니다.")
    sys.exit(1)

# 마이그레이션 파일 경로
migration_file = sys.argv[1] if len(sys.argv) > 1 else 'supabase/migrations/20251030070000_create_verification_codes.sql'

try:
    print(f"📖 마이그레이션 파일 읽기: {migration_file}")
    with open(migration_file, 'r', encoding='utf-8') as f:
        sql = f.read()
    
    print("\n" + "="*70)
    print("📋 다음 SQL을 Supabase 대시보드의 SQL Editor에서 실행하세요:")
    print("="*70)
    print(sql)
    print("="*70)
    
    if SUPABASE_PROJECT_ID:
        print(f"\n💡 SQL Editor 바로가기:")
        print(f"   https://supabase.com/dashboard/project/{SUPABASE_PROJECT_ID}/sql/new")
    
    print("\n✅ SQL을 복사하여 Supabase 대시보드 > SQL Editor에서 실행하세요.")
    
except FileNotFoundError:
    print(f"❌ 파일을 찾을 수 없습니다: {migration_file}")
    sys.exit(1)
except Exception as e:
    print(f"❌ 오류 발생: {e}")
    sys.exit(1)

