import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import fastifyRateLimit from '@fastify/rate-limit';
import { env } from '../config/env.js';

const rateLimitPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(fastifyRateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_TIME_WINDOW_MS,
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true,
    },
    errorResponseBuilder: (_request, context) => {
      const retryAfterSeconds = Math.ceil(Number(context.ttl) / 1000);
      const windowSeconds = Math.round(Number(context.after) / 1000);
      return {
        statusCode: 429,
        error: 'Too Many Requests',
        message: `Rate limit exceeded. You are limited to ${context.max} requests per ${windowSeconds} seconds. Retry after ${retryAfterSeconds} seconds.`,
        code: 'RATE_LIMIT_EXCEEDED',
      };
    },
  });
};

export default fp(rateLimitPlugin, {
  name: 'rate-limit-plugin',
});
