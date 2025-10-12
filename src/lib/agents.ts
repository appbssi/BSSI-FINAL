import type { Agent, Mission, Availability } from './types';

/**
 * Determines the availability of an agent based on their missions.
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
    
    const isActive = mission.status === 'En cours' || mission.status === 'Planification';
    return isActive && mission.assignedAgentIds.includes(agent.id);
  });

  if (isAssignedToActiveMission) {
    return 'En mission';
  }

  return 'Disponible';
}
