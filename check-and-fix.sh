#!/bin/bash
echo "=== PostgREST 스키마 확인 ==="
curl -s -H "apikey: $(grep VITE_SUPABASE_PUBLISHABLE_KEY .env | cut -d'"' -f2)" \
  "https://sgmfdsutkehvsykxdzcd.supabase.co/rest/v1/" | \
  grep -o '"verification_codes"' && \
  echo "✅ verification_codes 테이블이 PostgREST 스키마에 있습니다" || \
  echo "❌ verification_codes 테이블이 PostgREST 스키마에 없습니다"
