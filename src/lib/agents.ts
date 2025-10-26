
'use client';

import type { Agent, Mission, Availability } from './types';

/**
 * Determines the availability of an agent based on their missions.
 * An agent is "En mission" if they are assigned to any mission that is 'En cours' or 'Planification'.
 * @param agent The agent to check.
 * @param missions A list of all missions.
 * @param excludeMissionId An optional mission ID to exclude from the check (used when editing a mission).
 * @returns The availability status of the agent.
 */
export function getAgentAvailability(agent: Agent, missions: Mission[], excludeMissionId?: string): Availability {
  if (agent.onLeave) {
    return 'En congé';
  }

  const isAssignedToActiveOrPlannedMission = missions.some(mission => {
    // Exclude the specified mission if an ID is provided
    if (mission.id === excludeMissionId) {
      return false;
    }
    
    // Check if the agent is assigned and the mission status is relevant
    const isAgentAssigned = mission.assignedAgentIds.includes(agent.id);
    const isMissionActiveOrPlanned = mission.status === 'En cours' || mission.status === 'Planification';

    return isAgentAssigned && isMissionActiveOrPlanned;
  });

  if (isAssignedToActiveOrPlannedMission) {
    return 'En mission';
  }

  return 'Disponible';
}
