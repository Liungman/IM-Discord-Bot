import type { PrefixCommand } from '../../types/prefixCommand.js';
import { PermissionFlagsBits } from 'discord.js';

const command: PrefixCommand = {
  name: 'nick',
  description: 'Change a user’s nickname.',
  usage: '?nick @user <new nickname>',
  category: 'moderation',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ManageNicknames,
  async execute(message, args) {
    if (!message.guild) return;
    const user = message.mentions.users.first();
    if (!user) return void message.reply('Mention a user to rename.');
    const newNick = args.slice(1).join(' ').trim();
    if (!newNick) return void message.reply('Provide a new nickname.');
    const member = await message.guild.members.fetch(user.id).catch(() => null);
    if (!member) return void message.reply('User not found in this server.');
    try {
      await member.setNickname(newNick);
      await message.reply('Nickname updated.');
    } catch {
      await message.reply('Failed to update nickname (check role hierarchy & permissions).');
    }
  },
};

export default command;