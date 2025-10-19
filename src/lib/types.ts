import { Timestamp } from 'firebase/firestore';

export type Agent = {
  id: string;
  firstName: string;
  lastName: string;
  registrationNumber: string;
  rank: string;
  contact: string;
  address: string;
  onLeave: boolean;
};

export type Availability = 'Disponible' | 'En mission' | 'En congé';

export type Mission = {
  id: string;
  name: string;
  location: string;
  startDate: Timestamp;
  endDate: Timestamp;
  status: 'Planification' | 'En cours' | 'Terminée' | 'Annulée';
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
  exitTime?: Timestamp;
}
