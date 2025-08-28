import type { PrefixCommand } from '../../types/prefixCommand.js';
const command: PrefixCommand = {
  name: 'quickpoll',
  description: 'Add up/down reactions to start a quick poll',
  usage: '?quickpoll <question>',
  category: 'fun',
  guildOnly: true,
  async execute(message, args) {
    const question = args.join(' ').trim();
    if (!question) return void message.reply('Provide a question, e.g. ?quickpoll Do you like this bot?');
    const sent = await message.channel.send(`📊 ${question}\nReact below to vote!`);
    try {
      await sent.react('👍');
      await sent.react('👎');
    } catch {}
  },
};
export default command;