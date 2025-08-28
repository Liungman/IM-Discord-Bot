import type { EventModule } from '../types/event.js';
import { getNamespace, setNamespace } from '../storage/kv.js';

type AfkDB = Record<string, { reason: string; since: number; mentions: Array<{ by: string; at: number; content: string }> }>;

const mod: EventModule = {
  name: 'messageCreate',
  async execute(_client, message) {
    if (!message.guild || message.author.bot) return;

    const key = `afk:${message.guildId}`;
    const db = getNamespace<AfkDB>(key);

    // If the AFK user sends a message, remove AFK
    if (db[message.author.id]) {
      delete db[message.author.id];
      setNamespace(key, db);
      await message.reply('Welcome back! AFK status removed.');
      return;
    }

    // If message mentions someone AFK, notify and record
    if (message.mentions.users.size) {
      for (const [, user] of message.mentions.users) {
        const entry = db[user.id];
        if (entry) {
          try {
            await message.reply(`${user.tag} is AFK: ${entry.reason} — since <t:${Math.floor(entry.since / 1000)}:R>`);
          } catch {}
          entry.mentions.push({
            by: message.author.tag,
            at: Date.now(),
            content: message.content.slice(0, 200),
          });
          setNamespace(key, db);
        }
      }
    }
  },
};

export default mod;