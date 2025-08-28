import type { PrefixCommand } from '../../types/prefixCommand.js';
const command: PrefixCommand = {
  name: 'dice',
  description: 'Roll dice. Examples: ?dice d6, ?dice 2d8',
  usage: '?dice [XdY]',
  category: 'fun',
  async execute(message, args) {
    const spec = (args[0] || 'd6').toLowerCase();
    const m = /^(\d+)?d(\d+)$/.exec(spec);
    if (!m) return void message.reply('Use format XdY, e.g. 2d6 or d20');
    const count = Math.min(20, Math.max(1, parseInt(m[1] || '1', 10)));
    const sides = Math.min(1000, Math.max(2, parseInt(m[2], 10)));
    const rolls = Array.from({ length: count }, () => 1 + Math.floor(Math.random() * sides));
    await message.reply(`${rolls.join(', ')} (total: ${rolls.reduce((a, b) => a + b, 0)})`);
  },
};
export default command;