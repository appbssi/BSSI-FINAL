
import { collection, getDocs, writeBatch, Firestore, doc, addDoc, serverTimestamp } from "firebase/firestore";
import type { Agent } from "./types";

/**
 * Logs an activity to the activity_logs collection.
 * @param firestore - The Firestore instance.
 * @param action - A description of the action performed.
 * @param entity - The type of entity affected (e.g., 'Agent', 'Mission').
 * @param operation - The type of operation (e.g., 'Création', 'Modification', 'Suppression').
 */
export const logActivity = async (
    firestore: Firestore, 
    action: string, 
    entity: string, 
    operation: 'Création' | 'Modification' | 'Suppression' | 'Importation' | 'Dédoublonnage'
) => {
    try {
        const logsCollection = collection(firestore, 'activity_logs');
        await addDoc(logsCollection, {
            timestamp: serverTimestamp(),
            action,
            entity,
            operation,
        });
    } catch (error) {
        console.error("Erreur lors de la journalisation de l'activité: ", error);
        // Optionally, handle logging errors, e.g., by reporting them to a monitoring service
    }
};

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
    await batch.commit();
    await logActivity(firestore, `${duplicatesDeleted} agent(s) en double supprimé(s) basé(s) sur le matricule.`, 'Agent', 'Dédoublonnage');
  }

  return duplicatesDeleted;
}
