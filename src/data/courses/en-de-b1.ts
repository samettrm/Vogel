import type { Course } from '../../types';

// ════════════════════════════════════════════════════════════════
// EN → DE B1 — PLACEHOLDER
//
// ⚠️ YAKINDA: Bu dil çifti için içerik henüz hazırlanmadı.
// AI ile TR-DE içeriğinden çevrilecek (Phase 2).
//
// Bu dosya iskelet — uygulamanın crash olmaması için gerekli minimum
// veri vardır.
// ════════════════════════════════════════════════════════════════

export const EN_DE_B1: Course = {
  id: 'en-de-b1',
  sourceLanguage: 'en',
  targetLanguage: 'de',
  level: 'B1',
  title: 'German B1',
  description: 'Bu seviye için içerik yakında eklenecek.',
  units: [
    {
      id: 'en-de-b1-u1',
      order: 1,
      title: 'Yakında',
      description: 'Bu dil çiftinin müfredatı hazırlanıyor.',
      tags: ['daily'],
      lessons: [
        {
          id: 'en-de-b1-u1-l1',
          order: 1,
          title: 'Placeholder',
          xpReward: 10,
          exercises: [
            {
              id: 'en-de-b1-u1-l1-e1',
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
