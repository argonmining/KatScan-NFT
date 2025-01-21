type CacheEntry<T> = {
  data: T;
  timestamp: number;
}

class IPFSCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly TTL = 1000 * 60 * 5; // 5 minutes cache

  set(key: string, value: any) {
    this.cache.set(key, {
      data: value,
      timestamp: Date.now()
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear() {
    this.cache.clear();
  }
}

export const ipfsCache = new IPFSCache(); 