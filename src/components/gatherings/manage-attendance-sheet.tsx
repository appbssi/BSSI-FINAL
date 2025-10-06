
'use client';

import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormMessage,
} from '@/components/ui/form';
import { Loader2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { useFirestore, errorEmitter } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import type { Agent, Gathering } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';

const attendanceSchema = z.object({
  absentAgentIds: z.array(z.string()),
});

type AttendanceFormValues = z.infer<typeof attendanceSchema>;

interface ManageAttendanceSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  gathering: Gathering;
  agents: Agent[];
}

export function ManageAttendanceSheet({ isOpen, onOpenChange, gathering, agents }: ManageAttendanceSheetProps) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      absentAgentIds: gathering.absentAgentIds || [],
    },
  });

  useEffect(() => {
    form.reset({
        absentAgentIds: gathering.absentAgentIds || [],
    });
  }, [gathering, form, isOpen]);

  const { isSubmitting } = form.formState;

  const assignedAgents = useMemo(() => {
    const agentMap = new Map(agents.map(agent => [agent.id, agent]));
    return gathering.assignedAgentIds
      .map(id => agentMap.get(id))
      .filter((agent): agent is Agent => !!agent)
      .sort((a, b) => a.firstName.localeCompare(b.firstName) || a.lastName.localeCompare(b.lastName));
  }, [agents, gathering.assignedAgentIds]);

  const onSubmit = async (data: AttendanceFormValues) => {
    if (!firestore) return;

    const gatheringRef = doc(firestore, 'gatherings', gathering.id);
    const updateData = { absentAgentIds: data.absentAgentIds };
    
    updateDoc(gatheringRef, updateData).then(() => {
        toast({
            title: "Présences mises à jour !",
            description: `La liste des absents pour "${gathering.name}" a été enregistrée.`,
        });
        onOpenChange(false);
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: gatheringRef.path,
            operation: 'update',
            requestResourceData: updateData,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto w-full max-w-lg sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Gérer les présences</SheetTitle>
          <SheetDescription>
            Cochez les agents absents pour le rassemblement "{gathering.name}".
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">
            <Controller
              control={form.control}
              name="absentAgentIds"
              render={({ field }) => (
                <div className="space-y-2">
                  <div className="rounded-lg border">
                    <ScrollArea className="h-96">
                      <div className="p-4 space-y-2">
                        {assignedAgents.length > 0 ? (
                          assignedAgents.map((agent) => {
                            const isChecked = field.value?.includes(agent.id);
                            return (
                              <div
                                key={agent.id}
                                className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                onClick={() => {
                                  const currentValues = field.value || [];
                                  const newValue = isChecked
                                    ? currentValues.filter((id) => id !== agent.id)
                                    : [...currentValues, agent.id];
                                  field.onChange(newValue);
                                }}
                              >
                                <div className={cn("h-5 w-5 flex items-center justify-center rounded border", isChecked ? "bg-destructive text-destructive-foreground border-destructive" : "border-muted-foreground/50")}>
                                  {isChecked && <Check className="h-4 w-4" />}
                                </div>
                                <div className="font-medium flex-1">
                                  {agent.firstName} {agent.lastName}
                                  <div className="text-sm text-muted-foreground">{agent.rank}</div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-center text-muted-foreground p-8">Aucun agent assigné à ce rassemblement.</p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                  <FormMessage />
                </div>
              )}
            />
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer les présences
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
