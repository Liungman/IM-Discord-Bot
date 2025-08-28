import fg from 'fast-glob';
import path from 'node:path';
import { pathToFileURL } from 'url';
import { fileURLToPath } from 'url';
import type { Client } from 'discord.js';
import type { EventModule } from '../types/event.js';
import { logger } from './logger.js';

function rootDir() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '..');
}

export async function loadEvents(client: Client) {
  const base = rootDir();
  const dir = path.join(base, 'events');
  const pattern = `${dir.replace(/\\/g, '/')}/**/*.{ts,js}`;
  const files = await fg(pattern, { ignore: ['**/*.d.ts', '**/*.map'], absolute: true });

  for (const file of files) {
    const mod = (await import(pathToFileURL(file).href)) as { default?: EventModule };
    const evt = mod.default;
    if (!evt) continue;
    if (evt.once) client.once(evt.name, (...args) => evt.execute(client, ...args));
    else client.on(evt.name, (...args) => evt.execute(client, ...args));
  }

  logger.info({ count: files.length }, 'Events loaded');
}