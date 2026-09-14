import { rateLimit } from 'express-rate-limit';
import { isEndToEndTesting } from '../guards/test.guard';

export function createLoginRateLimiter() {
  return rateLimit({
    max: 20,
    message: {
      error: 'Ratelimited',
      message: 'Too Many Requests',
      status: 429,
    },
    skip: () => isEndToEndTesting(),
    windowMs: 60 * 1000,
  });
}
