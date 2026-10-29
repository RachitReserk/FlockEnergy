import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

const swaggerPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(fastifySwagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'Urja Meter Ops API Service',
        description:
          'High-performance, scalable, rate-limited and documented REST API for Urja smart meters and distribution transformers (DTs).',
        version: '1.0.0',
        contact: {
          name: 'Flock Energy Engineering',
          email: 'engineering@flockenergy.tech',
        },
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Local development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Enter your JWT token obtained from POST /api/v1/auth/login',
          },
        },
      },
      tags: [
        { name: 'Authentication', description: 'Operator session and token endpoints' },
        { name: 'Meters', description: 'Smart meters lookup, search, filtering, and stats' },
        { name: 'Distribution Transformers', description: 'Transformer assets and connected meters' },
        { name: 'System', description: 'Service health and introspection' },
      ],
    },
  });

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      displayRequestDuration: true,
      filter: true,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  });

  fastify.get(
    '/openapi.json',
    {
      schema: {
        hide: true,
      },
    },
    async (_request, reply) => {
      const spec = fastify.swagger();
      return reply.type('application/json').send(spec);
    }
  );
};

export default fp(swaggerPlugin, {
  name: 'swagger-plugin',
});
