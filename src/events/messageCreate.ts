import type { EventModule } from '../types/event.js';
import { PermissionsBitField, PermissionFlagsBits, inlineCode, TextChannel } from 'discord.js';
import { errorEmbed } from '../lib/embeds.js';
import { getGuildSettings } from '../storage/guildSettings.js';

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
      await message.reply({ embeds: [errorEmbed('This command can only be used in a server.')], allowedMentions: { repliedUser: false } });
      return;
    }

    // Permission check
    if (cmd.requiredPermissions && message.guild) {
      const member = await message.guild.members.fetch(message.author.id).catch(() => null);
      if (!member || !member.permissions.has(new PermissionsBitField(cmd.requiredPermissions))) {
        await message.reply({ embeds: [errorEmbed('You do not have permission to use this command.')], allowedMentions: { repliedUser: false } });
        return;
      }
    }

    // Auto-delete setup
    const settings = message.guild ? getGuildSettings(message.guild.id) : null;
    const autoDeleteMs = settings?.autoDeleteMs ?? 15000;

    // Delete the invoking command if possible
    if (message.guild && message.guild.members.me?.permissionsIn(message.channelId).has(PermissionFlagsBits.ManageMessages)) {
      message.delete().catch(() => {});
    }

    // Wrap reply and channel.send to auto-delete bot responses
    const origReply = message.reply.bind(message);
    (message as any).reply = async (...args: any[]) => {
      const sent = await origReply(...args);
      if (autoDeleteMs > 0) setTimeout(() => sent.delete().catch(() => {}), autoDeleteMs);
      return sent;
    };
    const ch = message.channel as TextChannel;
    if (ch && typeof ch.send === 'function') {
      const origSend = ch.send.bind(ch);
      (ch as any).send = async (...args: any[]) => {
        const sent = await origSend(...args);
        if (autoDeleteMs > 0) setTimeout(() => sent.delete().catch(() => {}), autoDeleteMs);
        return sent;
      };
    }

    try {
      await cmd.execute(message, args, client);
    } catch (e) {
      await message.reply({ embeds: [errorEmbed(`Something went wrong executing ${inlineCode(name)}.`)] });
    }
  },
};

export default mod;