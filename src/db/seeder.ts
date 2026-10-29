import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { getDb, initDbSchema } from './connection.js';
import { env } from '../config/env.js';
import { hashPassword } from '../common/crypto.js';

interface RawDt {
  code: string;
  name: string;
  feederCode: string;
  capacityKva: number;
}

interface RawMeter {
  meterId: string;
  serialNo: string;
  make: string;
  phaseType: string;
  installStatus: string;
  installType: string;
  build: string;
  dtCode: string;
  hierarchy: {
    zone?: { name: string; code: string };
    circle?: { name: string; code: string };
    division?: { name: string; code: string };
    subdivision?: { name: string; code: string };
    substation?: { name: string; code: string };
    feeder?: { name: string; code: string };
    dt?: { name: string; code: string };
  };
  geo?: {
    lat: number;
    lng: number;
  };
}

export function seedDatabase(): { dtsCount: number; metersCount: number; userCreated: boolean } {
  initDbSchema();
  const db = getDb();

  let userCreated = false;
  const userCheckStmt = db.prepare('SELECT id FROM users WHERE email = ?');
  const existingUser = userCheckStmt.get(env.DEFAULT_OPERATOR_EMAIL);

  if (!existingUser) {
    const { salt, hash } = hashPassword(env.DEFAULT_OPERATOR_PASSWORD);
    const userId = crypto.randomUUID();
    const insertUserStmt = db.prepare(
      'INSERT INTO users (id, email, password_hash, salt, role) VALUES (?, ?, ?, ?, ?)'
    );
    insertUserStmt.run(userId, env.DEFAULT_OPERATOR_EMAIL, hash, salt, 'operator');
    userCreated = true;
  }

  const dtCountStmt = db.prepare('SELECT COUNT(*) as count FROM dts');
  const dtCountResult = dtCountStmt.get() as { count: number };
  let dtsCount = dtCountResult.count;

  if (dtsCount === 0) {
    const dtsFilePath = path.resolve(process.cwd(), 'data', 'dts-export.json');
    if (fs.existsSync(dtsFilePath)) {
      const rawDts: RawDt[] = JSON.parse(fs.readFileSync(dtsFilePath, 'utf-8'));
      const insertDtStmt = db.prepare(
        'INSERT OR REPLACE INTO dts (code, name, feeder_code, capacity_kva) VALUES (?, ?, ?, ?)'
      );

      db.exec('BEGIN TRANSACTION;');
      try {
        for (const dt of rawDts) {
          insertDtStmt.run(dt.code, dt.name, dt.feederCode, dt.capacityKva);
        }
        db.exec('COMMIT;');
        dtsCount = rawDts.length;
      } catch (err) {
        db.exec('ROLLBACK;');
        throw err;
      }
    }
  }

  const meterCountStmt = db.prepare('SELECT COUNT(*) as count FROM meters');
  const meterCountResult = meterCountStmt.get() as { count: number };
  let metersCount = meterCountResult.count;

  if (metersCount === 0) {
    const metersFilePath = path.resolve(process.cwd(), 'data', 'meter-export.json');
    if (fs.existsSync(metersFilePath)) {
      const rawMeters: RawMeter[] = JSON.parse(fs.readFileSync(metersFilePath, 'utf-8'));
      const insertMeterStmt = db.prepare(`
        INSERT OR REPLACE INTO meters (
          meter_id, serial_no, make, phase_type, install_status, install_type, build,
          dt_code, zone_name, zone_code, circle_name, circle_code, division_name,
          division_code, subdivision_name, subdivision_code, substation_name,
          substation_code, feeder_name, feeder_code, lat, lng, hierarchy_json
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?
        )
      `);

      db.exec('BEGIN TRANSACTION;');
      try {
        for (const m of rawMeters) {
          insertMeterStmt.run(
            m.meterId,
            m.serialNo,
            m.make,
            m.phaseType,
            m.installStatus,
            m.installType,
            m.build,
            m.dtCode,
            m.hierarchy?.zone?.name ?? null,
            m.hierarchy?.zone?.code ?? null,
            m.hierarchy?.circle?.name ?? null,
            m.hierarchy?.circle?.code ?? null,
            m.hierarchy?.division?.name ?? null,
            m.hierarchy?.division?.code ?? null,
            m.hierarchy?.subdivision?.name ?? null,
            m.hierarchy?.subdivision?.code ?? null,
            m.hierarchy?.substation?.name ?? null,
            m.hierarchy?.substation?.code ?? null,
            m.hierarchy?.feeder?.name ?? null,
            m.hierarchy?.feeder?.code ?? null,
            m.geo?.lat ?? null,
            m.geo?.lng ?? null,
            JSON.stringify(m.hierarchy)
          );
        }
        db.exec('COMMIT;');
        metersCount = rawMeters.length;
      } catch (err) {
        db.exec('ROLLBACK;');
        throw err;
      }
    }
  }

  return { dtsCount, metersCount, userCreated };
}

if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('seeder.ts')) {
  try {
    const res = seedDatabase();
    console.log(`Seeded ${res.dtsCount} DTs and ${res.metersCount} meters. User: ${res.userCreated ? 'created' : 'ready'}`);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}
