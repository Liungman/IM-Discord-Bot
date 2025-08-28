import type { PrefixCommand } from '../../types/prefixCommand.js';
const command: PrefixCommand = {
  name: 'avatar',
  description: 'Show avatar of a user.',
  usage: '?avatar [@user]',
  category: 'utility',
  async execute(message) {
    const user = message.mentions.users.first() || message.author;
    await message.reply(user.displayAvatarURL({ size: 512, extension: 'png' as any }));
  },
};
export default command;