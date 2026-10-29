export const meterQuerySchema = {
  type: 'object',
  properties: {
    page: { type: 'integer', minimum: 1, default: 1, description: 'Page number' },
    pageSize: { type: 'integer', minimum: 1, maximum: 100, default: 20, description: 'Page size' },
    sortBy: {
      type: 'string',
      enum: ['meterId', 'serialNo', 'make', 'phaseType', 'installStatus', 'installType', 'build', 'dtCode', 'createdAt'],
      default: 'meterId',
      description: 'Sort field',
    },
    sortOrder: {
      type: 'string',
      enum: ['asc', 'desc'],
      default: 'asc',
      description: 'Sort direction',
    },
    q: { type: 'string', description: 'Search term matching meter ID or serial number' },
    dtCode: { type: 'string', description: 'Filter by DT code (e.g. DT-001)' },
    make: {
      type: 'string',
      enum: ['HPL', 'L&T', 'Genus', 'Allied', 'Secure'],
      description: 'Filter by meter manufacturer',
    },
    phaseType: {
      type: 'string',
      enum: ['single', 'three'],
      description: 'Filter by single or three phase',
    },
    installStatus: {
      type: 'string',
      enum: ['Installed', 'Decommissioned', 'Faulty'],
      description: 'Filter by installation status',
    },
    installType: {
      type: 'string',
      enum: ['Whole Current', 'CT Operated'],
      description: 'Filter by installation type',
    },
    build: {
      type: 'string',
      enum: ['legacy', 'v2'],
      description: 'Filter by hardware build version',
    },
    feederCode: { type: 'string', description: 'Filter by feeder code' },
    substationCode: { type: 'string', description: 'Filter by substation code' },
    divisionCode: { type: 'string', description: 'Filter by division code' },
    circleCode: { type: 'string', description: 'Filter by circle code' },
    zoneCode: { type: 'string', description: 'Filter by zone code' },
    hasGeo: { type: 'boolean', description: 'Filter for meters that have geo coordinates' },
  },
} as const;

const meterItemSchema = {
  type: 'object',
  properties: {
    meterId: { type: 'string', example: 'J100000' },
    serialNo: { type: 'string', example: 'SE33962' },
    make: { type: 'string', example: 'HPL' },
    phaseType: { type: 'string', example: 'single' },
    installStatus: { type: 'string', example: 'Decommissioned' },
    installType: { type: 'string', example: 'Whole Current' },
    build: { type: 'string', example: 'legacy' },
    dtCode: { type: 'string', example: 'DT-001' },
    dtName: { type: 'string', example: 'Malviya Nagar DT 1' },
    dtCapacityKva: { type: 'number', example: 100 },
    hierarchy: {
      type: 'object',
      properties: {
        zone: { type: 'object', properties: { name: { type: 'string' }, code: { type: 'string' } } },
        circle: { type: 'object', properties: { name: { type: 'string' }, code: { type: 'string' } } },
        division: { type: 'object', properties: { name: { type: 'string' }, code: { type: 'string' } } },
        subdivision: { type: 'object', properties: { name: { type: 'string' }, code: { type: 'string' } } },
        substation: { type: 'object', properties: { name: { type: 'string' }, code: { type: 'string' } } },
        feeder: { type: 'object', properties: { name: { type: 'string' }, code: { type: 'string' } } },
        dt: { type: 'object', properties: { name: { type: 'string' }, code: { type: 'string' } } },
      },
    },
    geo: {
      type: 'object',
      properties: {
        lat: { type: 'number', example: 26.938961 },
        lng: { type: 'number', example: 75.830957 },
      },
    },
    createdAt: { type: 'string' },
  },
};

export const meterListResponseSchema = {
  200: {
    description: 'Paginated list of Urja meters',
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'array',
        items: meterItemSchema,
      },
      pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          pageSize: { type: 'integer', example: 20 },
          totalItems: { type: 'integer', example: 403 },
          totalPages: { type: 'integer', example: 21 },
          hasNextPage: { type: 'boolean', example: true },
          hasPrevPage: { type: 'boolean', example: false },
        },
      },
    },
  },
} as const;

export const meterDetailResponseSchema = {
  200: {
    description: 'Detailed information for a single meter',
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: meterItemSchema,
    },
  },
  404: {
    description: 'Meter not found',
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      error: {
        type: 'object',
        properties: {
          code: { type: 'string', example: 'NOT_FOUND' },
          message: { type: 'string', example: "Meter with identifier 'J999999' not found" },
        },
      },
    },
  },
} as const;

export const meterStatsResponseSchema = {
  200: {
    description: 'Aggregated meter statistics',
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        properties: {
          totalMeters: { type: 'integer', example: 403 },
          byStatus: {
            type: 'object',
            additionalProperties: { type: 'integer' },
            example: { Installed: 320, Decommissioned: 60, Faulty: 23 },
          },
          byMake: {
            type: 'object',
            additionalProperties: { type: 'integer' },
            example: { HPL: 100, 'L&T': 95, Genus: 88, Allied: 65, Secure: 55 },
          },
          byPhaseType: {
            type: 'object',
            additionalProperties: { type: 'integer' },
            example: { single: 280, three: 123 },
          },
          byBuild: {
            type: 'object',
            additionalProperties: { type: 'integer' },
            example: { legacy: 215, v2: 188 },
          },
          byInstallType: {
            type: 'object',
            additionalProperties: { type: 'integer' },
            example: { 'Whole Current': 310, 'CT Operated': 93 },
          },
        },
      },
    },
  },
} as const;
