import axios from 'axios';
import * as cheerio from 'cheerio';
import { TorrentFile, TrackerConfig } from '../types';
import https from 'https';

export class TrackerParser {
  private config: TrackerConfig;
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  constructor(config: TrackerConfig) {
    this.config = config;
  }

  /**
   * Search torrents on the tracker
   */
  async search(query: string, page: number = 1): Promise<TorrentFile[]> {
    // YTS uses API directly
    if (this.config.name === 'YTS') {
      return this.searchYTS(query, page);
    }
    
    try {
      const url = this.buildSearchUrl(query, page);
      console.log(`Searching ${this.config.name}: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: 15000,
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
      });

      return this.parseSearchResults(response.data, this.config.name);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`Search error for ${this.config.name}:`, error.message);
      }
      return [];
    }
  }

  /**
   * Parse HTML response and extract torrent information
   */
  private parseSearchResults(html: string, source: string): TorrentFile[] {
    const $ = cheerio.load(html);
    const results: TorrentFile[] = [];

    // Route to tracker-specific parser
    switch (source) {
      case '1337x':
        return this.parse1337x($, source);
      case 'NYAA':
        return this.parseNYAA($, source);
      case 'YTS':
        return this.parseYTS($, source);
      case 'RuTor':
        return this.parseRuTor($, source);
      case 'NNMClub':
        return this.parseNNMClub($, source);
      default:
        console.error(`Unknown tracker: ${source}`);
        return [];
    }
  }

  private parse1337x($: any, source: string): TorrentFile[] {
    const results: TorrentFile[] = [];
    $('.table-list tbody tr').each((index: number, element: any) => {
      try {
        const $row = $(element);
        const $link = $row.find('td.name a:nth-child(2)');
        const title = $link.text().trim();
        const href = $link.attr('href');
        const id = href?.split('/')[1] || '';
        const $magnet = $row.find('td a[href^="magnet:"]');
        const magnet = $magnet.attr('href') || '';
        const $seeders = $row.find('td.seeds');
        const $leechers = $row.find('td.leeches');
        const seeders = parseInt($seeders.text()) || 0;
        const leechers = parseInt($leechers.text()) || 0;
        const $size = $row.find('td.size');
        const size = $size.text().trim();
        if (title && magnet) {
          results.push({ id, title, size, seeders, leechers, magnet, source });
        }
      } catch (error) {
        console.error('Error parsing 1337x row:', error);
      }
    });
    return results;
  }

  private parseNYAA($: any, source: string): TorrentFile[] {
    const results: TorrentFile[] = [];
    $('tr').slice(1).each((index: number, element: any) => {
      try {
        const $row = $(element);
        const $link = $row.find('.torrent-name a');
        if ($link.length === 0) return;
        const title = $link.text().trim();
        const href = $link.attr('href');
        const id = href?.split('=')[1] || String(index);
        const $magnet = $row.find('td a[href^="magnet:"]');
        const magnet = $magnet.attr('href') || '';
        const $stats = $row.find('td.col-2');
        if ($stats.length >= 2) {
          const stats = $stats.map((i: number, el: any) => parseInt($(el).text())).get();
          const seeders = stats[0] || 0;
          const leechers = stats[1] || 0;
          const sizeCell = $row.find('td.col-size');
          const size = sizeCell.text().trim();
          if (title) {
            results.push({ id, title, size, seeders, leechers, magnet, source });
          }
        }
      } catch (error) {
        console.error('Error parsing NYAA row:', error);
      }
    });
    return results;
  }

  private async searchYTS(query: string, page: number = 1): Promise<TorrentFile[]> {
    try {
      // Try multiple API endpoints if DNS blocking
      const apiEndpoints = [
        'https://yts.mx/api/v2/list_movies.json',
        'https://yts.yt/api/v2/list_movies.json',
        'https://ytstapi.xyz/api/v2/list_movies.json',
      ];
      
      for (const baseUrl of apiEndpoints) {
        try {
          const apiUrl = `${baseUrl}?query_term=${encodeURIComponent(query)}&page=${page}`;
          console.log(`Trying YTS API: ${apiUrl}`);
          
          const response = await axios.get(apiUrl, {
            headers: { 'User-Agent': this.userAgent },
            timeout: 10000,
            httpsAgent: new https.Agent({
              rejectUnauthorized: false,
            }),
          });
          
          const results: TorrentFile[] = [];
          
          if (response.data.data && response.data.data.movies) {
            for (const movie of response.data.data.movies) {
              if (!movie.torrents) continue;
              
              for (const torrent of movie.torrents) {
                results.push({
                  id: String(movie.id),
                  title: `${movie.title} (${torrent.quality})`,
                  size: torrent.size || 'Unknown',
                  seeders: torrent.seeds || 0,
                  leechers: torrent.peers || 0,
                  magnet: torrent.url || '',
                  source: 'YTS',
                  date: movie.year ? String(movie.year) : undefined,
                });
              }
            }
            console.log(`YTS found ${results.length} results`);
            return results;
          }
        } catch (err) {
          console.log(`Failed to reach ${baseUrl}`);
          continue;
        }
      }
      
      return [];
    } catch (error) {
      console.error('YTS API search error:', error);
      return [];
    }
  }
  
  private parseYTS($: any, source: string): TorrentFile[] {
    // Deprecated: YTS now uses API directly
    return [];
  }

  private parseRuTor($: any, source: string): TorrentFile[] {
    const results: TorrentFile[] = [];
    $('#index table tr').slice(1).each((index: number, element: any) => {
      try {
        const $row = $(element);
        const $cells = $row.find('td');
        
        if ($cells.length < 3) return; // Skip incomplete rows
        
        // Find magnet link in first cell with titles
        const $cell1 = $($cells[0]);
        const $magnet = $cell1.find('a[href^="magnet:"]');
        const magnet = $magnet.attr('href') || '';
        
        // Find title link (last link in the cell)
        const $titleLink = $cell1.find('a[href^="/torrent/"]').last();
        if ($titleLink.length === 0) return;
        
        const title = $titleLink.text().trim();
        const href = $titleLink.attr('href');
        const id = href?.split('/').pop() || String(index);
        
        // Extract size from table (usually second or third column)
        let size = 'Unknown';
        for (let i = 1; i < $cells.length; i++) {
          const cellText = $($cells[i]).text().trim();
          const sizeMatch = cellText.match(/([\d.]+\s*[GMKB]B)/i);
          if (sizeMatch) {
            size = sizeMatch[1];
            break;
          }
        }
        
        // Extract seeders and leechers (green/red spans in centered cell)
        let seeders = 0;
        let leechers = 0;
        const $piratesCell = $row.find('td:has(span.green)');
        if ($piratesCell.length > 0) {
          const greenText = $piratesCell.find('span.green').text().replace(/[^\d]/g, '');
          const redText = $piratesCell.find('span.red').text().replace(/[^\d]/g, '');
          seeders = parseInt(greenText) || 0;
          leechers = parseInt(redText) || 0;
        }
        
        if (title && magnet) {
          results.push({ id, title, size, seeders, leechers, magnet, source });
        }
      } catch (error) {
        console.error('Error parsing RuTor row:', error);
      }
    });
    return results;
  }

  private parseNNMClub($: any, source: string): TorrentFile[] {
    const results: TorrentFile[] = [];
    // NNMClub requires authentication, this is a generic parser for the search result table
    $('table.tor-table tr').slice(1).each((index: number, element: any) => {
      try {
        const $row = $(element);
        const $titleCell = $row.find('td.t-title');
        const $link = $titleCell.find('a.tLink').first();
        if ($link.length === 0) return;
        
        const title = $link.text().trim();
        const href = $link.attr('href');
        const id = href?.split('=').pop() || String(index);
        
        // Extract magnet link (usually a different format)
        const $magnet = $row.find('a[href^="magnet:"]');
        const magnet = $magnet.attr('href') || '';
        
        // Extract size (usually in tSize cell)
        const $sizeCell = $row.find('td.t-size');
        const size = $sizeCell.text().trim();
        
        // Extract seeders and leechers
        const $seedersCell = $row.find('td.t-s-seed b');
        const $leechersCell = $row.find('td.t-s-leech b');
        const seeders = parseInt($seedersCell.text()) || 0;
        const leechers = parseInt($leechersCell.text()) || 0;
        
        if (title) {
          results.push({ id, title, size, seeders, leechers, magnet, source });
        }
      } catch (error) {
        console.error('Error parsing NNMClub row:', error);
      }
    });
    return results;
  }

  /**
   * Build search URL for the tracker
   */
  private buildSearchUrl(query: string, page: number): string {
    const encodedQuery = encodeURIComponent(query);
    
    switch (this.config.name) {
      case '1337x':
        const pageParam1337x = page > 1 ? `/${page}/` : '/';
        return `${this.config.baseUrl}${this.config.searchPath}${encodedQuery}${pageParam1337x}`;
      case 'NYAA':
        const pageParamNYAA = page > 1 ? `&p=${page}` : '';
        return `${this.config.baseUrl}${this.config.searchPath}${encodedQuery}${pageParamNYAA}`;
      case 'YTS':
        return `${this.config.baseUrl}${this.config.searchPath}${encodedQuery}`;
      case 'RuTor':
        // RuTor uses direct URL without encoding: /search/query
        return `${this.config.baseUrl}${this.config.searchPath}${query}`;
      case 'NNMClub':
        return `${this.config.baseUrl}?nm=${encodedQuery}`;
      default:
        return `${this.config.baseUrl}${this.config.searchPath}${encodedQuery}`;
    }
  }

  /**
   * Check if the tracker is available
   * NOTE: Many trackers don't respond well to HEAD/GET on baseUrl.
   * We assume availability and let search() handle failures.
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const config = {
        headers: { 'User-Agent': this.userAgent },
        timeout: 5000,
      };
      
      // For YTS, check API endpoint directly
      if (this.config.name === 'YTS') {
        const response = await axios.get(`${this.config.baseUrl}/api/v2/list_movies.json`, config);
        return response.status === 200;
      }
      
      // For RuTor, check main page or search (availability may vary)
      if (this.config.name === 'RuTor') {
        const response = await axios.get(`${this.config.baseUrl}/`, config);
        return response.status === 200;
      }
      
      // For other trackers, assume available (let search() handle errors)
      // Many trackers block direct baseUrl requests but search works fine
      return true;
    } catch (error) {
      console.error(`Availability check failed for ${this.config.name}:`, error instanceof Error ? error.message : 'Unknown error');
      // Don't mark as unavailable - try search anyway
      return true;
    }
  }
}
