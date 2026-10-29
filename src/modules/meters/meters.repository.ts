import { getDb } from '../../db/connection.js';
import { MeterDto, PaginationParams } from '../../common/types.js';

export interface MeterFilterParams {
  q?: string;
  dtCode?: string;
  make?: string;
  phaseType?: string;
  installStatus?: string;
  installType?: string;
  build?: string;
  feederCode?: string;
  substationCode?: string;
  divisionCode?: string;
  circleCode?: string;
  zoneCode?: string;
  hasGeo?: boolean;
}

export interface MeterSortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface MeterStatsDto {
  totalMeters: number;
  byStatus: Record<string, number>;
  byMake: Record<string, number>;
  byPhaseType: Record<string, number>;
  byBuild: Record<string, number>;
  byInstallType: Record<string, number>;
}

const SORT_COLUMN_MAP: Record<string, string> = {
  meterId: 'm.meter_id',
  serialNo: 'm.serial_no',
  make: 'm.make',
  phaseType: 'm.phase_type',
  installStatus: 'm.install_status',
  installType: 'm.install_type',
  build: 'm.build',
  dtCode: 'm.dt_code',
  createdAt: 'm.created_at',
};

interface MeterRow {
  meter_id: string;
  serial_no: string;
  make: string;
  phase_type: string;
  install_status: string;
  install_type: string;
  build: string;
  dt_code: string;
  dt_name: string | null;
  dt_capacity_kva: number | null;
  lat: number | null;
  lng: number | null;
  hierarchy_json: string;
  created_at: string;
}

export class MetersRepository {
  private db = getDb();

  public findMany(
    filters: MeterFilterParams,
    pagination: PaginationParams,
    sort: MeterSortParams
  ): { items: MeterDto[]; total: number } {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters.q) {
      conditions.push('(m.meter_id LIKE ? OR m.serial_no LIKE ?)');
      const wild = `%${filters.q}%`;
      params.push(wild, wild);
    }

    if (filters.dtCode) {
      conditions.push('m.dt_code = ?');
      params.push(filters.dtCode);
    }

    if (filters.make) {
      conditions.push('m.make = ?');
      params.push(filters.make);
    }

    if (filters.phaseType) {
      conditions.push('m.phase_type = ?');
      params.push(filters.phaseType);
    }

    if (filters.installStatus) {
      conditions.push('m.install_status = ?');
      params.push(filters.installStatus);
    }

    if (filters.installType) {
      conditions.push('m.install_type = ?');
      params.push(filters.installType);
    }

    if (filters.build) {
      conditions.push('m.build = ?');
      params.push(filters.build);
    }

    if (filters.feederCode) {
      conditions.push('m.feeder_code = ?');
      params.push(filters.feederCode);
    }

    if (filters.substationCode) {
      conditions.push('m.substation_code = ?');
      params.push(filters.substationCode);
    }

    if (filters.divisionCode) {
      conditions.push('m.division_code = ?');
      params.push(filters.divisionCode);
    }

    if (filters.circleCode) {
      conditions.push('m.circle_code = ?');
      params.push(filters.circleCode);
    }

    if (filters.zoneCode) {
      conditions.push('m.zone_code = ?');
      params.push(filters.zoneCode);
    }

    if (filters.hasGeo !== undefined) {
      if (filters.hasGeo) {
        conditions.push('m.lat IS NOT NULL AND m.lng IS NOT NULL');
      } else {
        conditions.push('(m.lat IS NULL OR m.lng IS NULL)');
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) as total FROM meters m ${whereClause}`;
    const countStmt = this.db.prepare(countSql);
    const countRow = countStmt.get(...params) as { total: number };
    const total = countRow?.total ?? 0;

    if (total === 0) {
      return { items: [], total: 0 };
    }

    const sortCol = (sort.sortBy && SORT_COLUMN_MAP[sort.sortBy]) ? SORT_COLUMN_MAP[sort.sortBy] : 'm.meter_id';
    const sortDir = sort.sortOrder?.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    const offset = (pagination.page - 1) * pagination.pageSize;
    const fetchSql = `
      SELECT 
        m.meter_id, 
        m.serial_no, 
        m.make, 
        m.phase_type, 
        m.install_status, 
        m.install_type, 
        m.build,
        m.dt_code, 
        d.name as dt_name,
        d.capacity_kva as dt_capacity_kva,
        m.lat, 
        m.lng, 
        m.hierarchy_json, 
        m.created_at
      FROM meters m
      LEFT JOIN dts d ON m.dt_code = d.code
      ${whereClause}
      ORDER BY ${sortCol} ${sortDir}
      LIMIT ? OFFSET ?
    `;

    const fetchStmt = this.db.prepare(fetchSql);
    const rows = fetchStmt.all(...params, pagination.pageSize, offset) as unknown as MeterRow[];

    const items: MeterDto[] = rows.map((r) => this.mapRowToDto(r));

    return { items, total };
  }

  public findById(meterId: string): MeterDto | null {
    const sql = `
      SELECT 
        m.meter_id, 
        m.serial_no, 
        m.make, 
        m.phase_type, 
        m.install_status, 
        m.install_type, 
        m.build,
        m.dt_code, 
        d.name as dt_name,
        d.capacity_kva as dt_capacity_kva,
        m.lat, 
        m.lng, 
        m.hierarchy_json, 
        m.created_at
      FROM meters m
      LEFT JOIN dts d ON m.dt_code = d.code
      WHERE m.meter_id = ? OR m.serial_no = ?
      LIMIT 1
    `;
    const stmt = this.db.prepare(sql);
    const row = stmt.get(meterId, meterId) as MeterRow | undefined;

    return row ? this.mapRowToDto(row) : null;
  }

  public getStats(): MeterStatsDto {
    const totalStmt = this.db.prepare('SELECT COUNT(*) as total FROM meters');
    const totalRow = totalStmt.get() as { total: number };
    const totalMeters = totalRow?.total ?? 0;

    const groupQuery = (column: string): Record<string, number> => {
      const stmt = this.db.prepare(`SELECT ${column} as k, COUNT(*) as c FROM meters GROUP BY ${column}`);
      const rows = stmt.all() as Array<{ k: string; c: number }>;
      const result: Record<string, number> = {};
      for (const row of rows) {
        if (row.k) result[row.k] = row.c;
      }
      return result;
    };

    return {
      totalMeters,
      byStatus: groupQuery('install_status'),
      byMake: groupQuery('make'),
      byPhaseType: groupQuery('phase_type'),
      byBuild: groupQuery('build'),
      byInstallType: groupQuery('install_type'),
    };
  }

  private mapRowToDto(row: MeterRow): MeterDto {
    let hierarchy = {};
    try {
      hierarchy = JSON.parse(row.hierarchy_json);
    } catch {
      hierarchy = {};
    }

    return {
      meterId: row.meter_id,
      serialNo: row.serial_no,
      make: row.make,
      phaseType: row.phase_type,
      installStatus: row.install_status,
      installType: row.install_type,
      build: row.build,
      dtCode: row.dt_code,
      dtName: row.dt_name ?? undefined,
      dtCapacityKva: row.dt_capacity_kva ?? undefined,
      hierarchy,
      geo: {
        lat: row.lat ?? 0,
        lng: row.lng ?? 0,
      },
      createdAt: row.created_at,
    };
  }
}
