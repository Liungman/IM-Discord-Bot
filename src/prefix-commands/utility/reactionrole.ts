import type { PrefixCommand } from '../../types/prefixCommand.js';
import { 
  PermissionFlagsBits, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder,
  ComponentType
} from 'discord.js';
import { defaultEmbed, errorEmbed, successEmbed } from '../../lib/embeds.js';
import { getGuildSettings, patchGuildSettings } from '../../storage/guildSettings.js';

const command: PrefixCommand = {
  name: 'reactionrole',
  description: 'Create reaction role messages with buttons.',
  usage: '?reactionrole create <title> | <description> | <role1:emoji1> | <role2:emoji2> [...]',
  category: 'utility',
  aliases: ['rr', 'reactionroles'],
  requiredPermissions: PermissionFlagsBits.ManageRoles,
  guildOnly: true,
  async execute(message, args) {
    if (!message.guild || !message.member) return;

    if (args.length === 0) {
      await message.reply({ 
        embeds: [errorEmbed(
          'Usage:\n' +
          '`?reactionrole create <title> | <description> | <@role1:emoji1> | <@role2:emoji2>`\n' +
          'Example: `?reactionrole create Choose Roles | Pick your favorite color! | @Red:🔴 | @Blue:🔵`'
        )] 
      });
      return;
    }

    const subcommand = args[0].toLowerCase();

    if (subcommand === 'create') {
      if (args.length < 2) {
        await message.reply({ embeds: [errorEmbed('Please provide the reaction role setup.')] });
        return;
      }

      const content = args.slice(1).join(' ');
      const parts = content.split('|').map(part => part.trim());

      if (parts.length < 4) {
        await message.reply({ 
          embeds: [errorEmbed('Format: `title | description | @role1:emoji1 | @role2:emoji2`')] 
        });
        return;
      }

      const title = parts[0];
      const description = parts[1];
      const rolePairs = parts.slice(2);

      if (rolePairs.length > 25) {
        await message.reply({ embeds: [errorEmbed('Maximum 25 roles allowed per reaction role message.')] });
        return;
      }

      // Parse role-emoji pairs
      const roleData: { roleId: string; emoji: string; roleName: string }[] = [];
      
      for (const pair of rolePairs) {
        const colonIndex = pair.lastIndexOf(':');
        if (colonIndex === -1) {
          await message.reply({ embeds: [errorEmbed(`Invalid format for: "${pair}". Use @role:emoji`)] });
          return;
        }

        const roleStr = pair.substring(0, colonIndex).trim();
        const emoji = pair.substring(colonIndex + 1).trim();

        if (!roleStr || !emoji) {
          await message.reply({ embeds: [errorEmbed(`Invalid format for: "${pair}". Use @role:emoji`)] });
          return;
        }

        // Extract role ID from mention
        const roleId = roleStr.replace(/[<@&>]/g, '');
        const role = message.guild.roles.cache.get(roleId);

        if (!role) {
          await message.reply({ embeds: [errorEmbed(`Role not found: ${roleStr}`)] });
          return;
        }

        // Check if bot can assign this role
        const botMember = message.guild.members.me;
        if (!botMember || !botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
          await message.reply({ embeds: [errorEmbed('I need the Manage Roles permission!')] });
          return;
        }

        if (role.position >= botMember.roles.highest.position) {
          await message.reply({ embeds: [errorEmbed(`I cannot assign ${role.name} - it's higher than my highest role.`)] });
          return;
        }

        roleData.push({ roleId: role.id, emoji, roleName: role.name });
      }

      // Create embed
      const embed = defaultEmbed(message.guild)
        .setTitle(title)
        .setDescription(
          description + '\n\n' +
          roleData.map(r => `${r.emoji} ${r.roleName}`).join('\n')
        )
        .setFooter({ text: 'Click a button to toggle the role' });

      // Create buttons (up to 5 per row, max 5 rows)
      const rows: ActionRowBuilder<ButtonBuilder>[] = [];
      for (let i = 0; i < roleData.length; i += 5) {
        const row = new ActionRowBuilder<ButtonBuilder>();
        for (let j = i; j < Math.min(i + 5, roleData.length); j++) {
          const roleInfo = roleData[j];
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`role_${roleInfo.roleId}`)
              .setLabel(roleInfo.roleName)
              .setEmoji(roleInfo.emoji)
              .setStyle(ButtonStyle.Secondary)
          );
        }
        rows.push(row);
        
        if (rows.length >= 5) break; // Max 5 rows
      }

      if (!message.channel || !('send' in message.channel)) {
        await message.reply({ embeds: [errorEmbed('This command can only be used in text channels.')] });
        return;
      }

      const reactionRoleMessage = await message.channel.send({
        embeds: [embed],
        components: rows
      });

      // Store the reaction role configuration
      const settings = getGuildSettings(message.guild.id);
      const roleMapping: Record<string, string> = {};
      roleData.forEach(r => {
        roleMapping[r.emoji] = r.roleId;
      });

      patchGuildSettings(message.guild.id, 
        ['reactionRoles', 'messages', reactionRoleMessage.id], 
        {
          channelId: message.channel.id,
          messageId: reactionRoleMessage.id,
          roles: roleMapping,
          type: 'buttons'
        }
      );

      // Set up persistent button handler
      const collector = reactionRoleMessage.createMessageComponentCollector({
        componentType: ComponentType.Button,
        // No time limit - this should persist
      });

      collector.on('collect', async (interaction: any) => {
        if (!interaction.isButton() || !interaction.member) return;

        const roleId = interaction.customId.replace('role_', '');
        const role = interaction.guild?.roles.cache.get(roleId);

        if (!role) {
          await interaction.reply({ 
            content: 'This role no longer exists.', 
            ephemeral: true 
          });
          return;
        }

        try {
          const memberHasRole = interaction.member.roles.cache.has(roleId);
          
          if (memberHasRole) {
            await interaction.member.roles.remove(roleId);
            await interaction.reply({ 
              content: `✅ Removed the ${role.name} role.`, 
              ephemeral: true 
            });
          } else {
            await interaction.member.roles.add(roleId);
            await interaction.reply({ 
              content: `✅ Added the ${role.name} role.`, 
              ephemeral: true 
            });
          }
        } catch (error) {
          await interaction.reply({ 
            content: 'Failed to update your roles. The bot may be missing permissions.', 
            ephemeral: true 
          });
        }
      });

      await message.reply({ embeds: [successEmbed('Reaction role message created!')] });

    } else {
      await message.reply({ embeds: [errorEmbed('Invalid subcommand. Use: create')] });
    }
  },
};

export default command;