import type { PrefixCommand } from '../../types/prefixCommand.js';
const command: PrefixCommand = {
  name: 'color',
  description: 'Show a hex color swatch',
  usage: '?color #RRGGBB',
  category: 'fun',
  async execute(message, args) {
    const hex = (args[0] || '').replace(/^#/, '');
    if (!/^[0-9a-fA-F]{6}$/.test(hex)) return void message.reply('Provide a valid hex code like #00c8ff');
    const url = `https://singlecolorimage.com/get/${hex}/256x64`;
    await message.reply(url);
  },
};
export default command;