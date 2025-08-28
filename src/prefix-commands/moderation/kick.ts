import type { PrefixCommand } from '../../types/prefixCommand.js';
import { PermissionFlagsBits, userMention } from 'discord.js';

const command: PrefixCommand = {
  name: 'kick',
  description: 'Kick a member. Usage: ?kick @user [reason]',
  usage: '?kick @user [reason]',
  category: 'moderation',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.KickMembers,
  async execute(message, args) {
    if (!message.guild) return;
    const user = message.mentions.users.first();
    const reason = args.slice(user ? 1 : 0).join(' ') || 'No reason provided';
    if (!user) return void message.reply('Mention the user to kick.');
    const member = await message.guild.members.fetch(user.id).catch(() => null);
    if (!member) return void message.reply('User is not in this server.');

    try {
      await member.kick(reason);
      await message.reply(`Kicked ${userMention(user.id)}.`);
    } catch {
      await message.reply('Failed to kick the user. Check my permissions and role hierarchy.');
    }
  },
};

export default command;