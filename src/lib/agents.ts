
'use client';

import { isSameDay } from 'date-fns';
import type { Agent, Mission, Availability } from './types';

const getDisplayStatus = (mission: Mission): Mission['status'] => {
    const now = new Date();
    const startDate = mission.startDate.toDate();
    const endDate = mission.endDate.toDate();

    if (mission.status === 'Annulée') {
        return 'Annulée';
    }

    if (isSameDay(startDate, endDate) && mission.startTime && mission.endTime) {
        const [startHours, startMinutes] = mission.startTime.split(':').map(Number);
        const [endHours, endMinutes] = mission.endTime.split(':').map(Number);
        const fullStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), startHours, startMinutes);
        const fullEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), endHours, endMinutes);

        if (now > fullEndDate) return 'Terminée';
        if (now < fullStartDate) return 'Planification';
        return 'En cours';
    }
    
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const missionEndDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
     if (today > missionEndDay) {
        return 'Terminée';
    }
    
    const missionStartDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    if (today < missionStartDay) {
        return 'Planification';
    }
    
    return 'En cours';
  };

/**
 * Determines the availability of an agent based on their missions and leave status.
 * An agent is "En congé" if the current date falls within their leave period.
 * An agent is "En mission" if they are assigned to any mission that is 'En cours'.
 * @param agent The agent to check.
 * @param missions A list of all missions.
 * @param excludeMissionId An optional mission ID to exclude from the check (used when editing a mission).
 * @returns The availability status of the agent.
 */
export function getAgentAvailability(agent: Agent, missions: Mission[], excludeMissionId?: string): Availability {
  const now = new Date();
  
  if (agent.leaveStartDate && agent.leaveEndDate) {
    const leaveStart = agent.leaveStartDate.toDate();
    const leaveEnd = agent.leaveEndDate.toDate();
    leaveStart.setHours(0, 0, 0, 0);
    leaveEnd.setHours(23, 59, 59, 999);
    if (now >= leaveStart && now <= leaveEnd) {
      return 'En congé';
    }
  }

  const isAssignedToActiveMission = missions.some(mission => {
    if (mission.id === excludeMissionId) {
      return false;
    }
    
    const isAgentAssigned = mission.assignedAgentIds.includes(agent.id);
    const missionStatus = getDisplayStatus(mission); 
    const isMissionInProgress = missionStatus === 'En cours';

    return isAgentAssigned && isMissionInProgress;
  });

  if (isAssignedToActiveMission) {
    return 'En mission';
  }

  return 'Disponible';
}
