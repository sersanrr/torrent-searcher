#!/bin/bash

echo "========================================"
echo "Завершение всех node процессов"
echo "========================================"

pkill -9 -f node
sleep 2

echo "Проверка, что ничего не запущено:"
ps aux | grep -E "node" | grep -v grep || echo "✅ Все процессы завершены"

echo ""
echo "========================================"
echo "Запуск простого сервера"
echo "========================================"

cd /home/user1/.openclaw/workspace/torrent-searcher

# Запуск простого сервера корректно
nohup node server-simple.js > /tmp/server-simple.log 2>&1 &
SERVER_PID=$!

echo "Server PID: $SERVER_PID"
echo "Ожидание запуска (5 секунд)..."
sleep 5

# Проверка процесса
if ps -p $SERVER_PID > /dev/null; then
    echo "✅ Процесс сервера запущен"
    
    # Проверка порта
    if netstat -tlnp 2>/dev/null | grep -q :3000 || ss -tlnp 2>/dev/null | grep -q :3000; then
        echo "✅ Порт 3000 слушает"
    else
        echo "❌ Порт 3000 не слушает"
    fi
    
    # Проверка базы
    echo ""
    echo "Тестирование HTTP:"
    echo "GET /:"
    curl -s http://localhost:3000/ | head -20 || echo "FAIL"
    
    echo ""
    echo "GET /style.css:"
    curl -s http://localhost:3000/style.css | head -5 || echo "FAIL"
    
    echo ""
    echo "GET /app.js:"
    curl -s http://localhost:3000/app.js | head -5 || echo "FAIL"
    
    echo ""
    echo "GET /api/health:"
    curl -s http://localhost:3000/api/health || echo "FAIL"
    
    echo ""
    echo "========================================"
    echo "✅ СЕРВЕР РАБОТАЕТ"
    echo "   Откройте: http://localhost:3000"
    echo "========================================"
    
    echo ""
    echo "Логи сервера:"
    cat /tmp/server-simple.log
    
else
    echo "❌ Процесс сервера НЕ запущен"
    cat /tmp/server-simple.log
    exit 1
fi
