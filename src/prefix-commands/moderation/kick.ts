import type { PrefixCommand } from '../../types/prefixCommand.js';
import { PermissionFlagsBits, userMention } from 'discord.js';

const command: PrefixCommand = {
  name: 'kick',
  description: 'Kick a member.',
  usage: '?kick @user [reason]',
  category: 'moderation',
  aliases: ['k'],
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.KickMembers,
  async execute(message, args) {
    if (!message.guild) return;
    const member = message.mentions.members?.first() || (await message.guild.members.fetch(args[0]).catch(() => null));
    if (!member) return void message.reply('Mention a user or provide an ID.');
    const reason = args.slice(1).join(' ') || 'No reason provided';
    if (!member.kickable) return void message.reply('I cannot kick that member.');
    await member.kick(reason).catch(() => {});
    await message.reply(`Kicked ${userMention(member.id)}. Reason: ${reason}`);
  },
};

export default command;