import 'dotenv/config';
import { createClient } from './core/client.js';
import { logger } from './core/logger.js';
import { loadEnv } from './config/env.js';
import { loadEvents } from './core/eventLoader.js';
import { loadPrefixCommands } from './core/prefixCommandLoader.js';
import { initializeSpotify, shutdownSpotify } from './lib/SpotifyManager.js';

async function main() {
  loadEnv();
  const client = createClient();

  // Make client available globally for managers
  (globalThis as any).client = client;

  await loadPrefixCommands(client);
  await loadEvents(client);

  // Initialize Spotify integration if configured
  initializeSpotify();

  process.on('unhandledRejection', (reason) => {
    logger.error({ err: reason }, 'Unhandled promise rejection');
  });
  process.on('uncaughtException', (err) => {
    logger.error({ err }, 'Uncaught exception');
  });

  // Graceful shutdown
  const shutdown = () => {
    logger.info('Shutting down bot...');
    shutdownSpotify();
    client.destroy();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  await client.login(process.env.DISCORD_TOKEN!);
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start bot');
  process.exit(1);
});