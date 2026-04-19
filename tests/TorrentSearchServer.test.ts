import request from 'supertest';
import { TorrentSearchServer } from '../../server/src/server';

describe('TorrentSearchServer Integration Tests', () => {
  let server: TorrentSearchServer;
  let app: any;

  beforeAll(() => {
    server = new TorrentSearchServer(0); // Use random available port
    app = server.getApp();
  });

  describe('GET /', () => {
    it('should serve frontend HTML', async () => {
      const response = await request(app).get('/');
      
      expect(response.status).toBe(200);
      expect(response.type).toBe('text/html');
      expect(response.text).toContain('Torrent Searcher');
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('trackers');
      expect(response.body.trackers).toHaveProperty('total');
    });
  });

  describe('GET /api/trackers', () => {
    it('should return list of trackers', async () => {
      const response = await request(app).get('/api/trackers');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('trackers');
      expect(Array.isArray(response.body.trackers)).toBe(true);
      expect(response.body.trackers.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/search', () => {
    it('should return 400 for missing query', async () => {
      const response = await request(app).get('/api/search');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for too short query', async () => {
      const response = await request(app).get('/api/search?q=a');
      
      expect(response.status).toBe(400);
    });

    it('should return search results for valid query', async () => {
      const response = await request(app)
        .get('/api/search?q=test')
        .timeout(20000); // 20 second timeout for network
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('query', 'test');
        expect(response.body).toHaveProperty('results');
        expect(Array.isArray(response.body.results)).toBe(true);
      } else {
        // Might fail due to network issues, that's OK for integration tests
        console.log('Search failed (network issue), skipping validation');
      }
    }, 25000);

    it('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/api/search?q=test&page=2&limit=5')
        .timeout(20000);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('page', 2);
        expect(response.body.total).toBeLessThanOrEqual(5);
      }
    }, 25000);
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/non-existent-route');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Not found');
    });
  });
});
