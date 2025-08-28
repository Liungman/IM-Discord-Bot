import type { PrefixCommand } from '../../types/prefixCommand.js';
import { parseEmoji, emojiCdnUrl, twemojiPngUrl } from '../../lib/emoji.js';

const command: PrefixCommand = {
  name: 'jumbo',
  description: 'Show a large version of an emoji or custom emote',
  usage: '?jumbo <emoji>',
  category: 'fun',
  async execute(message, args) {
    const input = args[0];
    if (!input) return void message.reply('Provide an emoji to enlarge.');
    const parsed = parseEmoji(input);
    if (!parsed) return void message.reply('Could not parse that emoji.');
    if ('unicode' in parsed) return void message.reply(twemojiPngUrl(parsed.unicode));
    return void message.reply(emojiCdnUrl(parsed.id, parsed.animated));
  },
};
export default command;