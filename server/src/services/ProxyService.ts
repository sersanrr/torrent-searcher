import axios from 'axios';

export interface ProxyConfig {
  host: string;
  port: number;
  protocol: 'http' | 'https' | 'socks4' | 'socks5';
  auth?: {
    username: string;
    password: string;
  };
}

export class ProxyService {
  private proxies: ProxyConfig[] = [];
  private currentIndex = 0;

  /**
   * Add a proxy to the pool
   */
  addProxy(proxy: ProxyConfig): void {
    this.proxies.push(proxy);
  }

  /**
   * Get next proxy from pool (round-robin)
   */
  getNextProxy(): ProxyConfig | undefined {
    if (this.proxies.length === 0) return undefined;

    const proxy = this.proxies[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
    return proxy;
  }

  /**
   * Make request through proxy
   */
  async fetchThroughProxy(url: string, options?: { timeout?: number }): Promise<string> {
    const proxy = this.getNextProxy();

    if (!proxy) {
      // Fallback to direct request
      const response = await axios.get(url, {
        timeout: options?.timeout || 15000,
      });
      return response.data;
    }

    const proxyUrl = `${proxy.protocol}://${proxy.auth?.username}:${proxy.auth?.password}@${proxy.host}:${proxy.port}`;

    const response = await axios.get(url, {
      proxy: {
        host: proxy.host,
        port: proxy.port,
        protocol: proxy.protocol === 'socks5' ? 'socks5' : 'http',
      },
      timeout: options?.timeout || 15000,
      httpsAgent: undefined, // Would need https-proxy-agent for HTTPS
    });

    return response.data;
  }

  /**
   * Test if proxy is working
   */
  async testProxy(proxy: ProxyConfig): Promise<boolean> {
    try {
      await axios.get('https://httpbin.org/ip', {
        proxy: {
          host: proxy.host,
          port: proxy.port,
        },
        timeout: 5000,
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Load proxies from environment variables
   */
  loadFromEnv(): void {
    const proxies = process.env.HTTP_PROXY || process.env.http_proxy;
    
    if (proxies) {
      // Parse proxy string (e.g., http://user:pass@host:port)
      const match = proxies.match(/^(https?):\/\/(?:([^:]+):([^@]+)@)?([^:]+):(\d+)/);
      if (match) {
        this.addProxy({
          protocol: match[1] as 'http' | 'https',
          auth: match[2] ? { username: match[2], password: match[3] } : undefined,
          host: match[4],
          port: parseInt(match[5]),
        });
      }
    }
  }
}
