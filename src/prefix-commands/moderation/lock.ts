import type { PrefixCommand } from '../../types/prefixCommand.js';
import { PermissionFlagsBits, ChannelType } from 'discord.js';

const command: PrefixCommand = {
  name: 'lock',
  description: 'Lock the current text channel (prevent @everyone from sending messages).',
  usage: '?lock [reason]',
  category: 'moderation',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ManageChannels,
  async execute(message, args) {
    const reason = args.join(' ') || 'Channel locked';
    const ch = message.channel;
    if (ch.type !== ChannelType.GuildText && ch.type !== ChannelType.GuildForum && ch.type !== ChannelType.GuildAnnouncement) {
      await message.reply('This command can only be used in text-based guild channels.');
      return;
    }
    try {
      await (ch as any).permissionOverwrites.edit(message.guild!.roles.everyone, { SendMessages: false }, { reason });
      await message.reply('Channel locked.');
    } catch {
      await message.reply('Failed to lock channel.');
    }
  },
};

export default command;