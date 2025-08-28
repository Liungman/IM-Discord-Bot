import type { EventModule } from '../types/event.js';
import { PermissionFlagsBits, PermissionsBitField } from 'discord.js';
import { getGuildSettings } from '../storage/guildSettings.js';

const LINK_REGEX = /https?:\/\/[^\s]+/gi;
const DISCORD_INVITE_REGEX = /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discordapp\.com\/invite|discord\.com\/invite)\/[^\s]+/gi;

const mod: EventModule = {
  name: 'messageCreate',
  async execute(_client, message) {
    if (!message.guild || message.author.bot) return;
    if (!message.content) return;
    
    const settings = getGuildSettings(message.guild.id);
    
    // Skip if member has Manage Messages permission
    const member = await message.guild.members.fetch(message.author.id).catch(() => null);
    if (member?.permissions.has(PermissionFlagsBits.ManageMessages)) return;
    
    const channelId = message.channelId;
    
    // Check link filter
    const linkConfig = settings.filters?.links?.perChannel?.[channelId];
    if (linkConfig?.enabled && LINK_REGEX.test(message.content)) {
      // Check if user has exempt role
      const hasExemptRole = linkConfig.exemptRoleIds?.some(roleId => 
        member?.roles.cache.has(roleId)
      );
      
      if (!hasExemptRole) {
        // Check if link is whitelisted
        const links = message.content.match(LINK_REGEX) || [];
        const isWhitelisted = links.every((link: string) => 
          linkConfig.whitelist?.some((whitelistedDomain: string) => 
            link.toLowerCase().includes(whitelistedDomain.toLowerCase())
          )
        );
        
        if (!isWhitelisted) {
          try {
            await message.delete();
            
            // Send a temporary notice (auto-delete after 5 seconds)
            if (message.channel && 'send' in message.channel) {
              const notice = await message.channel.send({
                content: `${message.author}, links are not allowed in this channel.`,
                allowedMentions: { users: [message.author.id] }
              });
              
              setTimeout(() => notice.delete().catch(() => {}), 5000);
            }
            
            return; // Don't process other filters if message was deleted
          } catch (error) {
            console.error('Failed to delete message with non-whitelisted link:', error);
          }
        }
      }
    }
    
    // Check invite filter
    const inviteConfig = settings.filters?.invites?.perChannel?.[channelId];
    if (inviteConfig?.enabled && DISCORD_INVITE_REGEX.test(message.content)) {
      // Check if user has exempt role
      const hasExemptRole = inviteConfig.exemptRoleIds?.some(roleId => 
        member?.roles.cache.has(roleId)
      );
      
      if (!hasExemptRole) {
        try {
          await message.delete();
          
          // Send a temporary notice (auto-delete after 5 seconds)
          if (message.channel && 'send' in message.channel) {
            const notice = await message.channel.send({
              content: `${message.author}, Discord invites are not allowed in this channel.`,
              allowedMentions: { users: [message.author.id] }
            });
            
            setTimeout(() => notice.delete().catch(() => {}), 5000);
          }
          
        } catch (error) {
          console.error('Failed to delete message with Discord invite:', error);
        }
      }
    }
  },
};

export default mod;