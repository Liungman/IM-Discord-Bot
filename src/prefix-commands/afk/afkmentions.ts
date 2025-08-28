import type { PrefixCommand } from '../../types/prefixCommand.js';
import { getNamespace } from '../../storage/kv.js';

type AfkDB = Record<string, { reason: string; since: number; mentions: Array<{ by: string; at: number; content: string }> }>;

const command: PrefixCommand = {
  name: 'afkmentions',
  description: 'Show mentions you received while AFK.',
  usage: '?afkmentions',
  category: 'afk',
  guildOnly: true,
  async execute(message) {
    const key = `afk:${message.guildId}`;
    const db = getNamespace<AfkDB>(key);
    const me = db[message.author.id];
    if (!me) return void message.reply('You are not AFK.');
    if (!me.mentions.length) return void message.reply('No mentions recorded while AFK.');
    const lines = me.mentions.slice(-10).map((m) => `• ${m.by} at <t:${Math.floor(m.at / 1000)}:R>: ${m.content}`);
    await message.reply(lines.join('\n'));
  },
};

export default command;