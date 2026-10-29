import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { AuthService } from './auth.service.js';
import { loginBodySchema, loginResponseSchema, meResponseSchema } from './auth.schema.js';
import { env } from '../../config/env.js';

export const authRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const authService = new AuthService();

  fastify.post(
    '/login',
    {
      config: {
        rateLimit: {
          max: env.AUTH_RATE_LIMIT_MAX,
          timeWindow: '1 minute',
        },
      },
      schema: {
        tags: ['Authentication'],
        summary: 'Operator Login',
        description:
          'Authenticate with email and password to receive a JWT Bearer token for accessing protected Urja endpoints.',
        body: loginBodySchema,
        response: loginResponseSchema,
      },
    },
    async (request, reply) => {
      const { email, password } = request.body as { email: string; password: string };
      const user = authService.validateCredentials(email, password);

      const token = fastify.jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        { expiresIn: env.JWT_EXPIRES_IN }
      );

      return reply.status(200).send({
        success: true,
        data: {
          token,
          tokenType: 'Bearer',
          expiresIn: env.JWT_EXPIRES_IN,
          user,
        },
      });
    }
  );

  fastify.get(
    '/me',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['Authentication'],
        summary: 'Get Authenticated User Profile',
        description: 'Returns profile details of the currently authenticated operator.',
        security: [{ bearerAuth: [] }],
        response: meResponseSchema,
      },
    },
    async (request, reply) => {
      const tokenUser = request.user as { id: string };
      const user = authService.getUserById(tokenUser.id);
      return reply.status(200).send({
        success: true,
        data: user,
      });
    }
  );
};
