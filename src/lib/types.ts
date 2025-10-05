export type Agent = {
  id: string;
  name: string;
  email: string;
  skills: string[];
  availability: 'Disponible' | 'En mission' | 'En congé';
  avatarUrl: string;
};

export type Mission = {
  id: string;
  name: string;
  location: string;
  startDate: Date;
  endDate: Date;
  requiredSkills: string[];
  assignedAgents: Agent[];
  status: 'Planification' | 'En cours' | 'Terminée' | 'Annulée';
};
