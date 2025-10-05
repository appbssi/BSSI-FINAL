
'use client';

import { collection, getDocs, writeBatch, Firestore, doc, deleteDoc } from "firebase/firestore";
import type { Agent } from "./types";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";


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
     batch.commit().catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'agents/[multiple]', // Generic path for batch operation
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  }

  return duplicatesDeleted;
}

export function deleteAgent(firestore: Firestore, agent: Agent) {
    if (!agent) return;
    const agentRef = doc(firestore, 'agents', agent.id);

    deleteDoc(agentRef).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: agentRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
}
