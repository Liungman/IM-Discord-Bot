import type { PrefixCommand } from '../../types/prefixCommand.js';
import { userMention } from 'discord.js';

const command: PrefixCommand = {
  name: 'userinfo',
  description: 'Show info about a user.',
  usage: '?userinfo [@user]',
  category: 'utility',
  guildOnly: true,
  async execute(message) {
    const user = message.mentions.users.first() || message.author;
    const member = await message.guild!.members.fetch(user.id).catch(() => null);
    const roles = member?.roles.cache
      .filter((r) => r.id !== message.guild!.id)
      .map((r) => r.toString())
      .slice(0, 20)
      .join(', ') || 'None';

    await message.reply(
      [
        `Tag: ${user.tag}`,
        `ID: ${user.id}`,
        `Mention: ${userMention(user.id)}`,
        `Created: <t:${Math.floor(user.createdTimestamp / 1000)}:R>`,
        member ? `Joined: <t:${Math.floor(member.joinedTimestamp! / 1000)}:R>` : '',
        `Roles: ${roles}`,
      ]
        .filter(Boolean)
        .join('\n'),
    );
  },
};

export default command;