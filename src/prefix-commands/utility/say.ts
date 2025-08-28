import type { PrefixCommand } from '../../types/prefixCommand.js';
const command: PrefixCommand = {
  name: 'say',
  description: 'Make the bot say something.',
  usage: '?say <text>',
  category: 'utility',
  async execute(message, args) {
    const text = args.join(' ');
    if (!text) return void message.reply('Provide text to say.');
    await message.channel.send(text);
  },
};
export default command;