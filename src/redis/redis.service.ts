import { ConfigService } from '@nestjs/config';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    // this.client = new Redis({
    //   host: 'localhost',
    //   port: 6379,
    // });
    // this.client = new Redis(
    //   'rediss://default:ASagAAImcDIwMDdkNmY0N2RmODI0YWZiOThiNjYzZDViNjI5MjYzNnAyOTg4OA@wired-sailfish-9888.upstash.io:6379',
    // );
    const redisUrl = this.configService.get<string>('REDIS_URL');

    this.client = new Redis(redisUrl as string, {
      tls: {
        rejectUnauthorized: false,
      },
      maxRetriesPerRequest: null, // avoid MaxRetriesPerRequestError
      enableOfflineQueue: true,
    });
    this.client.on('connect', () => {
      console.log('Redis client connected');
    });

    this.client.on('error', (err) => {
      console.error('Redis error', err);
    });
  }

  getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }
    return this.client;
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      console.log('Redis client disconnected');
    }
  }
}
