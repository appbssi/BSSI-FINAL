
'use client';

import type { Agent, Mission, Availability } from './types';
import { isSameDay } from 'date-fns';

/**
 * Determines the availability of an agent based on their missions.
 * An agent is only "En mission" if they are assigned to a mission with the status "En cours".
 * @param agent The agent to check.
 * @param missions A list of all missions.
 * @param excludeMissionId An optional mission ID to exclude from the check (used when editing a mission).
 * @returns The availability status of the agent.
 */
export function getAgentAvailability(agent: Agent, missions: Mission[], excludeMissionId?: string): Availability {
  if (agent.onLeave) {
    return 'En congé';
  }

  const isAssignedToActiveMission = missions.some(mission => {
    if (mission.id === excludeMissionId) {
      return false;
    }
    
    // An agent is only considered "En mission" if assigned to a mission that is currently "En cours".
    if (mission.status === 'En cours' && mission.assignedAgentIds.includes(agent.id)) {
      return true;
    }

    return false;
  });

  if (isAssignedToActiveMission) {
    return 'En mission';
  }

  return 'Disponible';
}

    