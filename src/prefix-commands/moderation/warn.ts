import type { PrefixCommand } from '../../types/prefixCommand.js';
import { PermissionFlagsBits, userMention } from 'discord.js';
import { addWarn } from '../../storage/warns.js';

const command: PrefixCommand = {
  name: 'warn',
  description: 'Warn a member (stored).',
  usage: '?warn @user [reason]',
  category: 'moderation',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ModerateMembers,
  async execute(message, args) {
    if (!message.guild) return;
    const member = message.mentions.members?.first() || (await message.guild.members.fetch(args[0]).catch(() => null));
    if (!member) return void message.reply('Mention a user or provide an ID.');
    const reason = (member.id === args[0] ? args.slice(1) : args.slice(1)).join(' ') || 'No reason provided';
    addWarn(message.guild.id, member.id, { by: message.author.tag, reason, at: Date.now() });
    await message.reply(`Warned ${userMention(member.id)}. Reason: ${reason}`);
  },
};

export default command;