import type { PrefixCommand } from '../../types/prefixCommand.js';
import { PermissionFlagsBits, ChannelType, PermissionsBitField, type GuildChannel, type TextChannel, type NewsChannel, type VoiceChannel, type Role } from 'discord.js';
import { defaultEmbed } from '../../lib/embeds.js';
import { getGuildSettings, patchGuildSettings } from '../../storage/guildSettings.js';

const lockdownCommand: PrefixCommand = {
  name: 'lockdown',
  description: 'Lock the current channel to prevent @everyone from sending messages.',
  usage: '?lockdown [reason]',
  category: 'security',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ManageChannels,
  async execute(message, args) {
    if (!message.guild || !message.channel) return;
    
    const channel = message.channel as GuildChannel;
    const settings = getGuildSettings(message.guild.id);
    const ignoredChannels = settings.lockdown?.ignoredChannelIds || [];
    
    // Check if this channel is in the ignore list
    if (ignoredChannels.includes(channel.id)) {
      await message.reply('This channel is in the lockdown ignore list and cannot be locked.');
      return;
    }
    
    // Only work with certain channel types
    if (![ChannelType.GuildText, ChannelType.GuildNews, ChannelType.GuildVoice].includes(channel.type)) {
      await message.reply('This command can only be used in text, news, or voice channels.');
      return;
    }
    
    const reason = args.join(' ') || 'No reason provided';
    const targetRole = settings.lockdown?.lockRoleId 
      ? message.guild.roles.cache.get(settings.lockdown.lockRoleId) || message.guild.roles.everyone
      : message.guild.roles.everyone;
    
    try {
      // Apply lockdown (deny SendMessages to the target role)
      await (channel as TextChannel | NewsChannel | VoiceChannel).permissionOverwrites.edit(targetRole, {
        SendMessages: false,
      });
      
      const lockEmbed = defaultEmbed(message.guild)
        .setTitle('🔒 Channel Locked')
        .setDescription(`This channel has been locked by ${message.author.tag}`)
        .addFields(
          { name: 'Channel', value: `${channel}` },
          { name: 'Locked Role', value: `${targetRole}` },
          { name: 'Reason', value: reason }
        )
        .setColor(0xff4500)
        .setTimestamp();
      
      await message.reply({ embeds: [lockEmbed] });
      
    } catch (error) {
      console.error('Lockdown error:', error);
      await message.reply('Failed to lock channel. Make sure I have the Manage Channels permission.');
    }
  },
};

