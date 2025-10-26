
import type { Agent, Mission, Availability } from './types';
import { isSameDay } from 'date-fns';

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

  const now = new Date();

  const isAssignedToActiveMission = missions.some(mission => {
    if (mission.id === excludeMissionId) {
      return false;
    }
    
    // An active mission is one that is currently happening
    const startDate = mission.startDate.toDate();
    const endDate = mission.endDate.toDate();
    
    // Consider time for single-day missions
    if (isSameDay(startDate, endDate) && mission.startTime && mission.endTime) {
        const [startHours, startMinutes] = mission.startTime.split(':').map(Number);
        const [endHours, endMinutes] = mission.endTime.split(':').map(Number);
        const fullStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), startHours, startMinutes);
        const fullEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), endHours, endMinutes);
        
        if (now >= fullStartDate && now <= fullEndDate && mission.assignedAgentIds.includes(agent.id)) {
            return true;
        }
    }

    // For multi-day missions, ignore time part, just check date
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if(today >= startDate && today <= endDate && mission.status !== 'Terminée' && mission.status !== 'Annulée' && mission.assignedAgentIds.includes(agent.id)) {
        return true;
    }

    return false;
  });

  if (isAssignedToActiveMission) {
    return 'En mission';
  }

  return 'Disponible';
}

    