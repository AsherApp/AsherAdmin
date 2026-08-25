export type PresenceState = 'online' | 'away' | 'offline';

export const PRESENCE_ONLINE_MS = 5 * 60 * 1000;
export const PRESENCE_AWAY_MS = 20 * 60 * 60 * 1000;

export const PRESENCE_DOT: Record<PresenceState, string> = {
  online: '#22c55e',
  away: '#f97316',
  offline: '#9ca3af',
};

export const PRESENCE_LABEL: Record<PresenceState, string> = {
  online: 'Online',
  away: 'Away',
  offline: 'Offline',
};

export function resolvePresence(input: {
  presence?: string | null;
  lastSeenAt?: string | Date | null;
  onlineStatus?: string | null;
  online?: boolean | null;
}): PresenceState {
  if (input.presence === 'online') return 'online';

  if (input.lastSeenAt) {
    const at =
      input.lastSeenAt instanceof Date
        ? input.lastSeenAt
        : new Date(input.lastSeenAt);
    if (!Number.isNaN(at.getTime())) {
      const age = Date.now() - at.getTime();
      if (age <= PRESENCE_ONLINE_MS) return 'online';
      if (age <= PRESENCE_AWAY_MS) return 'away';
      return 'offline';
    }
  }

  if (input.presence === 'away' || input.presence === 'offline') {
    return input.presence;
  }

  return 'offline';
}
