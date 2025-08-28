import type { PrefixCommand } from '../../types/prefixCommand.js';
import { PermissionFlagsBits, userMention } from 'discord.js';

const command: PrefixCommand = {
  name: 'ban',
  description: 'Ban a member. Usage: ?ban @user [del_days 0-7] [reason]',
  usage: '?ban @user [del_days 0-7] [reason]',
  category: 'moderation',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.BanMembers,
  async execute(message, args) {
    if (!message.guild) return;
    const user = message.mentions.users.first();
    if (!user) return void message.reply('Mention the user to ban.');
    const del = args[1] && /^\d+$/.test(args[1]) ? Math.min(7, Math.max(0, parseInt(args[1], 10))) : 0;
    const reasonStart = args[1] && /^\d+$/.test(args[1]) ? 2 : 1;
    const reason = args.slice(reasonStart).join(' ') || 'No reason provided';

    try {
      await message.guild.members.ban(user.id, { reason, deleteMessageSeconds: del * 86400 });
      await message.reply(`Banned ${userMention(user.id)}.`);
    } catch {
      await message.reply('Failed to ban the user. Check my permissions and role hierarchy.');
    }
  },
};

export default command;