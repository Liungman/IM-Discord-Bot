export const DefaultSettings = {
  prefix: '?',
  autoDeleteMs: 15000,
  gradient: {
    position: 'none' as 'top' | 'bottom' | 'thumbnail-bar' | 'none',
    startColor: '#1e40af', // deep blue
    endColor: '#000000', // black
  },
  lockdown: {
    ignoredChannelIds: [] as string[],
    lockRoleId: '',
  },
  filters: {
    links: {
      enabled: false,
      perChannel: {} as Record<string, { enabled: boolean; whitelist: string[]; exemptRoleIds: string[] }>,
    },
    invites: {
      enabled: false,
      perChannel: {} as Record<string, { enabled: boolean; exemptRoleIds: string[] }>,
    },
  },
  antiRaid: {
    enabled: true,
    windowMs: 60_000,
    joinThreshold: 8,
    action: { type: 'lockdown', minutes: 10 },
    logChannelId: '',
  },
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