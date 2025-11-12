
'use server';

import type { Mission } from './types';

/**
 * Envoie une notification webhook lors de la création d'une mission.
 * @param missionData - Les données de la mission qui vient d'être créée.
 */
export async function sendMissionCreationWebhook(missionData: Omit<Mission, 'id' | 'status'>) {
  const webhookUrl = 'https://eor81ahsfc5a6tl.m.pipedream.net';

  const description = `Mission prévue à ${missionData.location} du ${missionData.startDate.toDate().toLocaleDateString('fr-FR')} au ${missionData.endDate.toDate().toLocaleDateString('fr-FR')}.`;

  const payload = {
    title: missionData.name,
    description: description,
    created_at: new Date().toISOString(),
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Webhook a échoué avec le statut: ${response.status}`, await response.text());
    }
  } catch (error) {
    console.error("Erreur lors de l'envoi du webhook:", error);
  }
}
