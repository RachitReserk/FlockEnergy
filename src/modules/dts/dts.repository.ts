import { getDb } from '../../db/connection.js';
import { DtDto, PaginationParams } from '../../common/types.js';

export interface DtFilterParams {
  feederCode?: string;
  minCapacityKva?: number;
  maxCapacityKva?: number;
  q?: string;
}

export interface DtWithMetersDto extends DtDto {
  meters: Array<{
    meterId: string;
    serialNo: string;
    make: string;
    phaseType: string;
    installStatus: string;
    installType: string;
  }>;
}

export class DtsRepository {
  private db = getDb();

  public findMany(
    filters: DtFilterParams,
    pagination: PaginationParams
  ): { items: DtDto[]; total: number } {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters.feederCode) {
      conditions.push('d.feeder_code = ?');
      params.push(filters.feederCode);
    }

    if (filters.minCapacityKva !== undefined) {
      conditions.push('d.capacity_kva >= ?');
      params.push(filters.minCapacityKva);
    }

    if (filters.maxCapacityKva !== undefined) {
      conditions.push('d.capacity_kva <= ?');
      params.push(filters.maxCapacityKva);
    }

    if (filters.q) {
      conditions.push('(d.code LIKE ? OR d.name LIKE ?)');
      const wild = `%${filters.q}%`;
      params.push(wild, wild);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) as total FROM dts d ${whereClause}`;
    const countStmt = this.db.prepare(countSql);
    const countRow = countStmt.get(...params) as { total: number };
    const total = countRow?.total ?? 0;

    if (total === 0) {
      return { items: [], total: 0 };
    }

    const offset = (pagination.page - 1) * pagination.pageSize;
    const fetchSql = `
      SELECT 
        d.code, 
        d.name, 
        d.feeder_code, 
        d.capacity_kva, 
        d.created_at,
        COUNT(m.meter_id) AS meter_count
      FROM dts d
      LEFT JOIN meters m ON d.code = m.dt_code
      ${whereClause}
      GROUP BY d.code, d.name, d.feeder_code, d.capacity_kva, d.created_at
      ORDER BY d.code ASC
      LIMIT ? OFFSET ?
    `;

    const fetchStmt = this.db.prepare(fetchSql);
    const rows = fetchStmt.all(...params, pagination.pageSize, offset) as unknown as Array<{
      code: string;
      name: string;
      feeder_code: string;
      capacity_kva: number;
      created_at: string;
      meter_count: number;
    }>;

    const items: DtDto[] = rows.map((r) => ({
      code: r.code,
      name: r.name,
      feederCode: r.feeder_code,
      capacityKva: r.capacity_kva,
      meterCount: r.meter_count,
      createdAt: r.created_at,
    }));

    return { items, total };
  }

  public findByCode(code: string): DtWithMetersDto | null {
    const dtSql = `
      SELECT code, name, feeder_code, capacity_kva, created_at
      FROM dts
      WHERE code = ?
    `;
    const dtStmt = this.db.prepare(dtSql);
    const dtRow = dtStmt.get(code) as {
      code: string;
      name: string;
      feeder_code: string;
      capacity_kva: number;
      created_at: string;
    } | undefined;

    if (!dtRow) {
      return null;
    }

    const metersSql = `
      SELECT meter_id, serial_no, make, phase_type, install_status, install_type
      FROM meters
      WHERE dt_code = ?
      ORDER BY meter_id ASC
    `;
    const metersStmt = this.db.prepare(metersSql);
    const meterRows = metersStmt.all(code) as Array<{
      meter_id: string;
      serial_no: string;
      make: string;
      phase_type: string;
      install_status: string;
      install_type: string;
    }>;

    return {
      code: dtRow.code,
      name: dtRow.name,
      feederCode: dtRow.feeder_code,
      capacityKva: dtRow.capacity_kva,
      meterCount: meterRows.length,
      createdAt: dtRow.created_at,
      meters: meterRows.map((m) => ({
        meterId: m.meter_id,
        serialNo: m.serial_no,
        make: m.make,
        phaseType: m.phase_type,
        installStatus: m.install_status,
        installType: m.install_type,
      })),
    };
  }
}