const lockdownAllCommand: PrefixCommand = {
  name: 'lockdown all',
  description: 'Lock all text channels to prevent @everyone from sending messages.',
  usage: '?lockdown all [reason]',
  category: 'security',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ManageChannels,
  async execute(message, args) {
    if (!message.guild) return;
    
    const reason = args.join(' ') || 'Mass lockdown initiated';
    const settings = getGuildSettings(message.guild.id);
    const ignoredChannels = settings.lockdown?.ignoredChannelIds || [];
    
    // Confirm dangerous operation
    const confirmEmbed = defaultEmbed(message.guild)
      .setTitle('🔒 Mass Lockdown Confirmation')
      .setDescription(`This will lock ALL text channels in the server to prevent @everyone from sending messages.`)
      .addFields(
        { name: 'Reason', value: reason },
        { name: 'Ignored Channels', value: ignoredChannels.length > 0 ? `${ignoredChannels.length} channel(s) will be skipped` : 'None' },
        { name: 'Confirmation', value: 'Type `LOCKDOWN` to proceed.' }
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
    
    if (!collected || collected.first()?.content !== 'LOCKDOWN') {
      const cancelEmbed = defaultEmbed(message.guild)
        .setTitle('Lockdown Cancelled')
        .setDescription('Mass lockdown cancelled or confirmation not received within 30 seconds.')
        .setColor(0x808080);
      
      await confirmMsg.edit({ embeds: [cancelEmbed] });
      return;
    }
    
    // Start locking channels
    const statusEmbed = defaultEmbed(message.guild)
      .setTitle('Locking Channels...')
      .setDescription('Applying lockdown to all eligible channels...')
      .setColor(0xffff00);
    
    await confirmMsg.edit({ embeds: [statusEmbed] });
    
    let locked = 0;
    let skipped = 0;
    let failed = 0;
    
    const targetRole = settings.lockdown?.lockRoleId 
      ? message.guild.roles.cache.get(settings.lockdown.lockRoleId) || message.guild.roles.everyone
      : message.guild.roles.everyone;
    
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
          
          // Apply lockdown
          await channel.permissionOverwrites.edit(targetRole, {
            SendMessages: false,
          });
          
          locked++;
          
        } catch (error) {
          console.error(`Failed to lock channel ${channel.name}:`, error);
          failed++;
        }
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Final status
      const resultEmbed = defaultEmbed(message.guild)
        .setTitle('🔒 Mass Lockdown Complete')
        .setDescription('Server lockdown operation completed.')
        .addFields(
          { name: '✅ Locked', value: `${locked} channel(s)`, inline: true },
          { name: '⏭️ Skipped', value: `${skipped} channel(s)`, inline: true },
          { name: '❌ Failed', value: `${failed} channel(s)`, inline: true },
          { name: 'Locked Role', value: `${targetRole}` },
          { name: 'Reason', value: reason }
        )
        .setColor(0xff4500)
        .setFooter({ text: `Use "unlock all" to reverse this lockdown` });
      
      await confirmMsg.edit({ embeds: [resultEmbed] });
      
    } catch (error) {
      console.error('Mass lockdown error:', error);
      
      const errorEmbed = defaultEmbed(message.guild)
        .setTitle('❌ Lockdown Failed')
        .setDescription('An error occurred during mass lockdown.')
        .addFields(
          { name: 'Processed', value: `${locked} locked, ${skipped} skipped, ${failed} failed` },
          { name: 'Error', value: 'Check bot permissions and try again.' }
        )
        .setColor(0xff0000);
      
      await confirmMsg.edit({ embeds: [errorEmbed] });
    }
  },
};

const lockdownRoleCommand: PrefixCommand = {
  name: 'lockdown role',
  description: 'Set which role should be locked during lockdown operations (default: @everyone).',
  usage: '?lockdown role <@role|roleId>',
  category: 'security',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ManageChannels,
  async execute(message, args) {
    if (!message.guild) return;
    
    const roleInput = args[0];
    if (!roleInput) {
      const settings = getGuildSettings(message.guild.id);
      const currentRole = settings.lockdown?.lockRoleId 
        ? message.guild.roles.cache.get(settings.lockdown.lockRoleId)
        : null;
      
      const embed = defaultEmbed(message.guild)
        .setTitle('Lockdown Target Role')
        .setDescription(`Current lockdown target: ${currentRole || '@everyone'}`)
        .addFields({ name: 'Usage', value: '`lockdown role <@role|roleId>` to change target role' });
      
      await message.reply({ embeds: [embed] });
      return;
    }
    
    // Parse role mention or ID
    let role: Role | null = null;
    const roleId = roleInput.replace(/[<@&>]/g, '');
    
    if (message.mentions.roles.size > 0) {
      role = message.mentions.roles.first()!;
    } else {
      role = message.guild.roles.cache.get(roleId) || null;
    }
    
    if (!role) {
      await message.reply('Role not found. Please mention a role or provide a valid role ID.');
      return;
    }
    
    // Update settings
    patchGuildSettings(message.guild.id, ['lockdown', 'lockRoleId'], role.id);
    
    const embed = defaultEmbed(message.guild)
      .setTitle('Lockdown Role Updated')
      .setDescription(`Lockdown operations will now target: ${role}`)
      .addFields({ name: 'Note', value: 'Future lockdown commands will restrict this role instead of @everyone' })
      .setColor(0x00ff00);
    
    await message.reply({ embeds: [embed] });
  },
};

