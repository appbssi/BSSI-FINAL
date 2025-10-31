
'use client';

import { collection, getDocs, writeBatch, Firestore, doc, deleteDoc, WriteBatch } from "firebase/firestore";
import type { Agent, Mission } from "./types";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { logActivity } from "./activity-logger";


/**
 * Finds and deletes duplicate agents from Firestore based on the registrationNumber.
 * @param firestore - The Firestore instance.
 * @returns The number of duplicate documents deleted.
 */
export async function deleteDuplicateAgents(firestore: Firestore): Promise<number> {
  const agentsRef = collection(firestore, 'agents');
  const snapshot = await getDocs(agentsRef);
  const agents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Agent));

  const registrationMap = new Map<string, string[]>();

  // Group agents by registration number
  for (const agent of agents) {
    if (agent.registrationNumber) {
      if (!registrationMap.has(agent.registrationNumber)) {
        registrationMap.set(agent.registrationNumber, []);
      }
      registrationMap.get(agent.registrationNumber)!.push(agent.id);
    }
  }

  const batch = writeBatch(firestore);
  let duplicatesDeleted = 0;

  // Identify and mark duplicates for deletion
  for (const [registrationNumber, ids] of registrationMap.entries()) {
    if (ids.length > 1) {
      // Keep the first one, delete the rest
      const idsToDelete = ids.slice(1);
      for (const id of idsToDelete) {
        const docRef = doc(firestore, 'agents', id);
        batch.delete(docRef);
        duplicatesDeleted++;
      }
    }
  }

  // Commit the deletions if any
  if (duplicatesDeleted > 0) {
     batch.commit().then(() => {
        logActivity(firestore, `${duplicatesDeleted} agent(s) en double ont été supprimés.`, 'Agent', '/agents');
     }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'agents/[multiple]', // Generic path for batch operation
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  }

  return duplicatesDeleted;
}

export function deleteAgent(firestore: Firestore, agent: Agent, missions: Mission[]) {
    if (!agent) return;

    const batch = writeBatch(firestore);
    const agentRef = doc(firestore, 'agents', agent.id);

    // Remove agent from all missions they are assigned to
    missions.forEach(mission => {
        if (mission.assignedAgentIds.includes(agent.id)) {
            const missionRef = doc(firestore, 'missions', mission.id);
            const updatedAgentIds = mission.assignedAgentIds.filter(id => id !== agent.id);
            batch.update(missionRef, { assignedAgentIds: updatedAgentIds });
        }
    });
    
    batch.delete(agentRef);

    batch.commit().then(() => {
        logActivity(firestore, `L'agent ${agent.firstName} ${agent.lastName} a été supprimé.`, 'Agent', '/agents');
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: agentRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
}
