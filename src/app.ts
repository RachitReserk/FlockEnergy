import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import authPlugin from './plugins/auth.js';
import swaggerPlugin from './plugins/swagger.js';
import rateLimitPlugin from './plugins/rate-limit.js';
import errorHandlerPlugin from './plugins/error-handler.js';
import { systemRoutes } from './modules/system/system.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { metersRoutes } from './modules/meters/meters.routes.js';
import { dtsRoutes } from './modules/dts/dts.routes.js';
import { env } from './config/env.js';

export function buildApp(opts: FastifyServerOptions = {}): FastifyInstance {
  const isTest = env.NODE_ENV === 'test';

  const defaultLogging = isTest
    ? false
    : {
        level: env.LOG_LEVEL,
        transport:
          env.NODE_ENV === 'development'
            ? {
                target: 'pino-pretty',
                options: {
                  translateTime: 'HH:MM:ss Z',
                  ignore: 'pid,hostname',
                },
              }
            : undefined,
      };

  const app = Fastify({
    logger: defaultLogging,
    ajv: {
      customOptions: {
        strict: false,
      },
    },
    ...opts,
  });

  app.register(fastifyCors, {
    origin: true,
    credentials: true,
  });

  app.register(fastifyHelmet, {
    contentSecurityPolicy: false,
  });

  app.register(rateLimitPlugin);
  app.register(authPlugin);
  app.register(swaggerPlugin);
  app.register(errorHandlerPlugin);

  app.register(systemRoutes);
  app.register(authRoutes, { prefix: '/api/v1/auth' });
  app.register(metersRoutes, { prefix: '/api/v1/meters' });
  app.register(dtsRoutes, { prefix: '/api/v1/dts' });

  return app;
}
