import fg from 'fast-glob';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'node:path';
import type { Client } from 'discord.js';
import { logger } from './logger.js';
import type { PrefixCommand } from '../types/prefixCommand.js';

function rootDir() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '..');
}

export async function loadPrefixCommands(client: Client & { prefixCommands: Map<string, PrefixCommand> }) {
  const base = rootDir();
  const dir = path.join(base, 'prefix-commands');
  const pattern = `${dir.replace(/\\/g, '/')}/**/*.{ts,js}`;
  const files = await fg(pattern, { ignore: ['**/*.d.ts', '**/*.map'], absolute: true });

  client.prefixCommands.clear();
  let loaded = 0;
  for (const file of files) {
    const mod = await import(pathToFileURL(file).href);
    const command: PrefixCommand | undefined = mod.default || mod.command;
    if (!command?.name || !command?.execute) {
      logger.warn({ file }, 'Skipping invalid prefix command module');
      continue;
    }
    client.prefixCommands.set(command.name.toLowerCase(), command);
    loaded++;
  }
  logger.info({ count: loaded }, 'Prefix commands loaded');
}