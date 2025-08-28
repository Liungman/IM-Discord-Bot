import type { PrefixCommand } from '../../types/prefixCommand.js';
const map: Record<string, string> = { a: '4', e: '3', i: '1', o: '0', s: '5', t: '7' };
const command: PrefixCommand = {
  name: 'leet',
  description: 'Convert text to l33t.',
  usage: '?leet <text>',
  category: 'fun',
  async execute(message, args) {
    const t = args.join(' ');
    if (!t) return void message.reply('Provide text.');
    await message.reply(
      t
        .split('')
        .map((c) => map[c.toLowerCase()] ?? c)
        .join(''),
    );
  },
};
export default command;