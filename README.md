# Torrent Searcher

A web application to search torrents across multiple trackers with a clean, modern frontend and Node.js backend with proxy support.

## Features

- 🌐 Multi-tracker search (1337x, NYAA, YTS, RuTor, NNMClub)
- 🔍 Clean, responsive frontend with card-based results
- 🚀 Node.js backend with TypeScript
- 🌍 Proxy support for bypassing tracker blocks
- ✅ Health check and tracker status endpoints
- 🧪 Comprehensive test suite
- 📱 Mobile-responsive design

## Architecture

```
torrent-searcher/
├── server/
│   └── src/
│       ├── controllers/      # Request handlers
│       ├── tracker/         # Tracker parsers
│       ├── services/         # Proxy service
│       ├── config/          # Configuration
│       ├── types.ts         # TypeScript types
│       └── server.ts        # Main server
├── frontend/
│   ├── index.html           # Main HTML
│   ├── style.css            # Styling
│   └── app.js               # Frontend logic
├── tests/                   # Test files
└── package.json
```

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Build the TypeScript server

```bash
npm run build
```

### 3. Start the server

```bash
npm start
```

The application will be available at http://localhost:3000

### 4. (Optional) Run tests

```bash
npm test
```

## Development

```bash
# Build and run in development mode
npm run dev

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## API Endpoints

### `GET /api/search?q=<query>&page=<number>&limit=<number>`

Search for torrents across all enabled trackers.

**Parameters:**
- `q` (required): Search query (minimum 2 characters)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Maximum results per tracker (default: 20)

**Response:**
```json
{
  "query": "test",
  "page": 1,
  "total": 42,
  "results": [
    {
      "id": "12345",
      "title": "Test Movie 2024",
      "size": "1.5 GB",
      "seeders": 150,
      "leechers": 25,
      "magnet": "magnet:?xt=urn:btih:...",
      "source": "1337x"
    }
  ]
}
```

### `GET /api/health`

Check server health and tracker availability.

**Response:**
```json
{
  "status": "ok",
  "trackers": {
    "total": 5,
    "available": 3
  },
  "proxies": {
    "enabled": false
  }
}
```

### `GET /api/trackers`

Get list of enabled trackers and their status.

**Response:**
```json
{
  "trackers": [
    {
      "name": "1337x",
      "available": true
    },
    {
      "name": "NYAA",
      "available": true
    },
    {
      "name": "YTS",
      "available": false
    },
    {
      "name": "RuTor",
      "available": true
    },
    {
      "name": "NNMClub",
      "available": true
    }
  ]
}
```

## Configuration



**Tracker Status:**
| Tracker | Base URL | Requires Proxy | Language |
|---------|----------|---------------|----------|
| 1337x | https://1337x.to | ✅ | English |
| NYAA | https://nyaa.si | ❌ | English |
| YTS | https://yts.mx | ❌ | English |
| RuTor | https://rutor.is | ✅ | Russian |
| NNMClub | https://nnmclub.to | ✅ | Russian |

**Note:** RuTor and NNMClub require proxy/VPN for access due to blocking patterns. NNMClub additionally requires authentication.
```

### Set up proxy

Set environment variables:

```bash
export HTTP_PROXY=http://proxy.example.com:8080
export http_proxy=http://proxy.example.com:8080
```

### Change port

```bash
export PORT=4000
npm start
```

## Custom Tracker Parsers

Implement `TrackerParser` interface:

```typescript
import * as cheerio from 'cheerio';

export class CustomTrackerParser {
  async search(query: string, page: number): Promise<TorrentFile[]> {
    // Implement your parsing logic
  }
  
  async checkAvailability(): Promise<boolean> {
    // Implement availability check
  }
}
```

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test tests/TorrentSearchController.test.ts

# Run with coverage
npm run test:coverage
```

## Features Showcase

### Frontend
- Card-based results with seeders/leechers indicators
- Color-coded seeder stats (green > 50, yellow > 10, red < 10)
- Magnet link buttons with icons
- Real-time tracker status indicators
- Loading states and empty states
- Mobile-responsive design

### Backend
- TypeScript for type safety
- Express.js for HTTP server
- Cheerio for HTML parsing
- Axios for HTTP requests with proper error handling
- Proxy service for bypassing blocks
- Health checks and status endpoints
- CORS support

## Legal Notice

⚠️ **Use this software responsibly and legally.**

- Only download content you have rights to access.
- Respect copyright and intellectual property laws in your jurisdiction.
- This tool is for educational purposes and legitimate use cases.
- The developers are not responsible for misuse of this software.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for your changes
4. Ensure all tests pass
5. Submit a pull request

## License

ISC

## Support

For issues or questions, please open an issue on the repository.

---

Built with ❤️ and modern web technologies
