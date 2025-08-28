import type { PrefixCommand } from '../../types/prefixCommand.js';
const command: PrefixCommand = {
  name: 'randomhex',
  description: 'Generate a random hex color',
  usage: '?randomhex',
  category: 'fun',
  async execute(message) {
    const hex = `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;
    await message.reply(hex);
  },
};
export default command;