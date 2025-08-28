import type { Client, Message, PermissionResolvable } from 'discord.js';

export type PrefixCategory = 'fun' | 'utility' | 'moderation' | 'security' | 'afk' | 'embed' | 'music' | 'spotify' | 'voice';

export interface PrefixCommand {
  name: string;
  description: string;
  usage?: string;
  category: PrefixCategory;
  aliases?: string[];
  requiredPermissions?: PermissionResolvable;
  guildOnly?: boolean;
  canonicalName?: string; // Set during registration to track the primary name
  execute: (message: Message, args: string[], client: Client) => Promise<void>;
}