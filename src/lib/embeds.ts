import { EmbedBuilder, ColorResolvable, Guild } from 'discord.js';
import { Theme } from '../config/theme.js';

export function baseEmbed(color?: ColorResolvable) {
  return new EmbedBuilder()
    .setColor((color as any) ?? Theme.primary)
    .setTimestamp()
    .setFooter({ text: Theme.footer });
}

export function defaultEmbed(guild?: Guild, color?: ColorResolvable) {
  const e = baseEmbed(color ?? Theme.accent);
  if (guild) {
    const icon = guild.iconURL() ?? undefined;
    e.setAuthor({ name: guild.name, iconURL: icon });
  }
  return e;
}

export function infoEmbed(title: string, description?: string) {
  const e = baseEmbed(Theme.accent).setTitle(title);
  if (description) e.setDescription(description);
  return e;
}

export function successEmbed(description: string) {
  return baseEmbed(Theme.success).setDescription(`✅ ${description}`);
}

export function warnEmbed(description: string) {
  return baseEmbed(Theme.warning).setDescription(`⚠️ ${description}`);
}

export function errorEmbed(description: string) {
  return baseEmbed(Theme.danger).setDescription(`❌ ${description}`);
}