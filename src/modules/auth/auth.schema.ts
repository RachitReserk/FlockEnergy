export const loginBodySchema = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
      description: 'Operator email address',
      example: 'operator@urja.local',
    },
    password: {
      type: 'string',
      minLength: 1,
      description: 'Operator password',
      example: 'urja-ops-2026',
    },
  },
} as const;

export const loginResponseSchema = {
  200: {
    description: 'Successful authentication',
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        properties: {
          token: { type: 'string', description: 'JWT Bearer token' },
          tokenType: { type: 'string', example: 'Bearer' },
          expiresIn: { type: 'string', example: '24h' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string', example: 'operator@urja.local' },
              role: { type: 'string', example: 'operator' },
            },
          },
        },
      },
    },
  },
  401: {
    description: 'Invalid credentials',
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      error: {
        type: 'object',
        properties: {
          code: { type: 'string', example: 'UNAUTHORIZED' },
          message: { type: 'string', example: 'Invalid email or password' },
        },
      },
    },
  },
} as const;

export const meResponseSchema = {
  200: {
    description: 'Current authenticated operator profile',
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          role: { type: 'string' },
          createdAt: { type: 'string' },
        },
      },
    },
  },
} as const;
