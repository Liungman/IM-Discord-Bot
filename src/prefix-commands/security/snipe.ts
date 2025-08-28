import type { PrefixCommand } from '../../types/prefixCommand.js';
import { TimestampStyles, time } from 'discord.js';
import { getSnipe } from '../../state/snipe.js';

const command: PrefixCommand = {
  name: 'snipe',
  description: 'Show the last deleted message in this channel.',
  usage: '?snipe',
  category: 'security',
  aliases: ['s'],
  guildOnly: true,
  async execute(message) {
    const s = getSnipe(message.channel.id);
    if (!s) return void message.reply('Nothing to snipe.');
    const when = time(Math.floor(s.createdTimestamp / 1000), TimestampStyles.RelativeTime);
    const attachments = s.attachments.length ? `\nAttachments:\n${s.attachments.join('\n')}` : '';
    await message.reply(`Deleted by ${s.authorTag} ${when}:\n${s.content || '(no content)'}${attachments}`);
  },
};

export default command;