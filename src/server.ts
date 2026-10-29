import { buildApp } from './app.js';
import { env } from './config/env.js';
import { seedDatabase } from './db/seeder.js';
import { closeDb } from './db/connection.js';

async function startServer(): Promise<void> {
  try {
    const seedResult = seedDatabase();
    console.log(
      `[db] ready: ${seedResult.dtsCount} dts, ${seedResult.metersCount} meters, operator ${
        seedResult.userCreated ? 'created' : 'verified'
      }`
    );

    const app = buildApp();
    await app.listen({ port: env.PORT, host: env.HOST });

    console.log(`Server listening on http://${env.HOST}:${env.PORT}`);
    console.log(`Docs available at http://${env.HOST}:${env.PORT}/docs`);

    const signals = ['SIGINT', 'SIGTERM'] as const;
    for (const signal of signals) {
      process.on(signal, async () => {
        try {
          await app.close();
          closeDb();
          process.exit(0);
        } catch (err) {
          console.error('Error during shutdown:', err);
          process.exit(1);
        }
      });
    }
  } catch (err) {
    console.error('Fatal error starting server:', err);
    process.exit(1);
  }
}

startServer();
