import type { Client, Message, PermissionResolvable } from 'discord.js';

export type PrefixCategory = 'fun' | 'utility' | 'moderation' | 'security' | 'afk' | 'embed';

export interface PrefixCommand {
  name: string;
  description: string;
  usage?: string;
  category: PrefixCategory;
  requiredPermissions?: PermissionResolvable;
  guildOnly?: boolean;
  execute: (message: Message, args: string[], client: Client) => Promise<void>;
}