#!/bin/bash

# Kill all node processes
pkill -9 -f "node" 2>/dev/null || true
sleep 2

# Check no processes running
if ps aux | grep -q "node"; then
  echo "⚠️ Some node processes still running"
else
  echo "✅ All node processes killed"
fi

# Start simple server
cd /home/user1/.openclaw/workspace/torrent-searcher
nohup node server-simple.js > /tmp/server-simple.log 2>&1 &
SERVER_PID=$!

echo "Server PID: $SERVER_PID"
echo "Waiting for server to start..."
sleep 3

# Check process
if ps -p $SERVER_PID > /dev/null; then
  echo "✅ Server process is running (PID: $SERVER_PID)"
  
  # Check port
  if netstat -tlnp 2>/dev/null | grep -q :3000; then
    echo "✅ Port 3000 is listening"
  else
    echo "❌ Port 3000 is NOT listening"
  fi
  
  # Check connections
  echo ""
  echo "Testing / (should return HTML):"
  curl -s http://localhost:3000/ | head -20
  
  echo ""
  echo ""
  echo "======================================="
  echo "🌐 Server is running!"
  echo "   Open: http://localhost:3000"
  echo "======================================="
  echo ""
  echo "Server logs:"
  cat /tmp/server-simple.log
else
  echo "❌ Server failed to start"
  cat /tmp/server-simple.log
fi
