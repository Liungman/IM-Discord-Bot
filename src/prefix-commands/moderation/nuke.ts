import type { PrefixCommand } from '../../types/prefixCommand.js';
import { PermissionFlagsBits, ChannelType, type GuildChannel, type TextChannel, type NewsChannel, type VoiceChannel } from 'discord.js';
import { defaultEmbed } from '../../lib/embeds.js';

const command: PrefixCommand = {
  name: 'nuke',
  description: 'Completely recreate the current channel (deletes all messages and history).',
  usage: '?nuke',
  category: 'moderation',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ManageChannels,
  async execute(message) {
    if (!message.guild || !message.channel) return;
    
    const channel = message.channel as GuildChannel;
    
    // Only work with certain channel types
    if (![ChannelType.GuildText, ChannelType.GuildNews, ChannelType.GuildVoice].includes(channel.type)) {
      await message.reply('This command can only be used in text, news, or voice channels.');
      return;
    }
    
    // Confirm dangerous operation
    const confirmEmbed = defaultEmbed(message.guild)
      .setTitle('⚠️ Channel Nuke Confirmation')
      .setDescription(`This will completely **DELETE AND RECREATE** this channel: ${channel.name}\n\n**ALL MESSAGE HISTORY WILL BE PERMANENTLY LOST!**\n\nType \`NUKE CONFIRM\` to proceed.`)
      .addFields(
        { name: 'Channel', value: `${channel}` },
        { name: 'Warning', value: 'This action cannot be undone!' }
      )
      .setColor(0xff0000);
    
    const confirmMsg = await message.reply({ embeds: [confirmEmbed] });
    
    // Wait for confirmation
    const filter = (m: any) => m.author.id === message.author.id;
    const collected = await (message.channel as any).awaitMessages({
      filter,
      max: 1,
      time: 30000,
      errors: ['time']
    }).catch(() => null);
    
    if (!collected || collected.first()?.content !== 'NUKE CONFIRM') {
      const cancelEmbed = defaultEmbed(message.guild)
        .setTitle('Nuke Cancelled')
        .setDescription('Operation cancelled or confirmation not received within 30 seconds.')
        .setColor(0x808080);
      
      await confirmMsg.edit({ embeds: [cancelEmbed] });
      return;
    }
    
    try {
      // Store channel properties
      const channelData = {
        name: channel.name,
        topic: (channel as TextChannel).topic || undefined,
        nsfw: (channel as TextChannel).nsfw || false,
        rateLimitPerUser: (channel as TextChannel).rateLimitPerUser || 0,
        parent: channel.parent,
        position: channel.position,
        permissionOverwrites: channel.permissionOverwrites.cache.clone(),
      };
      
      // Create new channel with same properties
      const newChannel = await message.guild.channels.create({
        name: channelData.name,
        type: channel.type,
        topic: channelData.topic,
        nsfw: channelData.nsfw,
        rateLimitPerUser: channelData.rateLimitPerUser,
        parent: channelData.parent,
        position: channelData.position,
        permissionOverwrites: channelData.permissionOverwrites.map(overwrite => ({
          id: overwrite.id,
          allow: overwrite.allow,
          deny: overwrite.deny,
          type: overwrite.type,
        })),
      });
      
      // Delete the old channel
      await channel.delete('Channel nuked');
      
      // Send confirmation in the new channel
      const nukeEmbed = defaultEmbed(message.guild)
        .setTitle('💥 Channel Nuked')
        .setDescription('This channel has been completely recreated.')
        .addFields(
          { name: 'Executed by', value: `${message.author.tag}` },
          { name: 'Previous Messages', value: 'All previous message history has been permanently deleted.' }
        )
        .setColor(0xff4500)
        .setTimestamp();
      
      if (newChannel.type === ChannelType.GuildText || newChannel.type === ChannelType.GuildNews) {
        await (newChannel as TextChannel | NewsChannel).send({ embeds: [nukeEmbed] });
      }
      
    } catch (error) {
      console.error('Nuke command error:', error);
      
      // Try to send error in original channel if it still exists
      try {
        await message.reply('Failed to nuke channel. I may lack the necessary permissions (Manage Channels).');
      } catch {
        // Channel might have been deleted, nothing we can do
      }
    }
  },
};

export default command;