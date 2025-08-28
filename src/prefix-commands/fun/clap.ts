import type { PrefixCommand } from '../../types/prefixCommand.js';
const command: PrefixCommand = {
  name: 'clap',
  description: 'Insert 👏 between words.',
  usage: '?clap this is great',
  category: 'fun',
  async execute(message, args) {
    const t = args.join(' ');
    if (!t) return void message.reply('Provide text.');
    await message.reply(t.split(/\s+/).join(' 👏 '));
  },
};
export default command;