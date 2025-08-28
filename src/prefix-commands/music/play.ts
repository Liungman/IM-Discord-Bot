import type { PrefixCommand } from '../../types/prefixCommand.js';
import { GuildMember, VoiceChannel, StageChannel, PermissionFlagsBits } from 'discord.js';
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

    // Robust member fetching to avoid partials
    let member: GuildMember;
    try {
      member = await message.guild.members.fetch(message.author.id);
    } catch (error) {
      await message.reply({ embeds: [errorEmbed('Failed to fetch your member information. Please try again.')] });
      return;
    }

    const voiceChannel = member.voice?.channel;

    // Accept both Voice and Stage channels
    if (!voiceChannel || !(voiceChannel instanceof VoiceChannel || voiceChannel instanceof StageChannel)) {
      await message.reply({ embeds: [errorEmbed('You must be in a voice channel to use music commands!')] });
      return;
    }

    // Check bot permissions in the voice channel
    const botMember = message.guild.members.me;
    if (!botMember) {
      await message.reply({ embeds: [errorEmbed('Bot member information not available. Please try again.')] });
      return;
    }

    const permissions = voiceChannel.permissionsFor(botMember);
    if (!permissions?.has(PermissionFlagsBits.Connect)) {
      await message.reply({ embeds: [errorEmbed('I need the CONNECT permission to join your voice channel!')] });
      return;
    }

    if (!permissions?.has(PermissionFlagsBits.Speak)) {
      await message.reply({ embeds: [errorEmbed('I need the SPEAK permission to play music in your voice channel!')] });
      return;
    }

    const player = PlayerManager.getPlayer(message.guild);

    // If bot is connected to a different VC, require user to be in the same VC
    if (player.connection && player.connection.joinConfig.channelId !== voiceChannel.id) {
      await message.reply({ 
        embeds: [errorEmbed('I\'m already connected to a different voice channel! Please join that channel or use `?disconnect` first.')] 
      });
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

    // Join the voice channel if not connected
    if (!player.connection) {
      const joined = await player.joinChannel(voiceChannel as VoiceChannel);
      if (!joined) {
        await message.reply({ embeds: [errorEmbed('Failed to join the voice channel!')] });
        return;
      }
    }

    // Process the query/URL - for now this is still mock but structured for future implementation
    const track = await processQuery(query, message.author.id);

    if (!track) {
      await message.reply({ embeds: [errorEmbed('Failed to process the query. Please try again.')] });
      return;
    }

    if (playNext) {
      player.addToQueueNext(track);
      await message.reply({ 
        embeds: [successEmbed(`Added to front of queue: **${track.title}** (Position: 1)`)] 
      });
    } else {
      player.addToQueue(track);
      const position = player.queue.length;
      await message.reply({ 
        embeds: [successEmbed(`Added to queue: **${track.title}** (Position: ${position})`)] 
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

// Process query/URL - this will be expanded in the future to handle actual search/streaming
async function processQuery(query: string, requestedBy: string) {
  // Check if it's a URL
  const isUrl = isValidUrl(query);
  
  if (isUrl) {
    // Detect URL type
    const url = query.toLowerCase();
    let source: 'youtube' | 'soundcloud' | 'spotify' | 'file' = 'youtube';
    
    if (url.includes('soundcloud.com')) {
      source = 'soundcloud';
    } else if (url.includes('spotify.com')) {
      source = 'spotify';
    }
    
    return {
      title: `URL: ${query.length > 40 ? query.substring(0, 40) + '...' : query}`,
      url: query,
      duration: 180,
      requestedBy,
      source,
    };
  } else {
    // Search query - for now create mock track, future: search YouTube via play-dl
    return {
      title: query.length > 50 ? query.substring(0, 50) + '...' : query,
      url: 'mock://search',
      duration: 180,
      requestedBy,
      source: 'youtube' as const,
    };
  }
}

function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export default command;