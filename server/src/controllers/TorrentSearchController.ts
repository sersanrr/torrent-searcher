import express, { Request, Response } from 'express';
import { TrackerParser } from '../tracker/TrackerParser';
import { TorrentFile } from '../types';
import { ProxyService } from '../services/ProxyService';

export class TorrentSearchController {
  private parsers: TrackerParser[] = [];
  private proxyService: ProxyService;

  constructor(parsers: TrackerParser[], proxyService: ProxyService) {
    this.parsers = parsers;
    this.proxyService = proxyService;
  }

  /**
   * Handle search request
   */
  async search(req: Request, res: Response): Promise<void> {
    try {
      const query = req.query.q as string;

      if (!query || query.trim().length < 2) {
        res.status(400).json({ error: 'Query parameter "q" is required and must be at least 2 characters' });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      // Search across all enabled trackers
      const searchPromises = this.parsers.map(parser => 
        parser.search(query, page).then((results: TorrentFile[]) => 
          results.slice(0, Math.floor(limit / this.parsers.length))
        )
      );

      const allResults = await Promise.all(searchPromises);
      const flattened = allResults.flat();

      // Sort by seeders (descending)
      flattened.sort((a: TorrentFile, b: TorrentFile) => b.seeders - a.seeders);

      // Apply limit
      const finalResults = flattened.slice(0, limit);

      res.json({
        query,
        page,
        total: finalResults.length,
        results: finalResults,
      });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Health check endpoint
   */
  async health(req: Request, res: Response): Promise<void> {
    // Check if at least one tracker is available
    const checks = await Promise.allSettled(
      this.parsers.map(parser => parser.checkAvailability())
    );

    const available = checks.filter(c => c.status === 'fulfilled' && c.value).length;

    res.json({
      status: available > 0 ? 'ok' : 'degraded',
      trackers: {
        total: this.parsers.length,
        available,
      },
      proxies: {
        enabled: false, // Would check proxy service
      },
    });
  }

  /**
   * Get list of available trackers
   */
  async trackers(req: Request, res: Response): Promise<void> {
    const trackerInfo = await Promise.allSettled(
      this.parsers.map(async (parser) => {
        const available = await parser.checkAvailability();
        return {
          name: (parser as any).config.name, // Access private config
          available,
        };
      })
    );

    res.json({
      trackers: trackerInfo.map((result, i) => ({
        name: (this.parsers[i] as any).config.name, // Access private config
        available: result.status === 'fulfilled' ? (result.value as any).available : false,
      })),
    });
  }
}
