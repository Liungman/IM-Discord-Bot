import type { PrefixCommand } from '../../types/prefixCommand.js';
import { GuildMember, VoiceChannel } from 'discord.js';
import { defaultEmbed, errorEmbed, successEmbed } from '../../lib/embeds.js';
import { PlayerManager } from '../../lib/PlayerManager.js';

const command: PrefixCommand = {
  name: 'play',
  description: 'Play a song or add it to the queue.',
  usage: '?play [next] <query|url>',
  category: 'music',
  aliases: ['p'],
  guildOnly: true,
  async execute(message, args) {
    if (!message.guild) return;

    const member = message.member as GuildMember;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel || !(voiceChannel instanceof VoiceChannel)) {
      await message.reply({ embeds: [errorEmbed('You must be in a voice channel to use music commands!')] });
      return;
    }

    if (args.length === 0) {
      await message.reply({ embeds: [errorEmbed('Please provide a song query or URL!')] });
      return;
    }

    let playNext = false;
    let query = args.join(' ');

    // Check if "next" flag is used
    if (args[0].toLowerCase() === 'next') {
      playNext = true;
      query = args.slice(1).join(' ');
      if (!query) {
        await message.reply({ embeds: [errorEmbed('Please provide a song query or URL after "next"!')] });
        return;
      }
    }

    const player = PlayerManager.getPlayer(message.guild);

    // Join the voice channel if not connected or in a different channel
    if (!player.connection || player.connection.joinConfig.channelId !== voiceChannel.id) {
      const joined = await player.joinChannel(voiceChannel);
      if (!joined) {
        await message.reply({ embeds: [errorEmbed('Failed to join the voice channel!')] });
        return;
      }
    }

    // For now, create a mock track since we haven't implemented streaming yet
    const mockTrack = {
      title: query.length > 50 ? query.substring(0, 50) + '...' : query,
      url: 'mock://url',
      duration: 180, // 3 minutes
      requestedBy: message.author.id,
      source: 'youtube' as const,
    };

    if (playNext) {
      player.addToQueueNext(mockTrack);
      await message.reply({ 
        embeds: [successEmbed(`Added to front of queue: **${mockTrack.title}** (Position: 1)`)] 
      });
    } else {
      player.addToQueue(mockTrack);
      const position = player.queue.length;
      await message.reply({ 
        embeds: [successEmbed(`Added to queue: **${mockTrack.title}** (Position: ${position})`)] 
      });
    }

    // Start playing if nothing is currently playing
    if (!player.currentTrack && player.queue.length > 0) {
      const success = await player.play();
      if (success) {
        // Small delay to ensure currentTrack is set
        setTimeout(async () => {
          const currentTrack = player.currentTrack;
          if (currentTrack) {
            const embed = defaultEmbed(message.guild!)
              .setTitle('🎵 Now Playing')
              .setDescription(`**${currentTrack.title}**`)
              .addFields(
                { name: 'Requested by', value: `<@${currentTrack.requestedBy}>`, inline: true },
                { name: 'Queue length', value: `${player.queue.length} songs`, inline: true }
              );
            
            if ('send' in message.channel) {
              await message.channel.send({ embeds: [embed] });
            }
          }
        }, 100);
      }
    }
  },
};

export default command;