import type { PrefixCommand } from '../../types/prefixCommand.js';

const command: PrefixCommand = {
  name: 'topcommands',
  description: 'View the most used commands for this session.',
  usage: '?topcommands',
  category: 'utility',
  async execute(message, _args, client) {
    const usage = (client as any).commandUsage as Map<string, number>;
    const sorted = [...usage.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
    if (!sorted.length) return void message.reply('No command usage recorded yet.');
    const lines = sorted.map(([n, c], i) => `${i + 1}. ?${n} — ${c}`);
    await message.reply(lines.join('\n'));
  },
};

export default command;