export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
}

export interface SingleResult<T> {
  success: true;
  data: T;
}

export interface ApiErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface HierarchyNode {
  name: string;
  code: string;
}

export interface MeterHierarchy {
  zone?: HierarchyNode;
  circle?: HierarchyNode;
  division?: HierarchyNode;
  subdivision?: HierarchyNode;
  substation?: HierarchyNode;
  feeder?: HierarchyNode;
  dt?: HierarchyNode;
}

export interface MeterGeo {
  lat: number;
  lng: number;
}

export interface MeterDto {
  meterId: string;
  serialNo: string;
  make: string;
  phaseType: string;
  installStatus: string;
  installType: string;
  build: string;
  dtCode: string;
  dtName?: string;
  dtCapacityKva?: number;
  hierarchy: MeterHierarchy;
  geo: MeterGeo;
  createdAt: string;
}

export interface DtDto {
  code: string;
  name: string;
  feederCode: string;
  capacityKva: number;
  meterCount?: number;
  createdAt: string;
}

export interface UserDto {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}
