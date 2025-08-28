import type { PrefixCommand } from '../../types/prefixCommand.js';
const command: PrefixCommand = {
  name: 'reverse',
  description: 'Reverse the provided text.',
  usage: '?reverse <text>',
  category: 'fun',
  async execute(message, args) {
    const text = args.join(' ');
    if (!text) return void message.reply('Provide text to reverse.');
    await message.reply(text.split('').reverse().join(''));
  },
};
export default command;