import type { PrefixCommand } from '../../types/prefixCommand.js';
import { GuildMember, VoiceChannel, StageChannel } from 'discord.js';
import { errorEmbed, successEmbed } from '../../lib/embeds.js';
import { PlayerManager } from '../../lib/PlayerManager.js';

// Helper function to check voice channel access - reusable across music commands
async function checkVoiceAccess(message: any) {
  if (!message.guild) return { error: 'This command can only be used in servers.' };

  // Robust member fetching
  let member: GuildMember;
  try {
    member = await message.guild.members.fetch(message.author.id);
  } catch (error) {
    return { error: 'Failed to fetch your member information. Please try again.' };
  }

  const voiceChannel = member.voice?.channel;
  if (!voiceChannel || !(voiceChannel instanceof VoiceChannel || voiceChannel instanceof StageChannel)) {
    return { error: 'You must be in a voice channel to use music commands!' };
  }

  return { member, voiceChannel };
}

const volumeCommand: PrefixCommand = {
  name: 'volume',
  description: 'Set the music volume (0-200%).',
  usage: '?volume <0-200>',
  category: 'music',
  aliases: ['vol'],
  guildOnly: true,
  async execute(message, args) {
    const check = await checkVoiceAccess(message);
    if (check.error) {
      await message.reply({ embeds: [errorEmbed(check.error)] });
      return;
    }

    const player = PlayerManager.getPlayer(message.guild!);

    if (args.length === 0) {
      await message.reply({ embeds: [successEmbed(`🔊 Current volume: **${player.volume}%**`)] });
      return;
    }

    const volume = parseInt(args[0]);
    if (isNaN(volume) || volume < 0 || volume > 200) {
      await message.reply({ embeds: [errorEmbed('Please provide a valid volume between 0 and 200!')] });
      return;
    }

    player.volume = volume;
    await message.reply({ embeds: [successEmbed(`🔊 Volume set to **${volume}%**`)] });
  },
};

const repeatCommand: PrefixCommand = {
  name: 'repeat',
  description: 'Set repeat mode: off, one, or all.',
  usage: '?repeat <off|one|all>',
  category: 'music',
  aliases: ['loop'],
  guildOnly: true,
  async execute(message, args) {
    const check = await checkVoiceAccess(message);
    if (check.error) {
      await message.reply({ embeds: [errorEmbed(check.error)] });
      return;
    }

    const player = PlayerManager.getPlayer(message.guild!);

    if (args.length === 0) {
      const modeEmoji = player.repeatMode === 'off' ? '➡️' : player.repeatMode === 'one' ? '🔂' : '🔁';
      await message.reply({ embeds: [successEmbed(`${modeEmoji} Repeat mode: **${player.repeatMode}**`)] });
      return;
    }

    const mode = args[0].toLowerCase();
    if (!['off', 'one', 'all'].includes(mode)) {
      await message.reply({ embeds: [errorEmbed('Please specify a valid repeat mode: off, one, or all!')] });
      return;
    }

    player.repeatMode = mode as 'off' | 'one' | 'all';
    const modeEmoji = mode === 'off' ? '➡️' : mode === 'one' ? '🔂' : '🔁';
    await message.reply({ embeds: [successEmbed(`${modeEmoji} Repeat mode set to **${mode}**`)] });
  },
};

const shuffleCommand: PrefixCommand = {
  name: 'shuffle',
  description: 'Shuffle the current queue.',
  usage: '?shuffle',
  category: 'music',
  aliases: ['mix'],
  guildOnly: true,
  async execute(message) {
    const check = await checkVoiceAccess(message);
    if (check.error) {
      await message.reply({ embeds: [errorEmbed(check.error)] });
      return;
    }

    const player = PlayerManager.getPlayer(message.guild!);

    if (player.queue.length === 0) {
      await message.reply({ embeds: [errorEmbed('The queue is empty!')] });
      return;
    }

    player.shuffleQueue();
    await message.reply({ embeds: [successEmbed(`🔀 Shuffled ${player.queue.length} songs in the queue!`)] });
  },
};

export default [volumeCommand, repeatCommand, shuffleCommand];