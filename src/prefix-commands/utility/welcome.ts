import type { PrefixCommand } from '../../types/prefixCommand.js';
import { PermissionFlagsBits, ChannelType } from 'discord.js';
import { defaultEmbed, errorEmbed, successEmbed } from '../../lib/embeds.js';
import { getGuildSettings, patchGuildSettings } from '../../storage/guildSettings.js';

const command: PrefixCommand = {
  name: 'welcome',
  description: 'Configure welcome and leave messages for new members.',
  usage: '?welcome [enable|disable|channel|message|leave] [value]',
  category: 'utility',
  aliases: ['welcomemsg', 'greet'],
  requiredPermissions: PermissionFlagsBits.ManageGuild,
  guildOnly: true,
  async execute(message, args) {
    if (!message.guild) return;

    const settings = getGuildSettings(message.guild.id);

    if (args.length === 0) {
      // Show current welcome settings
      const embed = defaultEmbed(message.guild)
        .setTitle('👋 Welcome & Leave Settings')
        .addFields(
          { name: 'Status', value: settings.welcomeLeave.enabled ? '✅ Enabled' : '❌ Disabled' },
          { 
            name: 'Welcome Channel', 
            value: settings.welcomeLeave.welcomeChannelId ? `<#${settings.welcomeLeave.welcomeChannelId}>` : 'Not set' 
          },
          { 
            name: 'Leave Channel', 
            value: settings.welcomeLeave.leaveChannelId ? `<#${settings.welcomeLeave.leaveChannelId}>` : 'Same as welcome' 
          },
          { name: 'Welcome Message', value: `\`${settings.welcomeLeave.welcomeMessage}\`` },
          { name: 'Leave Message', value: `\`${settings.welcomeLeave.leaveMessage}\`` },
          { name: 'DM Welcome', value: settings.welcomeLeave.dmWelcome ? '✅ Enabled' : '❌ Disabled' }
        )
        .setFooter({ text: 'Variables: {user} = mention, {username} = name, {server} = server name' });
      
      await message.reply({ embeds: [embed] });
      return;
    }

    const subcommand = args[0].toLowerCase();

    switch (subcommand) {
      case 'enable':
        if (!settings.welcomeLeave.welcomeChannelId) {
          await message.reply({ embeds: [errorEmbed('Please set a welcome channel first using `?welcome channel #channel`')] });
          return;
        }
        patchGuildSettings(message.guild.id, ['welcomeLeave', 'enabled'], true);
        await message.reply({ embeds: [successEmbed('Welcome system enabled!')] });
        break;

      case 'disable':
        patchGuildSettings(message.guild.id, ['welcomeLeave', 'enabled'], false);
        await message.reply({ embeds: [successEmbed('Welcome system disabled.')] });
        break;

      case 'channel':
        if (args.length < 2) {
          await message.reply({ embeds: [errorEmbed('Please mention a channel: `?welcome channel #general`')] });
          return;
        }

        const channelMention = args[1];
        const channelId = channelMention.replace(/[<#>]/g, '');
        const channel = message.guild.channels.cache.get(channelId);

        if (!channel || channel.type !== ChannelType.GuildText) {
          await message.reply({ embeds: [errorEmbed('Please provide a valid text channel.')] });
          return;
        }

        patchGuildSettings(message.guild.id, ['welcomeLeave', 'welcomeChannelId'], channel.id);
        await message.reply({ embeds: [successEmbed(`Welcome channel set to ${channel}`)] });
        break;

      case 'leavechannel':
        if (args.length < 2) {
          await message.reply({ embeds: [errorEmbed('Please mention a channel: `?welcome leavechannel #general`')] });
          return;
        }

        const leaveChannelMention = args[1];
        const leaveChannelId = leaveChannelMention.replace(/[<#>]/g, '');
        const leaveChannel = message.guild.channels.cache.get(leaveChannelId);

        if (!leaveChannel || leaveChannel.type !== ChannelType.GuildText) {
          await message.reply({ embeds: [errorEmbed('Please provide a valid text channel.')] });
          return;
        }

        patchGuildSettings(message.guild.id, ['welcomeLeave', 'leaveChannelId'], leaveChannel.id);
        await message.reply({ embeds: [successEmbed(`Leave channel set to ${leaveChannel}`)] });
        break;

      case 'message':
      case 'welcomemessage':
        if (args.length < 2) {
          await message.reply({ embeds: [errorEmbed('Please provide a welcome message: `?welcome message Welcome {user} to {server}!`')] });
          return;
        }

        const welcomeMessage = args.slice(1).join(' ');
        if (welcomeMessage.length > 2000) {
          await message.reply({ embeds: [errorEmbed('Welcome message must be under 2000 characters.')] });
          return;
        }

        patchGuildSettings(message.guild.id, ['welcomeLeave', 'welcomeMessage'], welcomeMessage);
        await message.reply({ embeds: [successEmbed(`Welcome message updated:\n\`${welcomeMessage}\``)] });
        break;

      case 'leavemessage':
        if (args.length < 2) {
          await message.reply({ embeds: [errorEmbed('Please provide a leave message: `?welcome leavemessage {user} has left {server}.`')] });
          return;
        }

        const leaveMessage = args.slice(1).join(' ');
        if (leaveMessage.length > 2000) {
          await message.reply({ embeds: [errorEmbed('Leave message must be under 2000 characters.')] });
          return;
        }

        patchGuildSettings(message.guild.id, ['welcomeLeave', 'leaveMessage'], leaveMessage);
        await message.reply({ embeds: [successEmbed(`Leave message updated:\n\`${leaveMessage}\``)] });
        break;

      case 'dm':
      case 'dmwelcome':
        const enableDm = args[1]?.toLowerCase() !== 'false';
        patchGuildSettings(message.guild.id, ['welcomeLeave', 'dmWelcome'], enableDm);
        
        if (enableDm && args.length > 2) {
          const dmMessage = args.slice(2).join(' ');
          patchGuildSettings(message.guild.id, ['welcomeLeave', 'dmWelcomeMessage'], dmMessage);
          await message.reply({ 
            embeds: [successEmbed(`DM welcome enabled with message:\n\`${dmMessage}\``)] 
          });
        } else {
          await message.reply({ 
            embeds: [successEmbed(`DM welcome ${enableDm ? 'enabled' : 'disabled'}.`)] 
          });
        }
        break;

      case 'test':
        // Test the welcome message
        if (!settings.welcomeLeave.enabled || !settings.welcomeLeave.welcomeChannelId) {
          await message.reply({ embeds: [errorEmbed('Welcome system is not properly configured.')] });
          return;
        }

        const testChannel = message.guild.channels.cache.get(settings.welcomeLeave.welcomeChannelId);
        if (testChannel && testChannel.isTextBased()) {
          const testMessage = settings.welcomeLeave.welcomeMessage
            .replace(/{user}/g, message.author.toString())
            .replace(/{username}/g, message.author.username)
            .replace(/{server}/g, message.guild.name);

          await testChannel.send(`🧪 **Test Welcome Message:**\n${testMessage}`);
          await message.reply({ embeds: [successEmbed('Test welcome message sent!')] });
        } else {
          await message.reply({ embeds: [errorEmbed('Welcome channel is not accessible.')] });
        }
        break;

      default:
        await message.reply({ 
          embeds: [errorEmbed('Invalid subcommand. Use: enable, disable, channel, leavechannel, message, leavemessage, dm, or test')] 
        });
    }
  },
};

export default command;