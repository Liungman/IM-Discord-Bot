import type { PrefixCommand } from '../../types/prefixCommand.js';
import { PermissionFlagsBits, userMention } from 'discord.js';

function parseDuration(s: string): number | null {
  const m = /^(\d+)(s|m|h|d)$/i.exec(s);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  const mult = m[2].toLowerCase() === 's' ? 1000 : m[2].toLowerCase() === 'm' ? 60000 : m[2].toLowerCase() === 'h' ? 3600000 : 86400000;
  return n * mult;
}

const command: PrefixCommand = {
  name: 'timeout',
  description: 'Timeout a member for a duration, e.g., 10m, 2h, 1d.',
  usage: '?timeout @user <duration> [reason]',
  category: 'moderation',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ModerateMembers,
  async execute(message, args) {
    if (!message.guild) return;
    const member = message.mentions.members?.first() || (await message.guild.members.fetch(args[0]).catch(() => null));
    if (!member) return void message.reply('Mention a user or provide an ID.');
    const ms = parseDuration(args[1] || '');
    if (!ms) return void message.reply('Provide a valid duration like 10m, 2h, 1d.');
    const reason = args.slice(2).join(' ') || 'No reason provided';
    if (!member.moderatable) return void message.reply('I cannot timeout that member.');
    await member.timeout(ms, reason).catch(() => message.reply('Failed to apply timeout.'));
    await message.reply(`Timed out ${userMention(member.id)} for ${args[1]}. Reason: ${reason}`);
  },
};

export default command;