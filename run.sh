#!/bin/bash
cd /home/user1/.openclaw/workspace/torrent-searcher
node dist/server/src/server.js &
echo "Started with PID: $!"
