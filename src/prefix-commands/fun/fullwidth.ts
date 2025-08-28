import type { PrefixCommand } from '../../types/prefixCommand.js';
const command: PrefixCommand = {
  name: 'fullwidth',
  description: 'Convert to Ｆｕｌｌ－ｗｉｄｔｈ.',
  usage: '?fullwidth <text>',
  category: 'fun',
  async execute(message, args) {
    const t = args.join(' ');
    if (!t) return void message.reply('Provide text.');
    const base = 0xFF01 - '!'.charCodeAt(0);
    const out = t.split('').map((c) => {
      const code = c.charCodeAt(0);
      if (code >= 33 && code <= 126) return String.fromCharCode(code + base);
      if (c === ' ') return '　';
      return c;
    }).join('');
    await message.reply(out);
  },
};
export default command;