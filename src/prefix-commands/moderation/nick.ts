import type { PrefixCommand } from '../../types/prefixCommand.js';
import { PermissionFlagsBits } from 'discord.js';

const command: PrefixCommand = {
  name: 'nick',
  description: 'Change a member nickname.',
  usage: '?nick @user <new nickname>',
  category: 'moderation',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ManageNicknames,
  async execute(message, args) {
    if (!message.guild) return;
    const member = message.mentions.members?.first() || (await message.guild.members.fetch(args[0]).catch(() => null));
    if (!member) return void message.reply('Mention a user or provide an ID.');
    const newNick = (member.id === message.author.id ? args.join(' ') : args.slice(1).join(' ')).trim();
    if (!newNick) return void message.reply('Provide the new nickname.');
    await member.setNickname(newNick).catch(() => message.reply('Failed to set nickname.'));
    await message.reply(`Nickname updated for ${member.user.tag}.`);
  },
};

export default command;