import type { Course } from '../../types';

// ════════════════════════════════════════════════════════════════
// TR → FR A2 — PLACEHOLDER
//
// ⚠️ YAKINDA: Bu dil çifti için içerik henüz hazırlanmadı.
// AI ile TR-DE içeriğinden çevrilecek (Phase 2).
//
// Bu dosya iskelet — uygulamanın crash olmaması için gerekli minimum
// veri vardır.
// ════════════════════════════════════════════════════════════════

export const TR_FR_A2: Course = {
  id: 'tr-fr-a2',
  sourceLanguage: 'tr',
  targetLanguage: 'fr',
  level: 'A2',
  title: 'Fransızca A2',
  description: 'Bu seviye için içerik yakında eklenecek.',
  units: [
    {
      id: 'tr-fr-a2-u1',
      order: 1,
      title: 'Yakında',
      description: 'Bu dil çiftinin müfredatı hazırlanıyor.',
      tags: ['daily'],
      lessons: [
        {
          id: 'tr-fr-a2-u1-l1',
          order: 1,
          title: 'Placeholder',
          xpReward: 10,
          exercises: [
            {
              id: 'tr-fr-a2-u1-l1-e1',
              type: 'multipleChoice',
              question: 'Bu dil çifti için içerik yakında hazır olacak.',
              options: [
                { id: 'a', text: 'Tamam' },
                { id: 'b', text: 'Bekliyorum' },
              ],
              correctOptionId: 'a',
            },
          ],
        },
      ],
    },
  ],
};
