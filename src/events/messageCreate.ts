import type { EventModule } from '../types/event.js';
import { PermissionsBitField, PermissionFlagsBits, inlineCode } from 'discord.js';
import { errorEmbed } from '../lib/embeds.js';
import { getGuildSettings } from '../storage/guildSettings.js';
import { getDefaultGradientBanner } from '../lib/gradient.js';

function parseArgs(str: string): string[] {
  const m = str.match(/(?:\"[^\"]+\"|\S+)/g) ?? [];
  return m.map((a) => (a.startsWith('"') && a.endsWith('"') ? a.slice(1, -1) : a));
}

const mod: EventModule = {
  name: 'messageCreate',
  async execute(client, message) {
    if (message.author.bot) return;

    // Get dynamic prefix from guild settings
    const settings = message.guild ? getGuildSettings(message.guild.id) : null;
    const prefix = settings?.prefix ?? '?';
    
    if (!message.content?.startsWith(prefix)) return;

    const content = message.content.slice(prefix.length).trim();
    if (!content) return;

    const tokens = content.split(/\s+/);
    const registry = (client as any).prefixCommands as Map<string, any>;
    const usage = (client as any).commandUsage as Map<string, number>;

    // Try multi-word command names: 3-word, 2-word, then 1-word
    let cmd: any = null;
    let commandName = '';
    let argStartIndex = 0;

    // Try 3-word command first
    if (tokens.length >= 3) {
      const threeWord = tokens.slice(0, 3).join(' ').toLowerCase();
      if (registry.has(threeWord)) {
        cmd = registry.get(threeWord);
        commandName = threeWord;
        argStartIndex = 3;
      }
    }

    // Try 2-word command if 3-word failed
    if (!cmd && tokens.length >= 2) {
      const twoWord = tokens.slice(0, 2).join(' ').toLowerCase();
      if (registry.has(twoWord)) {
        cmd = registry.get(twoWord);
        commandName = twoWord;
        argStartIndex = 2;
      }
    }

    // Try 1-word command if 2-word failed
    if (!cmd) {
      const oneWord = tokens[0].toLowerCase();
      if (registry.has(oneWord)) {
        cmd = registry.get(oneWord);
        commandName = oneWord;
        argStartIndex = 1;
      }
    }

    if (!cmd) return;

    // Parse arguments starting after the command name
    const argStr = tokens.slice(argStartIndex).join(' ');
    const args = parseArgs(argStr);

    // Usage tracking
    usage.set(commandName, (usage.get(commandName) ?? 0) + 1);

    // Instantly delete the invoking message to avoid reply errors
    const canDeleteInvoker =
      message.guild?.members.me?.permissionsIn(message.channelId).has(PermissionFlagsBits.ManageMessages) ?? false;
    if (canDeleteInvoker) {
      message.delete().catch(() => {}); // Delete immediately, don't wait
    }

    // Guild-only check
    if (cmd.guildOnly && !message.guild) {
      if (message.channel?.type !== 'DM' && 'send' in message.channel) {
        await message.channel.send({
          embeds: [errorEmbed('This command can only be used in a server.')],
          allowedMentions: { repliedUser: false },
        });
      }
      return;
    }

    // Permission check
    if (cmd.requiredPermissions && message.guild) {
      const member = await message.guild.members.fetch(message.author.id).catch(() => null);
      if (!member || !member.permissions.has(new PermissionsBitField(cmd.requiredPermissions))) {
        if (message.channel?.type !== 'DM' && 'send' in message.channel) {
          await message.channel.send({
            embeds: [errorEmbed('You do not have permission to use this command.')],
            allowedMentions: { repliedUser: false },
          });
        }
        return;
      }
    }

    // Auto-delete configuration for responses
    const autoDeleteMs = settings?.autoDeleteMs ?? 15000;

    // Replace message.reply with channel.send to avoid MESSAGE_REFERENCE_UNKNOWN_MESSAGE
    (message as any).reply = async (options: any) => {
      if (!message.channel || !('send' in message.channel)) return;
      
      const payload =
        typeof options === 'string'
          ? { content: options, allowedMentions: { repliedUser: false } }
          : { allowedMentions: { repliedUser: false }, ...options };
      
      // Auto-inject gradient banner into embeds if no image is set
      if (payload.embeds && Array.isArray(payload.embeds)) {
        const gradientBanner = getDefaultGradientBanner();
        if (gradientBanner) {
          // Check if any embed lacks an image and inject gradient
          let hasEmbedWithoutImage = false;
          for (const embed of payload.embeds) {
            if (embed && typeof embed === 'object' && !embed.image && !embed.thumbnail) {
              embed.image = { url: 'attachment://gradient.png' };
              hasEmbedWithoutImage = true;
            }
          }
          
          // Only attach the gradient if we actually used it
          if (hasEmbedWithoutImage) {
            payload.files = payload.files || [];
            if (Array.isArray(payload.files)) {
              payload.files.push(gradientBanner);
            }
          }
        }
      }
      
      const sent = await message.channel.send(payload as any);
      if (autoDeleteMs > 0) {
        setTimeout(() => sent.delete().catch(() => {}), autoDeleteMs);
      }
      return sent;
    };

    try {
      await cmd.execute(message, args, client);
    } catch (e) {
      if (message.channel && 'send' in message.channel) {
        await message.channel.send({
          embeds: [errorEmbed(`Something went wrong executing ${inlineCode(commandName)}.`)],
          allowedMentions: { repliedUser: false },
        });
      }
    }
  },
};

export default mod;