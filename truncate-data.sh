#!/bin/bash

echo "🗑️  Truncating all user-entered data from the database..."
echo ""

# Call the truncate endpoint
response=$(curl -s -X DELETE http://localhost:3001/api/admin/truncate-all)

# Check if curl was successful
if [ $? -eq 0 ]; then
  echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
  echo ""
  echo "✅ Data truncation completed!"
else
  echo "❌ Failed to connect to backend. Make sure the backend is running on http://localhost:3001"
  exit 1
fi






