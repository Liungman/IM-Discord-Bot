import type { PrefixCommand } from '../../types/prefixCommand.js';
const prompts = [
  'Be able to fly or be invisible?',
  'Always be 10 minutes late or 20 minutes early?',
  'Have unlimited pizza or unlimited sushi?',
  'Have more time or more money?',
  'Know the history of every object you touched or be able to talk to animals?',
];
const command: PrefixCommand = {
  name: 'wouldyourather',
  description: 'Get a random “Would you rather?” prompt.',
  usage: '?wouldyourather',
  category: 'fun',
  async execute(message) {
    const q = prompts[Math.floor(Math.random() * prompts.length)];
    await message.reply(q);
  },
};
export default command;