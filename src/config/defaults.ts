export const DefaultSettings = {
  autoDeleteMs: 15000,
  antiNuke: {
    enabled: true,
    windowMs: 5 * 60 * 1000,
    thresholds: {
      ChannelCreate: 5,
      ChannelDelete: 3,
      RoleCreate: 5,
      RoleDelete: 3,
      MemberBanAdd: 5,
    } as Record<string, number>,
    action: { type: 'timeout', ms: 60 * 60 * 1000 } as { type: 'timeout'; ms: number },
    logChannelId: '' as string,
  },
};