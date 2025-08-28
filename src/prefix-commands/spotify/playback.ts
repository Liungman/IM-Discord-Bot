import type { PrefixCommand } from '../../types/prefixCommand.js';
import { errorEmbed, successEmbed, defaultEmbed } from '../../lib/embeds.js';
import { isSpotifyEnabled } from '../../config/env.js';
import { getSpotifyApi } from '../../lib/SpotifyManager.js';
import { getSpotifyToken } from '../../storage/spotifyTokens.js';

async function requireSpotifyAuth(userId: string): Promise<{ api: any; error?: string }> {
  if (!isSpotifyEnabled()) {
    return { api: null, error: 'Spotify integration is not configured.' };
  }

  const token = getSpotifyToken(userId);
  if (!token) {
    return { api: null, error: 'You are not connected to Spotify. Use `?spotify login` to connect.' };
  }

  const spotifyApi = getSpotifyApi();
  if (!spotifyApi) {
    return { api: null, error: 'Spotify API not available.' };
  }

  spotifyApi.setAccessToken(token.accessToken);
  return { api: spotifyApi };
}

const spotifyCommand: PrefixCommand = {
  name: 'spotify',
  description: 'Control Spotify playback - play, pause, next, previous, or show current track.',
  usage: '?spotify <play|pause|next|previous|current>',
  category: 'spotify',
  aliases: ['sp'],
  async execute(message, args) {
    const subCommand = args[0]?.toLowerCase();

    switch (subCommand) {
      case 'play':
      case 'resume':
        await handleSpotifyPlay(message);
        break;
      case 'pause':
        await handleSpotifyPause(message);
        break;
      case 'next':
      case 'skip':
        await handleSpotifyNext(message);
        break;
      case 'previous':
      case 'prev':
        await handleSpotifyPrevious(message);
        break;
      case 'current':
      case 'now':
      case 'np':
        await handleSpotifyCurrent(message);
        break;
      default:
        await message.reply({ 
          embeds: [errorEmbed('Please specify a command: play, pause, next, previous, or current')] 
        });
        break;
    }
  },
};

async function handleSpotifyPlay(message: any) {
  const { api, error } = await requireSpotifyAuth(message.author.id);
  if (error) {
    await message.reply({ embeds: [errorEmbed(error)] });
    return;
  }

  try {
    await api.play();
    await message.reply({ embeds: [successEmbed('▶️ Resumed Spotify playback')] });
  } catch (error: any) {
    if (error.statusCode === 404) {
      await message.reply({ embeds: [errorEmbed('No active Spotify device found. Please start Spotify on a device first.')] });
    } else {
      await message.reply({ embeds: [errorEmbed('Failed to resume playback. Make sure Spotify is active on a device.')] });
    }
  }
}

async function handleSpotifyPause(message: any) {
  const { api, error } = await requireSpotifyAuth(message.author.id);
  if (error) {
    await message.reply({ embeds: [errorEmbed(error)] });
    return;
  }

  try {
    await api.pause();
    await message.reply({ embeds: [successEmbed('⏸️ Paused Spotify playback')] });
  } catch (error: any) {
    if (error.statusCode === 404) {
      await message.reply({ embeds: [errorEmbed('No active Spotify device found.')] });
    } else {
      await message.reply({ embeds: [errorEmbed('Failed to pause playback.')] });
    }
  }
}

async function handleSpotifyNext(message: any) {
  const { api, error } = await requireSpotifyAuth(message.author.id);
  if (error) {
    await message.reply({ embeds: [errorEmbed(error)] });
    return;
  }

  try {
    await api.skipToNext();
    await message.reply({ embeds: [successEmbed('⏭️ Skipped to next track')] });
  } catch (error: any) {
    if (error.statusCode === 404) {
      await message.reply({ embeds: [errorEmbed('No active Spotify device found.')] });
    } else {
      await message.reply({ embeds: [errorEmbed('Failed to skip track.')] });
    }
  }
}

async function handleSpotifyPrevious(message: any) {
  const { api, error } = await requireSpotifyAuth(message.author.id);
  if (error) {
    await message.reply({ embeds: [errorEmbed(error)] });
    return;
  }

  try {
    await api.skipToPrevious();
    await message.reply({ embeds: [successEmbed('⏮️ Skipped to previous track')] });
  } catch (error: any) {
    if (error.statusCode === 404) {
      await message.reply({ embeds: [errorEmbed('No active Spotify device found.')] });
    } else {
      await message.reply({ embeds: [errorEmbed('Failed to skip to previous track.')] });
    }
  }
}

async function handleSpotifyCurrent(message: any) {
  const { api, error } = await requireSpotifyAuth(message.author.id);
  if (error) {
    await message.reply({ embeds: [errorEmbed(error)] });
    return;
  }

  try {
    const data = await api.getMyCurrentPlayingTrack();
    
    if (!data.body || !data.body.item) {
      await message.reply({ embeds: [errorEmbed('No track is currently playing on Spotify.')] });
      return;
    }

    const track = data.body.item;
    const artists = track.artists.map((artist: any) => artist.name).join(', ');
    const progress = data.body.progress_ms || 0;
    const duration = track.duration_ms;
    
    const formatTime = (ms: number) => {
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const embed = defaultEmbed(message.guild ?? undefined)
      .setTitle('🎵 Currently Playing on Spotify')
      .setDescription(`**${track.name}**\nby ${artists}`)
      .addFields(
        { name: 'Album', value: track.album.name, inline: true },
        { name: 'Progress', value: `${formatTime(progress)} / ${formatTime(duration)}`, inline: true },
        { name: 'Playing', value: data.body.is_playing ? '▶️ Playing' : '⏸️ Paused', inline: true }
      );

    if (track.album.images && track.album.images.length > 0) {
      embed.setThumbnail(track.album.images[0].url);
    }

    await message.reply({ embeds: [embed] });
  } catch (error: any) {
    if (error.statusCode === 404) {
      await message.reply({ embeds: [errorEmbed('No active Spotify device found.')] });
    } else {
      await message.reply({ embeds: [errorEmbed('Failed to get current track information.')] });
    }
  }
}

export default spotifyCommand;