import { Timestamp } from 'firebase/firestore';

export type Agent = {
  id: string;
  firstName: string;
  lastName: string;
  registrationNumber: string;
  rank: string;
  contact: string;
  address: string;
  availability: 'Disponible' | 'En mission' | 'En congé';
};

export type Mission = {
  id: string;
  name: string;
  location: string;
  startDate: Timestamp;
  endDate: Timestamp;
  requiredSkills: string[];
  assignedAgentIds: string[];
  status: 'Planification' | 'En cours' | 'Terminée' | 'Annulée';
};
