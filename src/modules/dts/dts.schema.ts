export const dtListQuerySchema = {
  type: 'object',
  properties: {
    page: { type: 'integer', minimum: 1, default: 1, description: 'Page number' },
    pageSize: { type: 'integer', minimum: 1, maximum: 100, default: 20, description: 'Items per page' },
    feederCode: { type: 'string', description: 'Filter by feeder code (e.g. F-001)' },
    minCapacityKva: { type: 'number', minimum: 0, description: 'Minimum transformer capacity in kVA' },
    maxCapacityKva: { type: 'number', minimum: 0, description: 'Maximum transformer capacity in kVA' },
    q: { type: 'string', description: 'Search by DT code or name' },
  },
} as const;

const dtItemSchema = {
  type: 'object',
  properties: {
    code: { type: 'string', example: 'DT-001' },
    name: { type: 'string', example: 'Malviya Nagar DT 1' },
    feederCode: { type: 'string', example: 'F-001' },
    capacityKva: { type: 'number', example: 100 },
    meterCount: { type: 'integer', example: 11, description: 'Total meters connected to this DT' },
    createdAt: { type: 'string' },
  },
};

export const dtListResponseSchema = {
  200: {
    description: 'Paginated list of distribution transformers',
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'array',
        items: dtItemSchema,
      },
      pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          pageSize: { type: 'integer', example: 20 },
          totalItems: { type: 'integer', example: 40 },
          totalPages: { type: 'integer', example: 2 },
          hasNextPage: { type: 'boolean', example: true },
          hasPrevPage: { type: 'boolean', example: false },
        },
      },
    },
  },
} as const;

export const dtDetailResponseSchema = {
  200: {
    description: 'Distribution transformer details and connected meters',
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        properties: {
          code: { type: 'string', example: 'DT-001' },
          name: { type: 'string', example: 'Malviya Nagar DT 1' },
          feederCode: { type: 'string', example: 'F-001' },
          capacityKva: { type: 'number', example: 100 },
          meterCount: { type: 'integer', example: 11 },
          createdAt: { type: 'string' },
          meters: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                meterId: { type: 'string', example: 'J100000' },
                serialNo: { type: 'string', example: 'SE33962' },
                make: { type: 'string', example: 'HPL' },
                phaseType: { type: 'string', example: 'single' },
                installStatus: { type: 'string', example: 'Installed' },
                installType: { type: 'string', example: 'Whole Current' },
              },
            },
          },
        },
      },
    },
  },
  404: {
    description: 'Transformer not found',
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      error: {
        type: 'object',
        properties: {
          code: { type: 'string', example: 'NOT_FOUND' },
          message: { type: 'string', example: "Distribution transformer with identifier 'DT-999' not found" },
        },
      },
    },
  },
} as const;
