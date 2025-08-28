import type { PrefixCommand } from '../../types/prefixCommand.js';
import { getNamespace, setNamespace } from '../../storage/kv.js';

type AfkDB = Record<string, { reason: string; since: number; mentions: Array<{ by: string; at: number; content: string }> }>;

const command: PrefixCommand = {
  name: 'afk',
  description: 'Set an AFK status for when you are mentioned.',
  usage: '?afk <status>',
  category: 'afk',
  guildOnly: true,
  async execute(message, args) {
    const reason = args.join(' ').trim() || 'AFK';
    const key = `afk:${message.guildId}`;
    const db = getNamespace<AfkDB>(key);
    db[message.author.id] = { reason, since: Date.now(), mentions: [] };
    setNamespace(key, db);
    await message.reply(`AFK set: ${reason}`);
  },
};

export default command;