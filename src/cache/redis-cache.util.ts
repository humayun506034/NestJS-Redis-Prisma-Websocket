import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import * as crypto from 'crypto';

@Injectable()
export class CacheUtil {
  constructor(private readonly redisService: RedisService) {}

  private get client() {
    return this.redisService.getClient();
  }

  private hash(data: any): string {
    return crypto
      .createHash('md5')
      .update(JSON.stringify(data))
      .digest('hex');
  }

  async getWithAutoRefresh<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds = 120,
  ): Promise<T> {
    const cached = await this.client.get(key);

    if (cached) {
      const parsed = JSON.parse(cached);

      // 🔁 background refresh
      fetchFn()
        .then(async (freshData) => {
          if (this.hash(parsed) !== this.hash(freshData)) {
            await this.client.set(
              key,
              JSON.stringify(freshData),
              'EX',
              ttlSeconds,
            );
            console.log(`Cache auto-updated: ${key}`);
          }
        })
        .catch(console.error);

      // ⚡ immediate response
      return parsed;
    }

    // ❌ no cache → fetch + set
    const freshData = await fetchFn();
    await this.client.set(
      key,
      JSON.stringify(freshData),
      'EX',
      ttlSeconds,
    );

    return freshData;
  }
  async deleteByPattern(pattern: string) {
  const keys = await this.client.keys(pattern);

  if (keys.length > 0) {
    await this.client.del(keys);
    console.log(`Cache cleared: ${pattern}`);
  }
}

}
