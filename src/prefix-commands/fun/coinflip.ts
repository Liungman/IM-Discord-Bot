import type { PrefixCommand } from '../../types/prefixCommand.js';
const command: PrefixCommand = {
  name: 'coinflip',
  description: 'Flip a coin.',
  usage: '?coinflip',
  category: 'fun',
  async execute(message) {
    await message.reply(Math.random() < 0.5 ? 'Heads' : 'Tails');
  },
};
export default command;