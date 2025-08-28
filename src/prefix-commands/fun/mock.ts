import type { PrefixCommand } from '../../types/prefixCommand.js';
const command: PrefixCommand = {
  name: 'mock',
  description: 'mOcK TeXt cOnVeRtEr',
  usage: '?mock <text>',
  category: 'fun',
  async execute(message, args) {
    const t = args.join(' ');
    if (!t) return void message.reply('Provide text.');
    await message.reply(
      t
        .split('')
        .map((c, i) => (i % 2 ? c.toLowerCase() : c.toUpperCase()))
        .join(''),
    );
  },
};
export default command;