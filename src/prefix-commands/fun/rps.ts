import type { PrefixCommand } from '../../types/prefixCommand.js';
const options = ['rock', 'paper', 'scissors'] as const;
const command: PrefixCommand = {
  name: 'rps',
  description: 'Rock, paper, scissors',
  usage: '?rps <rock|paper|scissors>',
  category: 'fun',
  async execute(message, args) {
    const choice = (args[0] || '').toLowerCase();
    if (!options.includes(choice as any)) return void message.reply('Choose rock, paper, or scissors.');
    const bot = options[Math.floor(Math.random() * 3)];
    let result = "It's a tie!";
    if ((choice === 'rock' && bot === 'scissors') || (choice === 'paper' && bot === 'rock') || (choice === 'scissors' && bot === 'paper')) result = 'You win!';
    if ((bot === 'rock' && choice === 'scissors') || (bot === 'paper' && choice === 'rock') || (bot === 'scissors' && choice === 'paper')) result = 'I win!';
    await message.reply(`You: ${choice}\nMe: ${bot}\n${result}`);
  },
};
export default command;