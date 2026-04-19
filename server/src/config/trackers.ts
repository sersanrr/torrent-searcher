import { TrackerConfig } from '../types';

/**
 * Configure available trackers
 * NOTE: Use these for legitimate content only. Respect copyright laws.
 */
export const TRACKER_CONFIGS: TrackerConfig[] = [
  {
    name: '1337x',
    baseUrl: 'https://1337x.to',
    searchPath: '/search/',
    enabled: true,
    requiresProxy: true, // Often blocked without proxy
  },
  {
    name: 'NYAA',
    baseUrl: 'https://nyaa.si',
    searchPath: '/?q=',
    enabled: true,
    requiresProxy: false, // Usually accessible
  },
  {
    name: 'YTS',
    baseUrl: 'https://yts.dyndns.org',  // Alternative domain
    searchPath: '/api/v2/list_movies.json',
    enabled: true,
    requiresProxy: false,
  },
];

/**
 * Note about trackers and legality:
 * - Only search for content you have rights to download
 * - Respect copyright and intellectual property laws in your jurisdiction
 * - This tool is for educational purposes and legitimate use cases
 */
