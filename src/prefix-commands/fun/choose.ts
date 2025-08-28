import type { PrefixCommand } from '../../types/prefixCommand.js';
const command: PrefixCommand = {
  name: 'choose',
  description: 'Choose from a list of options',
  usage: '?choose option1 | option2 | option3',
  category: 'fun',
  async execute(message, args) {
    const joined = args.join(' ');
    const parts = joined.split(/\s*\|\s*|,\s*/).filter(Boolean);
    if (parts.length < 2) return void message.reply('Provide at least two options separated by | or ,');
    const pick = parts[Math.floor(Math.random() * parts.length)];
    await message.reply(`I choose: ${pick}`);
  },
};
export default command;