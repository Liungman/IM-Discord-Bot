import type { PrefixCommand } from '../../types/prefixCommand.js';

const command: PrefixCommand = {
  name: 'serverinfo',
  description: 'Show server info.',
  usage: '?serverinfo',
  category: 'utility',
  guildOnly: true,
  async execute(message) {
    const g = message.guild!;
    await message.reply(
      [
        `Name: ${g.name}`,
        `ID: ${g.id}`,
        `Owner: <@${g.ownerId}>`,
        `Members: ${g.memberCount}`,
        `Created: <t:${Math.floor(g.createdTimestamp / 1000)}:R>`,
        `Boosts: ${g.premiumSubscriptionCount ?? 0}`,
      ].join('\n'),
    );
  },
};

export default command;