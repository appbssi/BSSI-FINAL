
import { Timestamp } from 'firebase/firestore';

export type Agent = {
  id: string;
  fullName: string;
  registrationNumber?: string;
  rank: string;
  contact?: string;
  address: string;
  section: 'Armurerie' | 'Administration' | 'Officier' | 'Adjudants' | 'Non assigné';
  onLeave: boolean;
  availability?: Availability;
};

export type Availability = 'Disponible' | 'En mission' | 'En congé';

export type MissionStatus = 'Planification' | 'En cours' | 'Terminée' | 'Annulée';

export type Mission = {
  id: string;
  name: string;
  location: string;
  startDate: Timestamp;
  endDate: Timestamp;
  startTime?: string;
  endTime?: string;
  status: MissionStatus;
  assignedAgentIds: string[];
};

export type Gathering = {
  id: string;
  name: string;
  dateTime: Timestamp;
  assignedAgentIds: string[];
  absentAgentIds: string[];
}

export type Visitor = {
  id: string;
  firstName: string;
  lastName: string;
  contact: string;
  occupation: string;
  entryTime: Timestamp;
  exitTime: Timestamp | null;
}

export type ActivityLog = {
    id: string;
    description: string;
    timestamp: Timestamp;
    type: 'Agent' | 'Mission' | 'Rassemblement' | 'Visiteur' | 'Général';
    link?: string;
}
