import type { PrefixCommand } from '../../types/prefixCommand.js';
import { PermissionFlagsBits, userMention } from 'discord.js';
import { clearWarns } from '../../storage/warns.js';

const command: PrefixCommand = {
  name: 'clearwarns',
  description: 'Clear all warnings for a member.',
  usage: '?clearwarns @user',
  category: 'moderation',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ModerateMembers,
  async execute(message) {
    if (!message.guild) return;
    const user = message.mentions.users.first();
    if (!user) return void message.reply('Mention a user.');
    const n = clearWarns(message.guild.id, user.id);
    await message.reply(`Cleared ${n} warning(s) for ${userMention(user.id)}.`);
  },
};

export default command;