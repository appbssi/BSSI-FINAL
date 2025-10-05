import { CreateMissionForm } from '@/components/missions/create-mission-form';

export default function CreateMissionPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Create New Mission</h1>
      </div>
      <CreateMissionForm />
    </div>
  );
}
