import type { EventModule } from '../types/event.js';
import { PermissionsBitField, PermissionFlagsBits, inlineCode } from 'discord.js';
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
    const [rawName] = content.split(/\s+/);
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
      await message.reply({
        embeds: [errorEmbed('This command can only be used in a server.')],
        allowedMentions: { repliedUser: false },
        failIfNotExists: false,
      });
      return;
    }

    // Permission check
    if (cmd.requiredPermissions && message.guild) {
      const member = await message.guild.members.fetch(message.author.id).catch(() => null);
      if (!member || !member.permissions.has(new PermissionsBitField(cmd.requiredPermissions))) {
        await message.reply({
          embeds: [errorEmbed('You do not have permission to use this command.')],
          allowedMentions: { repliedUser: false },
          failIfNotExists: false,
        });
        return;
      }
    }

    // Auto-delete configuration
    const settings = message.guild ? getGuildSettings(message.guild.id) : null;
    const autoDeleteMs = settings?.autoDeleteMs ?? 15000;

    // Wrap message.reply to avoid reply-to-deleted-message and schedule deletion
    const origReply = message.reply.bind(message);
    (message as any).reply = async (options: any) => {
      const payload =
        typeof options === 'string'
          ? { content: options, failIfNotExists: false }
          : { failIfNotExists: false, ...options };
      const sent = await origReply(payload as any);
      if (autoDeleteMs > 0) setTimeout(() => sent.delete().catch(() => {}), autoDeleteMs);
      return sent;
    };

    // Schedule deletion of the invoking message (after giving time for the bot to respond)
    const canDeleteInvoker =
      message.guild?.members.me?.permissionsIn(message.channelId).has(PermissionFlagsBits.ManageMessages) ?? false;
    if (canDeleteInvoker && autoDeleteMs > 0) {
      setTimeout(() => message.delete().catch(() => {}), autoDeleteMs);
    }

    try {
      await cmd.execute(message, args, client);
    } catch (e) {
      await message.reply({
        embeds: [errorEmbed(`Something went wrong executing ${inlineCode(name)}.`)],
        failIfNotExists: false,
      });
    }
  },
};

export default mod;