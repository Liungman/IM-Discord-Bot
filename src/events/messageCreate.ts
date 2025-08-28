import type { EventModule } from '../types/event.js';
import { PermissionsBitField, inlineCode } from 'discord.js';
import { errorEmbed } from '../lib/embeds.js';

const PREFIX = '?';

function parseArgs(str: string): string[] {
  const m = str.match(/(?:\"[^\"]+\"|\S+)/g) ?? [];
  return m.map((a) => (a.startsWith('"') && a.endsWith('"') ? a.slice(1, -1) : a));
}

const mod: EventModule = {
  name: 'messageCreate',
  async execute(client, message) {
    if (message.author.bot || !message.content?.startsWith(PREFIX)) return;

    const content = message.content.slice(PREFIX.length).trim();
    const [rawName, ...rest] = content.split(/\s+/);
    const argStr = content.slice(rawName.length).trim();
    const name = rawName.toLowerCase();
    const args = parseArgs(argStr);

    const registry = (client as any).prefixCommands as Map<string, any>;
    const usage = (client as any).commandUsage as Map<string, number>;

    const cmd = registry.get(name);
    if (!cmd) return;

    // Usage tracking
    usage.set(name, (usage.get(name) ?? 0) + 1);

    // Guild-only check
    if (cmd.guildOnly && !message.guild) {
      await message.reply({ embeds: [errorEmbed('This command can only be used in a server.')] });
      return;
    }

    // Permission check
    if (cmd.requiredPermissions && message.guild) {
      const member = await message.guild.members.fetch(message.author.id).catch(() => null);
      if (!member || !member.permissions.has(new PermissionsBitField(cmd.requiredPermissions))) {
        await message.reply({ embeds: [errorEmbed('You do not have permission to use this command.')] });
        return;
      }
    }

    try {
      await cmd.execute(message, args, client);
    } catch (e) {
      await message.reply({ embeds: [errorEmbed(`Something went wrong executing ${inlineCode(name)}.`)] });
    }
  },
};

export default mod;