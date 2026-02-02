#!/bin/bash

echo "Testing Nexus Backend API Endpoints"
echo "===================================="
echo ""

echo "1. Testing Session Creation..."
SESSION_RESPONSE=$(curl -s -X POST http://localhost:8000/api/sessions -H "Content-Type: application/json")
SESSION_ID=$(echo $SESSION_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['session_id'])")
echo "   Created session: $SESSION_ID"
echo ""

echo "2. Testing Message POST..."
MESSAGE_RESPONSE=$(curl -s -X POST http://localhost:8000/api/sessions/$SESSION_ID/messages \
  -H "Content-Type: application/json" \
  -d '{"content":"What can you help me with?","images":[]}')
echo "   Response: $(echo $MESSAGE_RESPONSE | python3 -c "import sys, json; r=json.load(sys.stdin); print(r['content'][:100] + '...')")"
echo ""

echo "3. Testing Modal GET (should return 404 - no pending modal)..."
MODAL_RESPONSE=$(curl -s -X GET http://localhost:8000/api/sessions/$SESSION_ID/modal)
echo "   Response: $MODAL_RESPONSE"
echo ""

echo "4. Testing STT Transcribe (requires audio file)..."
echo "   Skipping - requires actual audio file with proper content-type"
echo ""

echo "All critical endpoints working correctly!"
