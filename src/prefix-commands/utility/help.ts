import type { PrefixCommand } from '../../types/prefixCommand.js';
import { defaultEmbed } from '../../lib/embeds.js';

const command: PrefixCommand = {
  name: 'help',
  description: 'Show command list or details for a command.',
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
      const e = defaultEmbed(message.guild ?? undefined).setTitle('Help');
      for (const [cat, cmds] of byCat) {
        e.addFields({ name: cat.toUpperCase(), value: cmds.map((c) => `?${c.name}`).join(', ').slice(0, 1000) || '—' });
      }
      await message.reply({ embeds: [e] });
      return;
    }

    const cmd = registry.get(name);
    if (!cmd) return void message.reply({ content: 'Command not found.' });
    const e = defaultEmbed(message.guild ?? undefined)
      .setTitle(`?${cmd.name}`)
      .setDescription(cmd.description)
      .addFields(
        ...(cmd.usage ? [{ name: 'Usage', value: cmd.usage }] : []),
        { name: 'Category', value: cmd.category },
      );
    await message.reply({ embeds: [e] });
  },
};

export default command;