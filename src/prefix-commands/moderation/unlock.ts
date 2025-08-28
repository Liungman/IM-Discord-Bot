import type { PrefixCommand } from '../../types/prefixCommand.js';
import { PermissionFlagsBits, ChannelType } from 'discord.js';

const command: PrefixCommand = {
  name: 'unlock',
  description: 'Unlock the current text channel.',
  usage: '?unlock [reason]',
  category: 'moderation',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ManageChannels,
  async execute(message, args) {
    const reason = args.join(' ') || 'Channel unlocked';
    const ch = message.channel;
    if (ch.type !== ChannelType.GuildText && ch.type !== ChannelType.GuildForum && ch.type !== ChannelType.GuildAnnouncement) {
      await message.reply('This command can only be used in text-based guild channels.');
      return;
    }
    try {
      await (ch as any).permissionOverwrites.edit(message.guild!.roles.everyone, { SendMessages: null }, { reason });
      await message.reply('Channel unlocked.');
    } catch {
      await message.reply('Failed to unlock channel.');
    }
  },
};

export default command;