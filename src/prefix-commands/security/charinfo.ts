import type { PrefixCommand } from '../../types/prefixCommand.js';

const command: PrefixCommand = {
  name: 'charinfo',
  description: 'Get information about characters/symbols.',
  usage: '?charinfo <characters>',
  category: 'security',
  async execute(message, args) {
    const text = args.join(' ');
    if (!text) return void message.reply('Provide one or more characters.');
    const lines = Array.from(text).slice(0, 10).map((ch) => {
      const code = ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0');
      return `${ch} — U+${code}`;
    });
    await message.reply(lines.join('\n'));
  },
};

export default command;