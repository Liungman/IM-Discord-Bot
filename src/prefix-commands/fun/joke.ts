import type { PrefixCommand } from '../../types/prefixCommand.js';
const jokes = [
  'Why do programmers prefer dark mode? Because light attracts bugs.',
  'There are 10 kinds of people in the world: those who understand binary and those who don’t.',
  'I told my computer I needed a break, and it said “No problem — I’ll go to sleep.”',
  'Debugging: Being the detective in a crime movie where you are also the murderer.',
];
const command: PrefixCommand = {
  name: 'joke',
  description: 'Tell a random joke.',
  usage: '?joke',
  category: 'fun',
  async execute(message) {
    await message.reply(jokes[Math.floor(Math.random() * jokes.length)]);
  },
};
export default command;