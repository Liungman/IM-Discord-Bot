import type { PrefixCommand } from '../../types/prefixCommand.js';
import { PermissionFlagsBits, userMention } from 'discord.js';

const command: PrefixCommand = {
  name: 'unban',
  description: 'Unban a user by ID.',
  usage: '?unban <userId> [reason]',
  category: 'moderation',
  aliases: ['ub'],
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.BanMembers,
  async execute(message, args) {
    if (!message.guild) return;
    const id = args[0];
    if (!id) return void message.reply('Provide a user ID to unban.');
    const reason = args.slice(1).join(' ') || 'No reason provided';
    await message.guild.bans.remove(id, reason).catch(() => message.reply('Failed to unban. Check the ID and my permissions.'));
    await message.reply(`Unbanned ${userMention(id)}. Reason: ${reason}`);
  },
};

export default command;