import type { CEFRLevel } from '../types';

// ════════════════════════════════════════════════════════════════
// PLACEMENT TEST QUESTIONS
//
// Onboarding'de seviye belirleme için kullanılır.
// 6 soru: 2× A1 (kolay), 2× A2 (temel gramer), 1× B1 (orta), 1× B2 (ileri)
//
// MANTIK:
//   - Sorular sırayla A1 → B2'ye doğru ZORLAŞIR
//   - Her tier'da en az 1 yanlış varsa bir önceki tier'da başlatılır
//   - 2× A1 yanlışı bile olursa tamamen A1'den başlatılır (varsayılan)
//   - Tüm 6 doğruysa B2'den başlatılır (B1'i tamamla, B2'de aç)
//
// FORMAT:
//   - Türkçe → Almanca, Almanca → Türkçe veya bağlam çevirisi
//   - 4 seçenek, 1 doğru
// ════════════════════════════════════════════════════════════════

export type PlacementQuestion = {
  id: string;
  level: CEFRLevel;
  // Türkçe prompt (ne soruyoruz)
  prompt: string;
  // Açıklama metni — Almanca veya bağlam cümlesi
  context?: string;
  options: string[];
  correctIndex: number;
};

// 6 soru: A1×2 → A2×2 → B1×1 → B2×1
export const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  // ─── A1 (Temel kelimeler) ───
  {
    id: 'p-a1-1',
    level: 'A1',
    prompt: '"Hallo" ne demek?',
    options: ['Merhaba', 'Hoşça kal', 'Teşekkür ederim', 'Lütfen'],
    correctIndex: 0,
  },
  {
    id: 'p-a1-2',
    level: 'A1',
    prompt: '"Wasser" hangisi?',
    context: 'Restoranda sipariş veriyorsun.',
    options: ['Şarap', 'Su', 'Çay', 'Süt'],
    correctIndex: 1,
  },

  // ─── A2 (Temel gramer + günlük durumlar) ───
  {
    id: 'p-a2-1',
    level: 'A2',
    prompt: '"Ich habe Hunger" ne demek?',
    options: [
      'Susadım',
      'Yorgunum',
      'Açım',
      'Hastayım',
    ],
    correctIndex: 2,
  },
  {
    id: 'p-a2-2',
    level: 'A2',
    prompt: '"Gestern war ich krank" cümlesi hangi zamanda?',
    context: 'Bu cümle ne anlatıyor?',
    options: [
      'Şu an hastayım',
      'Yarın hasta olacağım',
      'Dün hastaydım',
      'Hep hastaymışım',
    ],
    correctIndex: 2,
  },

  // ─── B1 (Modal fiiller, perfekt, sıralı bağlaçlar) ───
  {
    id: 'p-b1-1',
    level: 'B1',
    prompt: '"Obwohl es regnet, gehe ich spazieren." ne demek?',
    options: [
      'Yağmur yağıyor, bu yüzden yürüyüşe çıkmam',
      'Yağmur yağmasına rağmen yürüyüşe çıkıyorum',
      'Yağmur yağarsa yürüyüşe çıkarım',
      'Yağmur yağmıyor, yürüyüşe çıkıyorum',
    ],
    correctIndex: 1,
  },

  // ─── B2 (Konjunktiv, dolaylı anlatım, ileri yapılar) ───
  {
    id: 'p-b2-1',
    level: 'B2',
    prompt: '"Er behauptet, sie sei bereits gegangen." cümlesi ne anlatıyor?',
    context: 'Burada Konjunktiv I (dolaylı anlatım) kullanılıyor.',
    options: [
      'Onun çoktan gittiğini iddia ediyor',
      'Onun gitmemesini istiyor',
      'Onun gitmesi gerektiğini söylüyor',
      'Onun gitmediğini biliyor',
    ],
    correctIndex: 0,
  },
];

// ─── Skor hesaplama ───
// Cevapları analiz ederek başlangıç seviyesini döndürür.
//
// Kurallar:
//   - A1 (2 soru): her ikisi de yanlışsa → A1 (sıfırdan)
//   - A1 ≥1 doğru, A2 (2 soru) ≥1 doğru → A2'den başla
//   - A1 ≥1, A2 ≥1, B1 doğru → B1'den başla
//   - A1 ≥1, A2 ≥1, B1 doğru, B2 doğru → B2'den başla
//
// Konservatif yaklaşım: emin değilsek bir tier altta başlat
// (kullanıcı bilmediği bir yerden başlayıp moralini bozmasın).
export function calculatePlacementLevel(
  answers: Record<string, number>,
): CEFRLevel {
  const correctAt = (questionId: string) => {
    const q = PLACEMENT_QUESTIONS.find((qq) => qq.id === questionId);
    if (!q) return false;
    return answers[questionId] === q.correctIndex;
  };

  const a1Score = [correctAt('p-a1-1'), correctAt('p-a1-2')].filter(Boolean).length;
  const a2Score = [correctAt('p-a2-1'), correctAt('p-a2-2')].filter(Boolean).length;
  const b1Score = correctAt('p-b1-1') ? 1 : 0;
  const b2Score = correctAt('p-b2-1') ? 1 : 0;

  // A1 başarısız → A1'den başla
  if (a1Score < 1) return 'A1';
  // A1 OK ama A2 başarısız → A1'den başla (gramer eksik)
  if (a2Score < 1) return 'A1';
  // A1 ve A2 OK, B1 yanlış → A2'den başla
  if (b1Score === 0) return 'A2';
  // A1+A2+B1 OK, B2 yanlış → B1'den başla
  if (b2Score === 0) return 'B1';
  // Hepsi doğru → B2'den başla (C1 hala kilitli)
  return 'B2';
}

// ─── Tier başına doğru sayıları (UI için) ───
export function getPlacementBreakdown(
  answers: Record<string, number>,
): { level: CEFRLevel; correct: number; total: number }[] {
  const tiers: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2'];
  return tiers.map((tier) => {
    const tierQuestions = PLACEMENT_QUESTIONS.filter((q) => q.level === tier);
    const correct = tierQuestions.filter(
      (q) => answers[q.id] === q.correctIndex,
    ).length;
    return { level: tier, correct, total: tierQuestions.length };
  });
}
