import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';

export class TorrentSearchServer {
  private app: any;
  private port: number;
  private controllers: any;

  constructor(port: number = 3000) {
    this.port = port;
    this.app = express();
    
    // Use the same approach as the working simple-server.js
    const PROJECT_ROOT = __dirname;
    const FRONTEND_PATH = path.join(PROJECT_ROOT, '../../../frontend');
    
    console.log('PROJECT_ROOT:', PROJECT_ROOT);
    console.log('FRONTEND_PATH:', FRONTEND_PATH);
    
    // Check if frontend exists
    const fs = require('fs');
    console.log('Frontend exists?', fs.existsSync(FRONTEND_PATH));
    console.log('index.html exists?', fs.existsSync(path.join(FRONTEND_PATH, 'index.html')));
  
    // Initialize services
    const { ProxyService } = require('./services/ProxyService');
    const proxyService = new ProxyService();
    proxyService.loadFromEnv();

    // Initialize parsers for enabled trackers
    const { TrackerParser } = require('./tracker/TrackerParser');
    const { TRACKER_CONFIGS } = require('./config/trackers');
    const parsers = TRACKER_CONFIGS
      .filter((config: any) => config.enabled)
      .map((config: any) => new TrackerParser(config));

    const { TorrentSearchController } = require('./controllers/TorrentSearchController');
    this.controllers = new TorrentSearchController(parsers, proxyService);

    this.setupMiddleware(FRONTEND_PATH);
    this.setupRoutes(FRONTEND_PATH);
  }

  private setupMiddleware(frontendPath: string): void {
    // CORS for development
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' ? false : true,
    }));

    // Body parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Serve static files (frontend)
    this.app.use(express.static(frontendPath));

    // Request logging
    this.app.use((req: any, res: any, next: any) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(frontendPath: string): void {
    // API routes
    this.app.get('/api/search', (req: any, res: any) => this.controllers.search(req, res));
    this.app.get('/api/health', (req: any, res: any) => this.controllers.health(req, res));
    this.app.get('/api/trackers', (req: any, res: any) => this.controllers.trackers(req, res));

    // Serve frontend for root route
    this.app.get('/', (req: any, res: any) => {
      const indexPath = path.join(frontendPath, 'index.html');
      console.log('Serving index.html from:', indexPath);
      res.sendFile(indexPath);
    });

    // 404 handler
    this.app.use((req: any, res: any) => {
      res.status(404).json({ error: 'Not found' });
    });
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.app.listen(this.port, (err?: Error) => {
        if (err) {
          reject(err);
        } else {
          console.log(`🚀 Torrent Search Server running on http://localhost:${this.port}`);
          console.log(`📊 API docs: http://localhost:${this.port}/api/health`);
          resolve();
        }
      });
    });
  }

  /**
   * Get Express app (useful for testing)
   */
  getApp(): any {
    return this.app;
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new TorrentSearchServer(parseInt(process.env.PORT || '3000'));
  server.start().catch(console.error);
}
