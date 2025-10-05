export type Agent = {
  id: string;
  name: string;
  email: string;
  skills: string[];
  availability: 'Available' | 'On Mission' | 'On Leave';
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
  status: 'Planning' | 'Ongoing' | 'Completed' | 'Cancelled';
};
