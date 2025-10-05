import { Timestamp } from 'firebase/firestore';

export type Agent = {
  id: string;
  name: string;
  matricule: string;
  grade: string;
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