const lockdownIgnoreAddCommand: PrefixCommand = {
  name: 'lockdown ignore add',
  description: 'Add a channel to the lockdown ignore list.',
  usage: '?lockdown ignore add [#channel]',
  category: 'security',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ManageChannels,
  async execute(message, args) {
    if (!message.guild) return;
    
    let targetChannel = message.channel as GuildChannel;
    
    // If a channel is mentioned, use that instead
    if (message.mentions.channels.size > 0) {
      targetChannel = message.mentions.channels.first() as GuildChannel;
    } else if (args[0]) {
      const channelId = args[0].replace(/[<#>]/g, '');
      const foundChannel = message.guild.channels.cache.get(channelId);
      if (foundChannel) {
        targetChannel = foundChannel as GuildChannel;
      }
    }
    
    const settings = getGuildSettings(message.guild.id);
    const ignoredChannels = settings.lockdown?.ignoredChannelIds || [];
    
    if (ignoredChannels.includes(targetChannel.id)) {
      await message.reply(`${targetChannel} is already in the lockdown ignore list.`);
      return;
    }
    
    ignoredChannels.push(targetChannel.id);
    patchGuildSettings(message.guild.id, ['lockdown', 'ignoredChannelIds'], ignoredChannels);
    
    const embed = defaultEmbed(message.guild)
      .setTitle('Ignore List Updated')
      .setDescription(`Added ${targetChannel} to lockdown ignore list.`)
      .addFields({ name: 'Effect', value: 'This channel will be skipped during lockdown operations.' })
      .setColor(0x00ff00);
    
    await message.reply({ embeds: [embed] });
  },
};

const lockdownIgnoreRemoveCommand: PrefixCommand = {
  name: 'lockdown ignore remove',
  description: 'Remove a channel from the lockdown ignore list.',
  usage: '?lockdown ignore remove [#channel]',
  category: 'security',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ManageChannels,
  async execute(message, args) {
    if (!message.guild) return;
    
    let targetChannel = message.channel as GuildChannel;
    
    // If a channel is mentioned, use that instead
    if (message.mentions.channels.size > 0) {
      targetChannel = message.mentions.channels.first() as GuildChannel;
    } else if (args[0]) {
      const channelId = args[0].replace(/[<#>]/g, '');
      const foundChannel = message.guild.channels.cache.get(channelId);
      if (foundChannel) {
        targetChannel = foundChannel as GuildChannel;
      }
    }
    
    const settings = getGuildSettings(message.guild.id);
    const ignoredChannels = settings.lockdown?.ignoredChannelIds || [];
    
    const index = ignoredChannels.indexOf(targetChannel.id);
    if (index === -1) {
      await message.reply(`${targetChannel} is not in the lockdown ignore list.`);
      return;
    }
    
    ignoredChannels.splice(index, 1);
    patchGuildSettings(message.guild.id, ['lockdown', 'ignoredChannelIds'], ignoredChannels);
    
    const embed = defaultEmbed(message.guild)
      .setTitle('Ignore List Updated')
      .setDescription(`Removed ${targetChannel} from lockdown ignore list.`)
      .addFields({ name: 'Effect', value: 'This channel will now be affected by lockdown operations.' })
      .setColor(0x00ff00);
    
    await message.reply({ embeds: [embed] });
  },
};

const lockdownIgnoreListCommand: PrefixCommand = {
  name: 'lockdown ignore list',
  description: 'Show all channels in the lockdown ignore list.',
  usage: '?lockdown ignore list',
  category: 'security',
  guildOnly: true,
  requiredPermissions: PermissionFlagsBits.ManageChannels,
  async execute(message) {
    if (!message.guild) return;
    
    const settings = getGuildSettings(message.guild.id);
    const ignoredChannels = settings.lockdown?.ignoredChannelIds || [];
    
    const embed = defaultEmbed(message.guild)
      .setTitle('Lockdown Ignore List')
      .setColor(0x3498db);
    
    if (ignoredChannels.length === 0) {
      embed.setDescription('No channels are currently ignored during lockdown operations.');
    } else {
      const channelList = ignoredChannels
        .map(id => {
          const channel = message.guild!.channels.cache.get(id);
          return channel ? `${channel}` : `Unknown Channel (${id})`;
        })
        .join('\n');
      
      embed.setDescription(`**${ignoredChannels.length}** channel(s) will be skipped during lockdown:\n\n${channelList}`);
    }
    
    await message.reply({ embeds: [embed] });
  },
};

export const commands: PrefixCommand[] = [
  lockdownCommand,
  lockdownAllCommand,
  lockdownRoleCommand,
  lockdownIgnoreAddCommand,
  lockdownIgnoreRemoveCommand,
  lockdownIgnoreListCommand,
];