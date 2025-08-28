export type ParsedEmoji =
  | { animated: boolean; id: string; name?: string }
  | { unicode: string }
  | null;

export function parseEmoji(input: string): ParsedEmoji {
  if (!input) return null;
  const m = /<a?:([a-zA-Z0-9_~]+):(\d{13,})>/.exec(input);
  if (m) return { animated: input.startsWith('<a:'), name: m[1], id: m[2] } as any;
  const trimmed = input.trim();
  if (trimmed) return { unicode: trimmed } as any;
  return null;
}

export function emojiCdnUrl(id: string, animated: boolean) {
  return `https://cdn.discordapp.com/emojis/${id}.${animated ? 'gif' : 'png'}?size=256&quality=lossless`;
}

export function twemojiPngUrl(unicode: string) {
  const codepoints = Array.from(unicode)
    .map((c) => c.codePointAt(0)!.toString(16))
    .join('-');
  return `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${codepoints}.svg`;
}