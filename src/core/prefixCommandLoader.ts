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
    
    // Support both single command and array of commands
    const commands: PrefixCommand[] = [];
    
    // Check for default export (single command or array)
    const defaultExport = mod.default;
    if (Array.isArray(defaultExport)) {
      commands.push(...defaultExport);
    } else if (defaultExport?.name && defaultExport?.execute) {
      commands.push(defaultExport);
    }
    
    // Check for named export 'commands' (array)
    if (mod.commands && Array.isArray(mod.commands)) {
      commands.push(...mod.commands);
    }
    
    // Legacy fallback for 'command' export
    if (mod.command?.name && mod.command?.execute) {
      commands.push(mod.command);
    }
    
    if (commands.length === 0) {
      logger.warn({ file }, 'Skipping invalid prefix command module - no valid commands found');
      continue;
    }
    
    // Register all commands from this module
    for (const command of commands) {
      if (!command?.name || !command?.execute) {
        logger.warn({ file, commandName: command?.name }, 'Skipping invalid command in module');
        continue;
      }
      
      // Register the primary command name
      client.prefixCommands.set(command.name.toLowerCase(), command);
      loaded++;
      
      // Register aliases if they exist
      if (command.aliases && Array.isArray(command.aliases)) {
        for (const alias of command.aliases) {
          if (alias && typeof alias === 'string') {
            client.prefixCommands.set(alias.toLowerCase(), command);
          }
        }
      }
    }
  }
  logger.info({ count: loaded }, 'Prefix commands loaded');
}