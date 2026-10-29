import fs from 'node:fs';
import path from 'node:path';
import { buildApp } from '../src/app.js';
import { seedDatabase } from '../src/db/seeder.js';
import { closeDb } from '../src/db/connection.js';

async function exportOpenApi(): Promise<void> {
  try {
    seedDatabase();
    const app = buildApp({ logger: false });
    await app.ready();

    const openapiSpec = app.swagger();
    const outputPath = path.resolve(process.cwd(), 'openapi.json');

    fs.writeFileSync(outputPath, JSON.stringify(openapiSpec, null, 2), 'utf-8');
    console.log(`OpenAPI specification written to: ${outputPath}`);

    await app.close();
    closeDb();
    process.exit(0);
  } catch (err) {
    console.error('Failed to export OpenAPI specification:', err);
    process.exit(1);
  }
}

exportOpenApi();
