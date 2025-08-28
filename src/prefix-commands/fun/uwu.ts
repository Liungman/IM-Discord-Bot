import type { PrefixCommand } from '../../types/prefixCommand.js';
function uwuify(text: string) {
  return text
    .replace(/[rl]/g, 'w')
    .replace(/[RL]/g, 'W')
    .replace(/n([aeiou])/g, 'ny$1')
    .replace(/N([aeiou])/g, 'Ny$1')
    .replace(/ove/g, 'uv');
}
const command: PrefixCommand = {
  name: 'uwu',
  description: 'Uwuify text',
  usage: '?uwu <text>',
  category: 'fun',
  async execute(message, args) {
    const text = args.join(' ');
    if (!text) return void message.reply('Provide some text.');
    await message.reply(uwuify(text));
  },
};
export default command;