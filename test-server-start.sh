#!/bin/bash

# Kill any existing node processes on port 3000
pkill -f "node.*server" 2>/dev/null || true
sleep 1

# Start simple server
cd /home/user1/.openclaw/workspace/torrent-searcher
node simple-server.js > /tmp/server.log 2>&1 &
SERVER_PID=$!

echo "Server PID: $SERVER_PID"

# Wait for server to start
sleep 2

# Check if server is running
if ps -p $SERVER_PID > /dev/null; then
    echo "✅ Server process is running"
    
    # Check if port 3000 is listening
    if netstat -tlnp 2>/dev/null | grep -q :3000 || ss -tlnp 2>/dev/null | grep -q :3000; then
        echo "✅ Port 3000 is listening"
        
        # Test API
        echo ""
        echo "Testing /api/health:"
        curl -s http://localhost:3000/api/health
        
        echo ""
        echo ""
        echo "Testing / (should return HTML):"
        curl -s http://localhost:3000/ | head -10
        
        echo ""
        echo ""
        echo "Server logs:"
        cat /tmp/server.log
    else
        echo "❌ Port 3000 is NOT listening"
    fi
else
    echo "❌ Server process is NOT running"
fi
