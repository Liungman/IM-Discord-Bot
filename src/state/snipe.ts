export type Sniped = {
  content: string;
  authorTag: string;
  attachments: string[];
  createdTimestamp: number;
};

const map = new Map<string, Sniped>(); // channelId -> sniped

export function setSnipe(channelId: string, data: Sniped) {
  map.set(channelId, data);
}

export function getSnipe(channelId: string): Sniped | undefined {
  return map.get(channelId);
}