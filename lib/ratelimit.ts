import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const rl = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.fixedWindow(5, '1 m'), // IP başına dakikada 10
  analytics: true
})