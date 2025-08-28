import type { PrefixCommand } from '../../types/prefixCommand.js';
import { GuildMember, VoiceChannel } from 'discord.js';
import { errorEmbed, successEmbed } from '../../lib/embeds.js';
import { PlayerManager } from '../../lib/PlayerManager.js';

const pauseCommand: PrefixCommand = {
  name: 'pause',
  description: 'Pause the current song.',
  usage: '?pause',
  category: 'music',
  guildOnly: true,
  async execute(message) {
    if (!message.guild) return;

    const member = message.member as GuildMember;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel || !(voiceChannel instanceof VoiceChannel)) {
      await message.reply({ embeds: [errorEmbed('You must be in a voice channel to use music commands!')] });
      return;
    }

    const player = PlayerManager.getPlayer(message.guild);

    if (!player.currentTrack) {
      await message.reply({ embeds: [errorEmbed('No music is currently playing!')] });
      return;
    }

    if (player.paused) {
      await message.reply({ embeds: [errorEmbed('Music is already paused!')] });
      return;
    }

    const success = player.pause();
    if (success) {
      await message.reply({ embeds: [successEmbed('⏸️ Paused the music')] });
    } else {
      await message.reply({ embeds: [errorEmbed('Failed to pause the music!')] });
    }
  },
};

const resumeCommand: PrefixCommand = {
  name: 'resume',
  description: 'Resume the paused song.',
  usage: '?resume',
  category: 'music',
  guildOnly: true,
  async execute(message) {
    if (!message.guild) return;

    const member = message.member as GuildMember;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel || !(voiceChannel instanceof VoiceChannel)) {
      await message.reply({ embeds: [errorEmbed('You must be in a voice channel to use music commands!')] });
      return;
    }

    const player = PlayerManager.getPlayer(message.guild);

    if (!player.currentTrack) {
      await message.reply({ embeds: [errorEmbed('No music is currently paused!')] });
      return;
    }

    if (!player.paused) {
      await message.reply({ embeds: [errorEmbed('Music is not paused!')] });
      return;
    }

    const success = player.resume();
    if (success) {
      await message.reply({ embeds: [successEmbed('▶️ Resumed the music')] });
    } else {
      await message.reply({ embeds: [errorEmbed('Failed to resume the music!')] });
    }
  },
};

const skipCommand: PrefixCommand = {
  name: 'skip',
  description: 'Skip the current song.',
  usage: '?skip',
  category: 'music',
  aliases: ['s', 'next'],
  guildOnly: true,
  async execute(message) {
    if (!message.guild) return;

    const member = message.member as GuildMember;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel || !(voiceChannel instanceof VoiceChannel)) {
      await message.reply({ embeds: [errorEmbed('You must be in a voice channel to use music commands!')] });
      return;
    }

    const player = PlayerManager.getPlayer(message.guild);

    if (!player.currentTrack) {
      await message.reply({ embeds: [errorEmbed('No music is currently playing!')] });
      return;
    }

    const skippedTrack = player.currentTrack.title;
    const success = player.skip();

    if (success) {
      await message.reply({ embeds: [successEmbed(`⏭️ Skipped: **${skippedTrack}**`)] });
    } else {
      await message.reply({ embeds: [errorEmbed('Failed to skip the current song!')] });
    }
  },
};

const disconnectCommand: PrefixCommand = {
  name: 'disconnect',
  description: 'Disconnect the bot from the voice channel and clear the queue.',
  usage: '?disconnect',
  category: 'music',
  aliases: ['dc', 'leave', 'stop'],
  guildOnly: true,
  async execute(message) {
    if (!message.guild) return;

    const member = message.member as GuildMember;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel || !(voiceChannel instanceof VoiceChannel)) {
      await message.reply({ embeds: [errorEmbed('You must be in a voice channel to use music commands!')] });
      return;
    }

    const player = PlayerManager.getPlayer(message.guild);

    if (!player.connection) {
      await message.reply({ embeds: [errorEmbed('I\'m not connected to a voice channel!')] });
      return;
    }

    const queueLength = player.queue.length;
    const wasPlaying = player.currentTrack !== null;

    player.clearQueue();
    player.disconnect();
    PlayerManager.removePlayer(message.guild.id);

    const message_content = wasPlaying || queueLength > 0
      ? `👋 Disconnected and cleared ${queueLength} song${queueLength !== 1 ? 's' : ''} from the queue`
      : '👋 Disconnected from voice channel';

    await message.reply({ embeds: [successEmbed(message_content)] });
  },
};

export default [pauseCommand, resumeCommand, skipCommand, disconnectCommand];