import { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../common/errors.js';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      id: string;
      email: string;
      role: string;
    };
  }
}

const authPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(fastifyJwt, {
    secret: env.JWT_SECRET,
  });

  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!env.AUTH_ENABLED) {
      return;
    }

    try {
      await request.jwtVerify();
    } catch {
      throw new UnauthorizedError('Authentication required. Missing, invalid, or expired Bearer token.');
    }
  });
};

export default fp(authPlugin, {
  name: 'auth-plugin',
});
