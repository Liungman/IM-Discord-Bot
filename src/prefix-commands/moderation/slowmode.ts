import type { PrefixCommand } from '../../types/prefixCommand.js';
import { PermissionFlagsBits, ChannelType, TextChannel } from 'discord.js';

const command: PrefixCommand = {
  name: 'slowmode',
  description: 'Set slowmode in the current channel (seconds, 0 to disable).',
  usage: '?slowmode <seconds>',
  category: 'moderation',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ManageChannels,
  async execute(message, args) {
    const ch = message.channel as TextChannel;
    if (ch.type !== ChannelType.GuildText) return void message.reply('Use this in a text channel.');
    const seconds = parseInt(args[0] || '', 10);
    if (Number.isNaN(seconds) || seconds < 0 || seconds > 21600) return void message.reply('Provide seconds between 0 and 21600.');
    await ch.setRateLimitPerUser(seconds).catch(() => message.reply('Failed to set slowmode.'));
    await message.reply(seconds ? `Slowmode set to ${seconds}s.` : 'Slowmode disabled.');
  },
};

export default command;