import { Module, Global } from '@nestjs/common';
import { RedisModule } from 'src/redis/redis.module';
import { CacheUtil } from './redis-cache.util';

@Global() // 🔥 খুব important
@Module({
  imports: [RedisModule],
  providers: [CacheUtil],
  exports: [CacheUtil],
})
export class CacheModule {}