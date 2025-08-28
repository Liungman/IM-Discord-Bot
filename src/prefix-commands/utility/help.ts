import type { PrefixCommand } from '../../types/prefixCommand.js';
import { PermissionsBitField } from 'discord.js';
import { defaultEmbed } from '../../lib/embeds.js';
import { getGuildSettings } from '../../storage/guildSettings.js';
import { DefaultSettings } from '../../config/defaults.js';

function canUse(member: any, command: PrefixCommand, guild: any): boolean {
  // Guild-only commands require a guild
  if (command.guildOnly && !guild) return false;
  
  // If no permissions required, user can use it
  if (!command.requiredPermissions) return true;
  
  // If no member (DM context), can't check permissions
  if (!member) return false;
  
  // Check if member has required permissions
  return member.permissions.has(new PermissionsBitField(command.requiredPermissions));
}

const command: PrefixCommand = {
  name: 'help',
  description: 'Show command list or details for a command.',
  usage: '?help [command]',
  category: 'utility',
  aliases: ['h'],
  async execute(message, args, client) {
    const registry = (client as any).prefixCommands as Map<string, PrefixCommand>;
    const canonicalRegistry = (client as any).canonicalCommands as Map<string, PrefixCommand>;
    const name = (args[0] || '').toLowerCase();
    
    // Get dynamic prefix
    const settings = message.guild ? getGuildSettings(message.guild.id) : null;
    const prefix = settings?.prefix ?? DefaultSettings.prefix;
    
    // Get member for permission checking
    const member = message.guild ? await message.guild.members.fetch(message.author.id).catch(() => null) : null;

    if (!name) {
      const byCat = new Map<string, PrefixCommand[]>();
      
      // Use canonical commands to avoid duplicates
      const commandSource = canonicalRegistry || registry;
      
      // Filter commands by what the user can actually use
      for (const cmd of commandSource.values()) {
        if (!canUse(member, cmd, message.guild)) continue;
        
        if (!byCat.has(cmd.category)) byCat.set(cmd.category, []);
        byCat.get(cmd.category)!.push(cmd);
      }
      
      const e = defaultEmbed(message.guild ?? undefined).setTitle('Help - Available Commands');
      
      for (const [cat, cmds] of byCat) {
        // Sort commands by name for consistent display
        const sortedCmds = cmds.sort((a, b) => a.name.localeCompare(b.name));
        const commandList = sortedCmds
          .map((c) => `${prefix}${c.name}`)
          .join(', ')
          .slice(0, 1000) || '—';
        e.addFields({ name: cat.toUpperCase(), value: commandList });
      }
      
      e.setFooter({ text: `Use ${prefix}help <command> for details about a specific command` });
      await message.reply({ embeds: [e] });
      return;
    }

    const cmd = registry.get(name);
    if (!cmd) {
      await message.reply({ content: 'Command not found.' });
      return;
    }
    
    // Check if user can actually use this command
    if (!canUse(member, cmd, message.guild)) {
      await message.reply({ content: 'You do not have permission to view this command.' });
      return;
    }
    
    const e = defaultEmbed(message.guild ?? undefined)
      .setTitle(`${prefix}${cmd.name}`)
      .setDescription(cmd.description)
      .addFields(
        ...(cmd.usage ? [{ name: 'Usage', value: cmd.usage.replace(/^\?/, prefix) }] : []),
        { name: 'Category', value: cmd.category },
        ...(cmd.aliases && cmd.aliases.length > 0 ? [{ 
          name: 'Aliases', 
          value: cmd.aliases.map(a => `${prefix}${a}`).join(', ') 
        }] : [])
      );
    
    if (cmd.requiredPermissions) {
      const perms = new PermissionsBitField(cmd.requiredPermissions);
      e.addFields({ name: 'Required Permissions', value: perms.toArray().join(', ') });
    }
    
    if (cmd.guildOnly) {
      e.addFields({ name: 'Server Only', value: 'This command can only be used in servers' });
    }
    
    await message.reply({ embeds: [e] });
  },
};

export default command;