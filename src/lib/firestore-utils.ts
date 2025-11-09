
'use client';

import { collection, getDocs, writeBatch, Firestore, doc, deleteDoc, WriteBatch, query, orderBy } from "firebase/firestore";
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

export async function deleteDuplicateAgentsByName(firestore: Firestore): Promise<number> {
  const agentsRef = collection(firestore, 'agents');
  // Order by fullName to process duplicates together, and by a timestamp if you have one.
  // Assuming no creation timestamp, we'll fetch all and process in memory.
  const snapshot = await getDocs(agentsRef);
  
  const agentsByName = new Map<string, Agent[]>();

  // Group agents by full name
  snapshot.docs.forEach(docSnap => {
    const agent = { id: docSnap.id, ...docSnap.data() } as Agent;
    if (agent.fullName) {
      const existing = agentsByName.get(agent.fullName) || [];
      existing.push(agent);
      agentsByName.set(agent.fullName, existing);
    }
  });

  const batch = writeBatch(firestore);
  let duplicatesDeleted = 0;

  for (const [name, agents] of agentsByName.entries()) {
    if (agents.length > 1) {
      // For simplicity, we keep the first one fetched.
      // A better approach would be to sort by a creation date if available.
      // Here, we just mark all but the first one for deletion.
      const agentsToDelete = agents.slice(1);
      
      for (const agentToDelete of agentsToDelete) {
        const docRef = doc(firestore, 'agents', agentToDelete.id);
        batch.delete(docRef);
        duplicatesDeleted++;
      }
    }
  }

  if (duplicatesDeleted > 0) {
    await batch.commit().catch(serverError => {
      const permissionError = new FirestorePermissionError({
        path: 'agents/[batch]',
        operation: 'delete',
        requestResourceData: { info: "Batch delete for name deduplication" },
      });
      errorEmitter.emit('permission-error', permissionError);
      // Rethrow to be caught by the calling function
      throw serverError;
    });
     logActivity(firestore, `${duplicatesDeleted} agent(s) en double par nom ont été supprimés.`, 'Agent', '/agents');
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
        logActivity(firestore, `L'agent ${agent.fullName} a été supprimé.`, 'Agent', '/agents');
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: agentRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
}

    