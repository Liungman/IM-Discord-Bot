import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js';
import type { PrefixCommand } from '../types/prefixCommand.js';
import { logger } from './logger.js';

export function createClient() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildEmojisAndStickers,
      GatewayIntentBits.MessageContent, // Required for prefix commands
    ],
    partials: [Partials.GuildMember, Partials.User, Partials.Message, Partials.Channel],
  }) as Client & {
    prefixCommands: Collection<string, PrefixCommand>;
    commandUsage: Collection<string, number>;
  };

  (client as any).prefixCommands = new Collection<string, PrefixCommand>();
  (client as any).commandUsage = new Collection<string, number>();

  client.once('ready', () => {
    logger.info({ tag: client.user?.tag, id: client.user?.id }, 'Bot logged in');
  });

  return client;
}