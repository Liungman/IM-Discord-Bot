import type { PrefixCommand } from '../../types/prefixCommand.js';
import { PermissionFlagsBits, userMention } from 'discord.js';

function parseDuration(input: string): number | null {
  const units: Record<string, number> = { s: 1e3, m: 60e3, h: 3600e3, d: 86400e3 };
  const re = /(\d+)\s*([smhd])/gi;
  let total = 0;
  let m: RegExpExecArray | null;
  let matched = false;
  while ((m = re.exec(input))) {
    matched = true;
    total += parseInt(m[1], 10) * (units[m[2].toLowerCase()] ?? 0);
  }
  return matched && total > 0 ? total : null;
}

const command: PrefixCommand = {
  name: 'timeout',
  description: 'Timeout a member. Usage: ?timeout @user <10m|2h|1d> [reason]',
  usage: '?timeout @user <duration> [reason]',
  category: 'moderation',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ModerateMembers,
  async execute(message, args) {
    if (!message.guild) return;
    const user = message.mentions.users.first();
    if (!user) return void message.reply('Mention the user to timeout.');
    const durationArgIndex = user ? 1 : 0;
    const durStr = args[durationArgIndex];
    const reason = args.slice(durationArgIndex + 1).join(' ') || 'No reason provided';
    const ms = parseDuration(durStr || '');
    if (!ms || ms < 5000 || ms > 28 * 86400e3) return void message.reply('Invalid duration. Try 10m, 2h, 1d.');

    const member = await message.guild.members.fetch(user.id).catch(() => null);
    if (!member) return void message.reply('User is not in this server.');

    try {
      await member.timeout(ms, reason);
      await message.reply(`Timed out ${userMention(user.id)} for ${durStr}.`);
    } catch {
      await message.reply('Failed to timeout the user. Check my permissions and role hierarchy.');
    }
  },
};

export default command;