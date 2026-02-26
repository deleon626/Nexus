import type { Submission } from '../types';

export interface ConflictResult {
  resolved: boolean;
  winner: 'local' | 'server';
  reason?: string;
}

// Compare versions using timestamps (last-write-wins)
export function compareVersions(local: Submission, server: Submission): ConflictResult {
  const localUpdatedAt = new Date(local.updatedAt).getTime();
  const serverUpdatedAt = new Date(server.updatedAt!).getTime();

  if (localUpdatedAt > serverUpdatedAt) {
    return {
      resolved: true,
      winner: 'local',
      reason: 'Local changes are newer',
    };
  }

  if (serverUpdatedAt > localUpdatedAt) {
    return {
      resolved: true,
      winner: 'server',
      reason: 'Server changes are newer',
    };
  }

  // Timestamps are equal — use server as tiebreaker (server wins ties)
  return {
    resolved: true,
    winner: 'server',
    reason: 'Timestamps equal, server wins tiebreaker',
  };
}

// Resolve conflict by merging or selecting winner
export async function resolveConflict(
  local: Submission,
  server: Submission
): Promise<Submission> {
  const result = compareVersions(local, server);

  if (result.winner === 'local') {
    // Local wins — keep local version
    return { ...local };
  }

  // Server wins — use server version, update local
  return { ...server };
}

// Check if submission needs sync based on version comparison
export function needsSync(local: Submission, server?: Submission): boolean {
  if (!server) {
    return true; // No server version exists, needs sync
  }

  const localUpdatedAt = new Date(local.updatedAt).getTime();
  const serverUpdatedAt = new Date(server.updatedAt!).getTime();

  return localUpdatedAt > serverUpdatedAt;
}
