import type { PrefixCommand } from '../../types/prefixCommand.js';
import { userMention } from 'discord.js';

function formatBytes(bytes: number) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(1)} ${units[i]}`;
}

const command: PrefixCommand = {
  name: 'botstatus',
  description: 'Show bot status: uptime, ping, memory, guilds.',
  usage: '?botstatus',
  category: 'utility',
  async execute(message, _args, client) {
    const uptimeMs = client.uptime ?? 0;
    const ping = Math.round(client.ws.ping);
    const guilds = client.guilds.cache.size;
    const mem = process.memoryUsage();

    const lines = [
      `Uptime: <t:${Math.floor((Date.now() - uptimeMs) / 1000)}:R>`,
      `Ping: ${ping}ms`,
      `Guilds: ${guilds}`,
      `Memory: RSS ${formatBytes(mem.rss)} • Heap ${formatBytes(mem.heapUsed)}/${formatBytes(mem.heapTotal)}`,
    ];
    await message.reply(lines.join('\n'));
  },
};

export default command;