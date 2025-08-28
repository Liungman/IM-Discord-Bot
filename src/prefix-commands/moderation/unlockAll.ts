import type { PrefixCommand } from '../../types/prefixCommand.js';
import { PermissionFlagsBits, ChannelType, PermissionsBitField, type GuildChannel, type TextChannel, type NewsChannel, type VoiceChannel } from 'discord.js';
import { defaultEmbed } from '../../lib/embeds.js';
import { getGuildSettings } from '../../storage/guildSettings.js';

const command: PrefixCommand = {
  name: 'unlock all',
  description: 'Remove message sending restrictions from all channels (opposite of lockdown all).',
  usage: '?unlock all',
  category: 'moderation',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ManageChannels,
  async execute(message) {
    if (!message.guild) return;
    
    const settings = getGuildSettings(message.guild.id);
    const ignoredChannels = settings.lockdown?.ignoredChannelIds || [];
    
    // Confirm operation
    const confirmEmbed = defaultEmbed(message.guild)
      .setTitle('🔓 Unlock All Channels')
      .setDescription('This will remove @everyone message sending restrictions from all text channels.')
      .addFields(
        { name: 'Ignored Channels', value: ignoredChannels.length > 0 ? `${ignoredChannels.length} channel(s) will be skipped` : 'None' },
        { name: 'Confirmation', value: 'Type `UNLOCK` to proceed.' }
      )
      .setColor(0x00ff00);
    
    const confirmMsg = await message.reply({ embeds: [confirmEmbed] });
    
    // Wait for confirmation
    const filter = (m: any) => m.author.id === message.author.id;
    const collected = await (message.channel as any).awaitMessages({
      filter,
      max: 1,
      time: 30000,
      errors: ['time']
    }).catch(() => null);
    
    if (!collected || collected.first()?.content !== 'UNLOCK') {
      const cancelEmbed = defaultEmbed(message.guild)
        .setTitle('Unlock Cancelled')
        .setDescription('Operation cancelled or confirmation not received within 30 seconds.')
        .setColor(0x808080);
      
      await confirmMsg.edit({ embeds: [cancelEmbed] });
      return;
    }
    
    // Start unlocking channels
    const statusEmbed = defaultEmbed(message.guild)
      .setTitle('Unlocking Channels...')
      .setDescription('Removing message restrictions from channels...')
      .setColor(0xffff00);
    
    await confirmMsg.edit({ embeds: [statusEmbed] });
    
    let unlocked = 0;
    let skipped = 0;
    let failed = 0;
    
    // Get @everyone role
    const everyoneRole = message.guild.roles.everyone;
    
    try {
      // Process all text-like channels
      const channels = message.guild.channels.cache.filter(
        (channel): channel is TextChannel | NewsChannel | VoiceChannel =>
          [ChannelType.GuildText, ChannelType.GuildNews, ChannelType.GuildVoice].includes(channel.type as any)
      );
      
      for (const [channelId, channel] of channels) {
        try {
          // Skip ignored channels
          if (ignoredChannels.includes(channelId)) {
            skipped++;
            continue;
          }
          
          // Check if @everyone is currently denied SendMessages
          const currentOverwrite = channel.permissionOverwrites.cache.get(everyoneRole.id);
          
          if (currentOverwrite?.deny.has(PermissionsBitField.Flags.SendMessages)) {
            // Remove the SendMessages denial (unlock)
            await channel.permissionOverwrites.edit(everyoneRole, {
              SendMessages: null, // Remove the explicit denial
            });
            unlocked++;
          } else {
            // Channel wasn't locked, skip it
            skipped++;
          }
          
        } catch (error) {
          console.error(`Failed to unlock channel ${channel.name}:`, error);
          failed++;
        }
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Final status
      const resultEmbed = defaultEmbed(message.guild)
        .setTitle('🔓 Unlock All Complete')
        .setDescription('Channel unlock operation completed.')
        .addFields(
          { name: '✅ Unlocked', value: `${unlocked} channel(s)`, inline: true },
          { name: '⏭️ Skipped', value: `${skipped} channel(s)`, inline: true },
          { name: '❌ Failed', value: `${failed} channel(s)`, inline: true }
        )
        .setColor(unlocked > 0 ? 0x00ff00 : 0x808080)
        .setFooter({ text: 'Channels are now available for @everyone to send messages' });
      
      await confirmMsg.edit({ embeds: [resultEmbed] });
      
    } catch (error) {
      console.error('Unlock all command error:', error);
      
      const errorEmbed = defaultEmbed(message.guild)
        .setTitle('❌ Unlock Failed')
        .setDescription('An error occurred while unlocking channels.')
        .addFields(
          { name: 'Processed', value: `${unlocked} unlocked, ${skipped} skipped, ${failed} failed` },
          { name: 'Error', value: 'Check bot permissions and try again.' }
        )
        .setColor(0xff0000);
      
      await confirmMsg.edit({ embeds: [errorEmbed] });
    }
  },
};

export default command;