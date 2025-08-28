import type { PrefixCommand } from '../../types/prefixCommand.js';
const responses = [
  'It is certain.', 'Without a doubt.', 'You may rely on it.', 'Yes – definitely.',
  'Most likely.', 'Outlook good.', 'Signs point to yes.', 'Yes.',
  'Reply hazy, try again.', 'Ask again later.', 'Better not tell you now.', 'Cannot predict now.',
  'Don’t count on it.', 'My reply is no.', 'Outlook not so good.', 'Very doubtful.',
];
const command: PrefixCommand = {
  name: '8ball',
  description: 'Magic 8-ball',
  usage: '?8ball <question>',
  category: 'fun',
  async execute(message, args) {
    if (args.length === 0) return void message.reply('Ask a yes/no question.');
    await message.reply(responses[Math.floor(Math.random() * responses.length)]);
  },
};
export default command;