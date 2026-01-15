import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn().mockReturnThis(),
    quit: jest.fn().mockResolvedValue(undefined),
  }));
});

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(async () => {
    process.env.REDIS_URL = 'redis://localhost:6380';

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [RedisService],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
