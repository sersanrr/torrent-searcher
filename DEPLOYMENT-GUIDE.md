# Деплой Torrent Searcher на удалённый сервер

## Полная инструкция по установке и запуску

---

## Содержание

1. [Требования к серверу](#требования-к-серверу)
2. [Установка Node.js](#установка-nodejs)
3. [Подготовка проекта](#подготовка-проекта)
4. [Конфигурация](#конфигурация)
5. [Запуск с PM2](#запуск-с-pm2)
6. [Nginx и SSL](#nginx-и-ssl)
7. [Мониторинг и логи](#мониторинг-и-логи)
8. [Траблшутинг](#траблшутинг)

---

## Требования к серверу

### Минимальные требования (VPS)
- **OS:** Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- **CPU:** 1 core
- **RAM:** 512 MB
- **Storage:** 1 GB+
- **Port:** 3000 или любой другой свободный порт

### Сетевые требования
- Доступ по SSH (порт 22)
- Открытый порт для веб-сервера (80/443 для Nginx, 3000+ для Node.js)
- **Критично:** Сервер должен иметь доступ к трекерам без DNS блокировок

---

## Установка Node.js

### Ubuntu/Debian

```bash
# Установить Node.js 20.x LTS (рекомендуемая версия)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Проверить версии
node -v    # Должно быть v20.x
npm -v     # Должно быть 10.x+
```

### CentOS/RHEL

```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
```

### Все системы (альтернатива через NVM)

```bash
# Установить NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Обновить shell
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Установить Node.js 20 LTS
nvm install 20
nvm use 20
```

---

## Подготовка проекта

### 1. Развернуть код на сервере

```bash
# SSH на сервер
ssh user@your-server.com

# Создать директорию проекта
mkdir -p ~/torrent-searcher
cd ~/torrent-searcher

# Скопировать проект (варианты)

# Вариант A: через git (если есть репозиторий)
git clone https://github.com/your-repo/torrent-searcher.git .

# Вариант B: через scp с локальной машины
# На локальном компьютере:
scp -r /home/user1/.openclaw/workspace/torrent-searcher/* user@server.com:~/torrent-searcher/

# Вариант C: через rsync
rsync -avz /home/user1/.openclaw/workspace/torrent-searcher/ user@server.com:~/torrent-searcher/
```

### 2. Установить зависимости

```bash
cd ~/torrent-searcher

# Установить production зависимости
npm ci --production

# Если нужны dev зависимости (для тестов)
npm install
```

### 3. Скомпилировать TypeScript

```bash
# Сборка проекта
npm run build

# Проверить наличие скомпилированных файлов
ls -la dist/server/src/
# Должно быть видно: server.js, controllers/, tracker/, services/, config/
```

---

## Конфигурация

### 1. Переменные окружения

Создай файл `.env` в директории проекта:

```bash
nano ~/torrent-searcher/.env
```

Содержимое `.env`:

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# Proxy Configuration (опционально)
# HTTP_PROXY=http://proxy.example.com:8080
# HTTPS_PROXY=http://proxy.example.com:8080
# NO_PROXY=localhost,127.0.0.1

# Logging (опционально)
LOG_LEVEL=info
```

### 2. Настроить трекеры

Отредактируй `server/src/config/trackers.ts` при необходимости:

```bash
nano server/src/config/trackers.ts
```

Пример конфигурации:

```typescript
export const TRACKER_CONFIGS: TrackerConfig[] = [
  {
    name: '1337x',
    baseUrl: 'https://1337x.to',
    searchPath: '/search/',
    enabled: true,
    requiresProxy: true, // Установить в false если трекер доступен напрямую
  },
  {
    name: 'NYAA',
    baseUrl: 'https://nyaa.si',
    searchPath: '/?q=',
    enabled: true,
    requiresProxy: false,
  },
  {
    name: 'YTS',
    baseUrl: 'https://yts.mx',
    searchPath: '/api/v2/list_movies.json',
    enabled: true,
    requiresProxy: false,
  },
];
```

### 3. Убедиться что все файлы нужных узлов существует

```bash
# Проверить структуру проекта
find dist -name "*.js" | head -10
# Вывод должен включать:
# dist/server/src/server.js
# dist/server/src/controllers/TorrentSearchController.js
# dist/server/src/tracker/TrackerParser.js
# dist/server/src/services/ProxyService.js
# dist/server/src/config/trackers.js
```

---

## Запуск с PM2

### 1. Установить PM2 (Process Manager for Node.js)

```bash
# Локально или глобально
sudo npm install -g pm2
```

### 2. Настроить PM2 для автозапуска

```bash
# Сгенерировать startup script для PM2
pm2 startup

# Выполнить команду которую выдал PM2
# Пример: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u yourusername --hp /home/yourusername
```

### 3. Запустить приложение

```bash
cd ~/torrent-searcher

# Запустить проекта
pm2 start npm --name "torrent-searcher" -- start

# Или указать напрямую
pm2 start dist/server/src/server.js --name "torrent-searcher"

# Проверить статус
pm2 status
pm2 logs torrent-searcher

# Проверить что сервер работает
curl http://localhost:3000/api/health
# Вывод должен быть: {"status":"ok" или "degraded", ...}
```

### 4. Фигура PM2 для автозапуска

```bash
# Сохранить список процессов
pm2 save

# Теперь при перезагрузке сервера приложение будет запускаться автоматически
```

---

## Nginx и SSL

### 1. Установить Nginx

```bash
sudo apt update
sudo apt install nginx -y

# Проверить статус
sudo systemctl status nginx
```

### 2. Создать конфигурацию для сайта

```bash
sudo nano /etc/nginx/sites-available/torrent-searcher
```

Содержимое (HTTP + HTTPS):

```nginx
# HTTP - редирект на HTTPS
server {
    listen 80;
    server_name torrent.example.com;

    # Если нужен временный HTTP доступ:
    # location / {
    #     proxy_pass http://localhost:3000;
    #     proxy_http_version 1.1;
    #     proxy_set_header Upgrade $http_upgrade;
    #     proxy_set_header Connection 'upgrade';
    #     proxy_set_header Host $host;
    #     proxy_cache_bypass $http_upgrade;
    # }

    # Редирект на HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name torrent.example.com;

    # SSL сертификаты (создадим ниже)
    ssl_certificate /etc/letsencrypt/live/torrent.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/torrent.example.com/privkey.pem;

    # SSL конфигурация
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Proxy до Node.js приложения
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeout для долгих запросов
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files (если нужно)
    location /static {
        alias /home/username/torrent-searcher/frontend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3. Создать SSL сертификат (Certbot)

```bash
# Установить Certbot
sudo apt install certbot python3-certbot-nginx -y

# Получить сертификат (замените torrent.example.com на ваш домен)
sudo certbot --nginx -d torrent.example.com

# Установить автообновление сертификатов
sudo certbot renew --dry-run

# Добавить cron job для автообновления
echo "0 0,12 * * * root certbot renew --quiet" | sudo tee -a /etc/cron.d/certbot
```

### 4. Активировать сайт и перезапустить Nginx

```bash
# Создать символическую ссылку
sudo ln -s /etc/nginx/sites-available/torrent-searcher /etc/nginx/sites-enabled/

# Проверить конфигурацию
sudo nginx -t

# Перезапустить Nginx
sudo systemctl restart nginx

# Проверить доступ через браузер
# https://torrent.example.com
```

---

## Мониторинг и логи

### 1. PM2 мониторинг

```bash
# Статус процессов
pm2 status

# Логи приложения (живой просмотр)
pm2 logs torrent-searcher

# Логи только за 200 строк
pm2 logs torrent-searcher --lines 200 --nostream

# Информация о ресурсах
pm2 monit

# Информация о процессе
pm2 info torrent-searcher

# Логи за сегодня
pm2 logs torrent-searcher --lines 100 --err --nostream
```

### 2. Системные логи

```bash
# Логи Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Логи systemd
sudo journalctl -u pm2 -u nginx -f

# Логи приложений
pm2 logs --lines 500 torrent-searcher
```

### 3. Алерты (опционально)

Установить PM2 Plus или использовать встроенный мониторинг:

```bash
# отправить алерты по email
pm2 install pm2-logrotate
```

### 4. Мониторинг API

```bash
# Проверить здоровье
curl https://torrent.example.com/api/health

# Проверить трекеры
curl https://torrent.example.com/api/trackers

# Проверить поиск
curl "https://torrent.example.com/api/search?q=test&limit=5"
```

---

## Траблшутинг

### Проблема: Сервер не запускается

#### Проверить зависимости Node.js

```bash
npm install
npm run build
npm start
```

#### Проверить логи

```bash
pm2 logs torrent-searcher --lines 100
```

#### Проверить порт

```bash
# Проверить что порт свободен
sudo lsof -i :3000
sudo netstat -tulpn | grep 3000
```

### Проблема: Поиск не работает (DNS блокировка)

#### Определить проблему

```bash
curl -I https://yts.mx
# Если Connection reset / timeout - блокировка

nslookup yts.mx
# Если NXDOMAIN - DNS блокировка
```

#### Решение: Использовать Public DNS

```bash
# Редактировать /etc/resolv.conf
sudo nano /etc/resolv.conf

# Заменить DNS серверы на:
nameserver 8.8.8.8
nameserver 1.1.1.1
nameserver 8.8.4.4
```

#### Решение: Настроить прокси

```bash
# Редактировать .env
nano ~/torrent-searcher/.env

HTTP_PROXY=http://proxy.example.com:8080
HTTPS_PROXY=http://proxy.example.com:8080

# Перезапустить приложение
pm2 restart torrent-searcher
```

### Проблема: Access Denied / 403

#### Проверить права доступа

```bash
# Проверить владение файлов
ls -la ~/torrent-searcher/dist/

# Респоcтить права (не рекомендуется дляauftask)
sudo chmod -R 755 ~/torrent-searcher/dist
```

#### Проверить настройки Nginx

```bash
# Проверить конфигурацию
sudo nginx -t

# Проверить что сайт активен
sudo ln -s /etc/nginx/sites-available/torrent-searcher /etc/nginx/sites-enabled/
```

### Проблема: HTTPS не работает

#### Получить новый сертификат

```bash
sudo certbot --nginx -d torrent.example.com
```

#### Проверить срок действия сертификата

```bash
sudo certbot certificates
```

---

## Обновление приложения

### Обновление через Git

```bash
cd ~/torrent-searcher
git pull origin main
npm install
npm run build
pm2 restart torrent-searcher
```

### Обновление через SCP

```bash
# На локальном компьютере
scp -r /home/user1/.openclaw/workspace/torrent-searcher/* user@server.com:~/torrent-searcher/

# На сервере
cd ~/torrent-searcher
npm run build
pm2 restart torrent-searcher
```

---

## Резервное копирование

### Бэкап

```bash
#!/bin/bash
# Создать backup script: ~/backup-torrent.sh

BACKUP_DIR="/backups/torrent-searcher"
DATE=$(date +%Y%m%d_%H%M%S)
PROJECT_DIR="/home/username/torrent-searcher"

# Создать бэкап директории
mkdir -p $BACKUP_DIR

# Архивировать проект
tar -czf $BACKUP_DIR/torrent-searcher_$DATE.tar.gz \
  $PROJECT_DIR/dist \
  $PROJECT_DIR/frontend \
  $PROJECT_DIR/package.json \
  $PROJECT_DIR/.env

# Удалить бэкапы старше 7 дней
find $BACKUP_DIR -name "torrent-searcher_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/torrent-searcher_$DATE.tar.gz"
```

**Использования:**

```bash
chmod +x ~/backup-torrent.sh
./backup-torrent.sh

# Добавить в cron
crontab -e
# Добавить:
0 3 * * * /home/username/backup-torrent.sh
```

---

## Контрольный список перед стартом

- [ ] Node.js 20+ установлен
- [ ] npm работает (`npm -v`)
- [ ] Проект скопирован на сервер
- [ ] Зависимости установлены (`npm install`)
- [ ] TypeScript скомпилирован (`npm run build`)
- [ ] `.env` файл создан с нужными переменными
- [ ] PM2 установлен и приложение запущено (`pm2 list`)
- [ ] Приложение работает (`curl http://localhost:3000/api/health`)
- [ ] Nginx настроен и запущен
- [ ] SSL сертификат получен
- [ ] PM2 сохранён для автозапуска (`pm2 save`)
- [ ] К DNS tracer работает (если нужна без прокси)
- [ ] Мониторинг логов настроен

---

## Дополнительные ресурсы

- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Certbot](https://certbot.eff.org/)
- [Node.js Deployment Best Practices](https://nodejs.org/en/docs/guides/nodejs-deployment-best-practices/)

---

**Последнее обновление:** 2026-04-19  
**Версия Node.js:** 20.x LTS
