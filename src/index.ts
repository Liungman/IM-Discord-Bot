import 'dotenv/config';
import { createClient } from './core/client.js';
import { logger } from './core/logger.js';
import { loadEnv } from './config/env.js';
import { loadEvents } from './core/eventLoader.js';
import { loadPrefixCommands } from './core/prefixCommandLoader.js';

async function main() {
  loadEnv();
  const client = createClient();

  await loadPrefixCommands(client);
  await loadEvents(client);

  process.on('unhandledRejection', (reason) => {
    logger.error({ err: reason }, 'Unhandled promise rejection');
  });
  process.on('uncaughtException', (err) => {
    logger.error({ err }, 'Uncaught exception');
  });

  await client.login(process.env.DISCORD_TOKEN!);
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start bot');
  process.exit(1);
});