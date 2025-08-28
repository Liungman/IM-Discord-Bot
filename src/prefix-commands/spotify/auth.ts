import type { PrefixCommand } from '../../types/prefixCommand.js';
import { defaultEmbed, errorEmbed, successEmbed } from '../../lib/embeds.js';
import { isSpotifyEnabled } from '../../config/env.js';
import { generateSpotifyAuthUrl, getSpotifyApi } from '../../lib/SpotifyManager.js';
import { hasValidSpotifyToken, getSpotifyToken, removeSpotifyToken } from '../../storage/spotifyTokens.js';

const loginCommand: PrefixCommand = {
  name: 'spotify login',
  description: 'Connect your Spotify account to the bot.',
  usage: '?spotify login',
  category: 'spotify',
  async execute(message) {
    if (!isSpotifyEnabled()) {
      await message.reply({
        embeds: [errorEmbed(
          'Spotify integration is not configured. Please set SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, and SPOTIFY_REDIRECT_URI environment variables.'
        )]
      });
      return;
    }

    if (hasValidSpotifyToken(message.author.id)) {
      await message.reply({
        embeds: [successEmbed('You are already connected to Spotify! Use `?spotify logout` to disconnect.')]
      });
      return;
    }

    const authUrl = generateSpotifyAuthUrl(message.author.id);
    if (!authUrl) {
      await message.reply({
        embeds: [errorEmbed('Failed to generate Spotify authorization URL. Please try again later.')]
      });
      return;
    }

    const embed = defaultEmbed(message.guild ?? undefined)
      .setTitle('🎵 Connect to Spotify')
      .setDescription(
        `Click the link below to connect your Spotify account:\n\n[**Connect Spotify Account**](${authUrl})\n\n` +
        `This link will expire in 10 minutes.`
      )
      .setFooter({ text: 'After connecting, you can use Spotify commands!' });

    await message.reply({ embeds: [embed] });
  },
};

const logoutCommand: PrefixCommand = {
  name: 'spotify logout',
  description: 'Disconnect your Spotify account from the bot.',
  usage: '?spotify logout',
  category: 'spotify',
  async execute(message) {
    if (!hasValidSpotifyToken(message.author.id)) {
      await message.reply({
        embeds: [errorEmbed('You are not connected to Spotify.')]
      });
      return;
    }

    removeSpotifyToken(message.author.id);
    await message.reply({
      embeds: [successEmbed('Successfully disconnected from Spotify.')]
    });
  },
};

const statusCommand: PrefixCommand = {
  name: 'spotify status',
  description: 'Check your Spotify connection status.',
  usage: '?spotify status',
  category: 'spotify',
  async execute(message) {
    if (!isSpotifyEnabled()) {
      await message.reply({
        embeds: [errorEmbed('Spotify integration is not configured.')]
      });
      return;
    }

    const token = getSpotifyToken(message.author.id);
    if (!token) {
      await message.reply({
        embeds: [errorEmbed('You are not connected to Spotify. Use `?spotify login` to connect.')]
      });
      return;
    }

    try {
      const spotifyApi = getSpotifyApi();
      if (!spotifyApi) {
        throw new Error('Spotify API not initialized');
      }

      spotifyApi.setAccessToken(token.accessToken);
      const userProfile = await spotifyApi.getMe();

      const embed = defaultEmbed(message.guild ?? undefined)
        .setTitle('🎵 Spotify Connection Status')
        .addFields(
          { name: 'Status', value: '✅ Connected', inline: true },
          { name: 'Account', value: userProfile.body.display_name || 'Unknown', inline: true },
          { name: 'Expires', value: `<t:${Math.floor(token.expiresAt / 1000)}:R>`, inline: true }
        );

      await message.reply({ embeds: [embed] });
    } catch (error) {
      await message.reply({
        embeds: [errorEmbed('Failed to verify Spotify connection. Please try logging in again.')]
      });
    }
  },
};

export default [loginCommand, logoutCommand, statusCommand];