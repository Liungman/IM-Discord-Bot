import type { PrefixCommand } from '../../types/prefixCommand.js';
import { PermissionFlagsBits, ChannelType } from 'discord.js';

const command: PrefixCommand = {
  name: 'slowmode',
  description: 'Set slowmode on the current channel.',
  usage: '?slowmode <seconds>',
  category: 'moderation',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ManageChannels,
  async execute(message, args) {
    const seconds = parseInt(args[0] || '', 10);
    if (!Number.isFinite(seconds) || seconds < 0 || seconds > 21600) {
      await message.reply('Provide slowmode in seconds (0-21600).');
      return;
    }
    if (message.channel.type !== ChannelType.GuildText) return void message.reply('Use this in a text channel.');
    try {
      await (message.channel as any).setRateLimitPerUser(seconds);
      await message.reply(seconds === 0 ? 'Slowmode disabled.' : `Slowmode set to ${seconds}s.`);
    } catch {
      await message.reply('Failed to set slowmode.');
    }
  },
};

export default command;