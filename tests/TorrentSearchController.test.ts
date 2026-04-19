import { TorrentSearchController } from '../server/src/controllers/TorrentSearchController';
import { Request, Response } from 'express';

// Mock the parser
class MockTrackerParser {
  config = { name: 'mock-tracker' };
  
  async search(query: string, page: number) {
    return [
      {
        id: '1',
        title: `Test Result for ${query}`,
        size: '1 GB',
        seeders: 100,
        leechers: 50,
        magnet: 'magnet:?xt=urn:btih:test123',
        source: this.config.name,
      },
      {
        id: '2',
        title: `Another ${query} result`,
        size: '500 MB',
        seeders: 10,
        leechers: 5,
        magnet: 'magnet:?xt=urn:btih:test456',
        source: this.config.name,
      },
    ];
  }

  async checkAvailability() {
    return true;
  }
}

// Mock proxy service
class MockProxyService {}

describe('TorrentSearchController', () => {
  let controller: TorrentSearchController;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    const parsers = [new MockTrackerParser()];
    const proxyService = new MockProxyService();
    controller = new TorrentSearchController(parsers, proxyService);

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('search', () => {
    it('should validate query parameter', async () => {
      const mockRequest = { query: { q: '' } } as unknown as Request;
      await controller.search(mockRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: expect.stringContaining('Query parameter "q" is required'),
      });
    });

    it('should return 400 for query with < 2 characters', async () => {
      const mockRequest = { query: { q: 'a' } } as unknown as Request;
      await controller.search(mockRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should return search results for valid query', async () => {
      const mockRequest = { query: { q: 'test query', page: '1', limit: '20' } } as unknown as Request;
      await controller.search(mockRequest, mockResponse as Response);

      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        query: 'test query',
        page: 1,
        total: expect.any(Number),
        results: expect.arrayContaining([
          expect.objectContaining({
            title: expect.stringContaining('test query'),
            magnet: expect.stringContaining('magnet:?'),
          }),
        ]),
      });
    });

    it('should handle server errors gracefully', async () => {
      // Override mock to throw error
      const badParser = new (class {
        async search() { throw new Error('Network error'); }
        async checkAvailability() { return false; }
        config = { name: 'bad-tracker' };
      })();

      const badController = new TorrentSearchController([badParser], new MockProxyService());
      
      const mockRequest = { query: { q: 'test' } } as unknown as Request;
      await badController.search(mockRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: expect.any(String),
        message: expect.any(String),
      });
    });
  });

  describe('health', () => {
    it('should return OK status when tracker is available', async () => {
      const mockRequest = { query: {} } as unknown as Request;
      await controller.health(mockRequest, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'ok',
        trackers: expect.objectContaining({
          total: expect.any(Number),
          available: expect.any(Number),
        }),
      });
    });
  });

  describe('trackers', () => {
    it('should return list of available trackers', async () => {
      const mockRequest = { query: {} } as unknown as Request;
      await controller.trackers(mockRequest, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith({
        trackers: expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            available: expect.any(Boolean),
          }),
        ]),
      });
    });
  });
});
