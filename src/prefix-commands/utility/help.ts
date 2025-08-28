import type { PrefixCommand } from '../../types/prefixCommand.js';

const command: PrefixCommand = {
  name: 'help',
  description: 'Show available prefix commands',
  usage: '?help [command]',
  category: 'utility',
  async execute(message, args, client) {
    const registry = (client as any).prefixCommands as Map<string, PrefixCommand>;
    const name = (args[0] || '').toLowerCase();

    if (!name) {
      const byCat = new Map<string, PrefixCommand[]>();
      for (const cmd of registry.values()) {
        if (!byCat.has(cmd.category)) byCat.set(cmd.category, []);
        byCat.get(cmd.category)!.push(cmd);
      }
      const lines: string[] = [];
      for (const [cat, cmds] of byCat) {
        lines.push(`• ${cat.toUpperCase()}: ${cmds.map((c) => `?${c.name}`).join(', ')}`);
      }
      await message.reply(lines.join('\n'));
      return;
    }

    const cmd = registry.get(name);
    if (!cmd) return void message.reply('Command not found.');
    await message.reply(`?${cmd.name} — ${cmd.description}${cmd.usage ? `\nUsage: ${cmd.usage}` : ''}`);
  },
};

export default command;