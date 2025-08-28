import type { PrefixCommand } from '../../types/prefixCommand.js';
import { PermissionFlagsBits, userMention } from 'discord.js';

const command: PrefixCommand = {
  name: 'ban',
  description: 'Ban a member and optionally delete recent messages (0-7 days).',
  usage: '?ban @user [days] [reason]',
  category: 'moderation',
  aliases: ['b'],
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.BanMembers,
  async execute(message, args) {
    if (!message.guild) return;
    const member = message.mentions.members?.first() || (await message.guild.members.fetch(args[0]).catch(() => null));
    if (!member) return void message.reply('Mention a user or provide an ID.');
    const days = /^\d+$/.test(args[1] || '') ? Math.min(7, Math.max(0, parseInt(args[1], 10))) : 0;
    const reason = (days ? args.slice(2) : args.slice(1)).join(' ') || 'No reason provided';
    if (!member.bannable) return void message.reply('I cannot ban that member.');
    await member.ban({ deleteMessageDays: days as any, reason }).catch(() => {});
    await message.reply(`Banned ${userMention(member.id)}. ${days ? `Deleted ${days} day(s) of messages. ` : ''}Reason: ${reason}`);
  },
};

export default command;