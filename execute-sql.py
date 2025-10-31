#!/usr/bin/env python3
"""
Supabase SQL 실행 스크립트
Supabase Management API를 사용하여 SQL을 실행합니다.
"""
import os
import sys
import requests
import json
from pathlib import Path

def load_env():
    """Load .env file"""
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
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('VITE_SUPABASE_PUBLISHABLE_KEY')

if not SUPABASE_URL:
    print("❌ VITE_SUPABASE_URL이 설정되어 있지 않습니다.")
    sys.exit(1)

if not SUPABASE_SERVICE_ROLE_KEY:
    print("❌ SUPABASE_SERVICE_ROLE_KEY가 설정되어 있지 않습니다.")
    print("💡 Supabase 대시보드 > Settings > API > service_role key를 .env에 추가하세요.")
    sys.exit(1)

# SQL 파일 읽기
sql_file = sys.argv[1] if len(sys.argv) > 1 else 'supabase/migrations/20251031012000_fix_verification_codes.sql'

try:
    with open(sql_file, 'r', encoding='utf-8') as f:
        sql = f.read()
    
    print(f"📖 SQL 파일 읽기: {sql_file}")
    print(f"🚀 Supabase에 SQL 실행 중...\n")
    
    # Supabase Management API를 통한 SQL 실행
    # 참고: Supabase는 직접 SQL 실행을 위한 공개 API를 제공하지 않습니다.
    # 따라서 이 스크립트는 SQL을 출력하고 Supabase 대시보드에서 실행하도록 안내합니다.
    
    print("=" * 70)
    print("⚠️  Supabase는 공개 REST API로 직접 SQL을 실행할 수 없습니다.")
    print("=" * 70)
    print("\n📋 아래 SQL을 Supabase 대시보드의 SQL Editor에서 실행하세요:\n")
    print("-" * 70)
    print(sql)
    print("-" * 70)
    
    if SUPABASE_PROJECT_ID:
        print(f"\n💡 SQL Editor 바로가기:")
        print(f"   https://supabase.com/dashboard/project/{SUPABASE_PROJECT_ID}/sql/new")
    
    print("\n✅ 위 SQL을 복사하여 Supabase 대시보드에서 실행하세요.")
    
except FileNotFoundError:
    print(f"❌ 파일을 찾을 수 없습니다: {sql_file}")
    sys.exit(1)
except Exception as e:
    print(f"❌ 오류 발생: {e}")
    sys.exit(1)


