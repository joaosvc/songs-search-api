import NodeCache from "node-cache";

export default class Cache {
  private cache: NodeCache;

  constructor(expiration: number = 10000) {
    this.cache = new NodeCache({
      stdTTL: expiration / 1000,
      checkperiod: expiration / 1000 / 2,
    });
  }

  public set<T>(key: string, value: T) {
    this.cache.set(key, value);
  }

  public get<T>(key: string) {
    return this.cache.get<T>(key);
  }

  public async getOrSet(key: string, fn: any) {
    if (this.cache.has(key)) {
      return this.get(key);
    } else {
      const value = await fn();
      this.set(key, value);
      return value;
    }
  }

  public delete(key: string) {
    this.cache.del(key);
  }

  public clear() {
    this.cache.flushAll();
  }
}
