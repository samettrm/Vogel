import type { Course } from '../../types';

// ════════════════════════════════════════════════════════════════
// EN → DE C1 — PLACEHOLDER
//
// ⚠️ YAKINDA: Bu dil çifti için içerik henüz hazırlanmadı.
// AI ile TR-DE içeriğinden çevrilecek (Phase 2).
//
// Bu dosya iskelet — uygulamanın crash olmaması için gerekli minimum
// veri vardır.
// ════════════════════════════════════════════════════════════════

export const EN_DE_C1: Course = {
  id: 'en-de-c1',
  sourceLanguage: 'en',
  targetLanguage: 'de',
  level: 'C1',
  title: 'German C1',
  description: 'Bu seviye için içerik yakında eklenecek.',
  units: [
    {
      id: 'en-de-c1-u1',
      order: 1,
      title: 'Yakında',
      description: 'Bu dil çiftinin müfredatı hazırlanıyor.',
      tags: ['daily'],
      lessons: [
        {
          id: 'en-de-c1-u1-l1',
          order: 1,
          title: 'Placeholder',
          xpReward: 10,
          exercises: [
            {
              id: 'en-de-c1-u1-l1-e1',
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
