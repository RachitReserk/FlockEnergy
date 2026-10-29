-- Enable Foreign Keys and Pragmas
PRAGMA foreign_keys = ON;

-- Distribution Transformers Table
CREATE TABLE IF NOT EXISTS dts (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    feeder_code TEXT NOT NULL,
    capacity_kva REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dts_feeder_code ON dts(feeder_code);
CREATE INDEX IF NOT EXISTS idx_dts_capacity_kva ON dts(capacity_kva);

-- Urja Meters Table
CREATE TABLE IF NOT EXISTS meters (
    meter_id TEXT PRIMARY KEY,
    serial_no TEXT NOT NULL UNIQUE,
    make TEXT NOT NULL,
    phase_type TEXT NOT NULL,
    install_status TEXT NOT NULL,
    install_type TEXT NOT NULL,
    build TEXT NOT NULL,
    dt_code TEXT NOT NULL,
    zone_name TEXT,
    zone_code TEXT,
    circle_name TEXT,
    circle_code TEXT,
    division_name TEXT,
    division_code TEXT,
    subdivision_name TEXT,
    subdivision_code TEXT,
    substation_name TEXT,
    substation_code TEXT,
    feeder_name TEXT,
    feeder_code TEXT,
    lat REAL,
    lng REAL,
    hierarchy_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dt_code) REFERENCES dts(code) ON DELETE RESTRICT
);

-- Compound and Specific Indexes for Filter Queries
CREATE INDEX IF NOT EXISTS idx_meters_serial_no ON meters(serial_no);
CREATE INDEX IF NOT EXISTS idx_meters_dt_code ON meters(dt_code);
CREATE INDEX IF NOT EXISTS idx_meters_make ON meters(make);
CREATE INDEX IF NOT EXISTS idx_meters_phase_type ON meters(phase_type);
CREATE INDEX IF NOT EXISTS idx_meters_install_status ON meters(install_status);
CREATE INDEX IF NOT EXISTS idx_meters_install_type ON meters(install_type);
CREATE INDEX IF NOT EXISTS idx_meters_build ON meters(build);
CREATE INDEX IF NOT EXISTS idx_meters_feeder_code ON meters(feeder_code);
CREATE INDEX IF NOT EXISTS idx_meters_zone_code ON meters(zone_code);
CREATE INDEX IF NOT EXISTS idx_meters_substation_code ON meters(substation_code);

-- Users / Operator Table for Auth
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'operator',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
