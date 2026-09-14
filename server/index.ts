import 'dotenv/config';
import { readConfig } from './config';
import { createServer } from './app';
const config = readConfig();
const app = await createServer(config);
await app.listen({ host: config.host, port: config.port });
console.log(`NightWise API listening on port ${config.port}. Live routes ${config.serverKey ? 'configured' : 'not configured'}.`);
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, () => { void app.close().then(() => process.exit(0)); });
