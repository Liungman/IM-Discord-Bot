import type { PrefixCommand } from '../../types/prefixCommand.js';
import { defaultEmbed } from '../../lib/embeds.js';

const command: PrefixCommand = {
  name: 'defaultembed',
  description: 'Send a default themed embed (OLED theme) with server header.',
  usage: '?defaultembed [title] | [description]',
  category: 'embed',
  guildOnly: true,
  async execute(message, args) {
    const txt = args.join(' ');
    const [title, description] = txt.includes('|') ? txt.split('|').map((s) => s.trim()) : [txt.trim(), ''];
    const e = defaultEmbed(message.guild ?? undefined);
    if (title) e.setTitle(title);
    if (description) e.setDescription(description);
    await message.reply({ embeds: [e] });
  },
};

export default command;