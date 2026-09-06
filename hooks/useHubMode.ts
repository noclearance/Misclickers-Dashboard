import { useMemo } from 'react';
import type { DiscordSessionUser, HubMode } from '../types';

interface UseHubModeResult {
  mode: HubMode;
  isGuest: boolean;
  isMember: boolean;
  isStaff: boolean;
  staffRoleIds: string[];
}

const parseStaffAllowlist = (rawIds: string | undefined): string[] =>
  (rawIds || '')
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

export const useHubMode = (discordUser: DiscordSessionUser | null): UseHubModeResult => {
  const staffRoleIds = useMemo(
    () => parseStaffAllowlist(import.meta.env.VITE_STAFF_ROLE_IDS),
    []
  );

  const isStaff = useMemo(() => {
    if (!discordUser) return false;
    if (staffRoleIds.length === 0) return false;

    const userRoleIds = (discordUser.roleIds || []).map((id) => id.trim()).filter(Boolean);
    if (userRoleIds.length === 0) return false;

    return userRoleIds.some((roleId) => staffRoleIds.includes(roleId));
  }, [discordUser, staffRoleIds]);

  const mode: HubMode = !discordUser ? 'guest' : isStaff ? 'staff' : 'member';

  return {
    mode,
    isGuest: mode === 'guest',
    isMember: mode === 'member',
    isStaff,
    staffRoleIds,
  };
};
