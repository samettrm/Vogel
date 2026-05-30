import type { Course } from '../../types';

// ════════════════════════════════════════════════════════════════
// TR → ES B2 — PLACEHOLDER
//
// ⚠️ YAKINDA: Bu dil çifti için içerik henüz hazırlanmadı.
// AI ile TR-DE içeriğinden çevrilecek (Phase 2).
//
// Bu dosya iskelet — uygulamanın crash olmaması için gerekli minimum
// veri vardır.
// ════════════════════════════════════════════════════════════════

export const TR_ES_B2: Course = {
  id: 'tr-es-b2',
  sourceLanguage: 'tr',
  targetLanguage: 'es',
  level: 'B2',
  title: 'İspanyolca B2',
  description: 'Bu seviye için içerik yakında eklenecek.',
  units: [
    {
      id: 'tr-es-b2-u1',
      order: 1,
      title: 'Yakında',
      description: 'Bu dil çiftinin müfredatı hazırlanıyor.',
      tags: ['daily'],
      lessons: [
        {
          id: 'tr-es-b2-u1-l1',
          order: 1,
          title: 'Placeholder',
          xpReward: 10,
          exercises: [
            {
              id: 'tr-es-b2-u1-l1-e1',
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
