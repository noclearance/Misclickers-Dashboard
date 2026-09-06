import { useMemo } from 'react';
import type { DiscordSessionUser, HubMode } from '../types';

interface UseHubModeResult {
  mode: HubMode;
  isGuest: boolean;
  isMember: boolean;
  isStaff: boolean;
  staffDiscordIds: string[];
}

const parseStaffAllowlist = (rawIds: string | undefined): string[] =>
  (rawIds || '')
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

export const useHubMode = (discordUser: DiscordSessionUser | null): UseHubModeResult => {
  const staffDiscordIds = useMemo(
    () => parseStaffAllowlist(import.meta.env.VITE_STAFF_DISCORD_IDS),
    []
  );

  const isStaff = useMemo(() => {
    if (!discordUser?.id) return false;
    return staffDiscordIds.includes(discordUser.id.trim());
  }, [discordUser?.id, staffDiscordIds]);

  const mode: HubMode = !discordUser ? 'guest' : isStaff ? 'staff' : 'member';

  return {
    mode,
    isGuest: mode === 'guest',
    isMember: mode === 'member',
    isStaff,
    staffDiscordIds,
  };
};
