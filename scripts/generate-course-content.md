# Course Content Generator — Multi-Language Strategy

Bu dokümanda Vogel'in 6 yeni dil çifti için içerik üretim planı bulunur.

## 🎯 Dil Çiftleri (Phase 2 sırasıyla)

| Sıra | Çift | Hedef | AI Model Önerisi |
|------|------|-------|------------------|
| 1 | TR → EN | İngilizce | Claude Sonnet 4.6 (kaliteli çeviri) |
| 2 | TR → ES | İspanyolca | Claude Sonnet 4.6 |
| 3 | TR → FR | Fransızca | Claude Sonnet 4.6 |
| 4 | TR → IT | İtalyanca | Claude Sonnet 4.6 |
| 5 | TR → AR | Arapça | Claude Opus 4.7 (RTL + linguistic complexity) |
| 6 | EN → DE | German (for English speakers) | GPT-4 / Claude (reverse direction) |

## 📋 İçerik Hacmi

Her dil çifti için (TR-DE örneğinde olduğu gibi):
- 5 seviye (A1-C1)
- Seviye başına ~11 unit
- Unit başına ~5 lesson
- Lesson başına ~7 exercise
- Toplam: ~1900 exercise per pair × 6 pair = ~11,400 yeni exercise

## 🔄 AI Translation Strategy

### Yöntem A: Otomatik Script (Claude API)

```typescript
// scripts/translate-course.ts
import Anthropic from '@anthropic-ai/sdk';
import { TR_DE_A1 } from '../src/data/courses/tr-de-a1';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function translateCourse(
  sourceCourse: Course,
  targetLang: LanguageCode,
): Promise<Course> {
  const systemPrompt = `You are a professional language curriculum translator.
Translate the German content to ${targetLang} while preserving:
1. Same exercise structure (multipleChoice, translate, fillBlank, listen)
2. Same difficulty progression (A1 stays A1)
3. Same vocabulary themes (greetings, numbers, family, etc.)
4. Articles in target language (der/die/das equivalent)
5. Native pronunciation accuracy

Keep Turkish questions (the "source side") IDENTICAL.
Only translate the target language content (German → target).`;

  // Course'u JSON olarak gönder, çevrilmiş JSON al
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 64000,
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: `Translate this German A1 course content to ${targetLang}:

${JSON.stringify(sourceCourse, null, 2)}

Return ONLY valid JSON in the same structure. Do not add commentary.`
    }]
  });

  return JSON.parse(response.content[0].text);
}
```

### Yöntem B: Manuel Batch (ChatGPT/Claude Web)

Her unit için TR-DE'deki JSON'u kopyala, ChatGPT'ye yapıştır:

```
Aşağıdaki TR→DE A1 unit'ini TR→EN olarak çevir.
Aynı JSON yapısını koru, sadece Almanca kelimeleri İngilizceye çevir.
Sayılar, gramer notları da uygun şekilde değişsin.

[YAPISTIR JSON]
```

Sonra çıktıyı `tr-en-a1.ts` dosyasına yapıştır.

### Yöntem C: Karma (Önerilen)

1. **A1-A2 seviyeleri**: AI ile otomatik (basit vocabulary, MC heavy)
2. **B1-B2 seviyeleri**: AI + manuel review (gramer karmaşık)
3. **C1 seviyesi**: Manuel veya AI + native review (idiomatic expressions)

## 🚨 Kalite Kontrol Checklist

Her translated course için:

- [ ] Question'lar Türkçe kaldı (`"Hallo" ne demek?` → `"Hello" ne demek?`)
- [ ] Options doğru hedef dilde
- [ ] correctOptionId hala doğru cevabı işaret ediyor
- [ ] Translate exercise: `correctAnswer` hedef dilde
- [ ] Listen exercise: `audioText` hedef dilde, `translation` Türkçe
- [ ] FillBlank: `prompt` Türkçe explanation + hedef dil cümle, `correctAnswer` hedef dil
- [ ] WordBank: hepsi hedef dilde
- [ ] CEFR level appropriate (A1 basit, C1 idiomatic)
- [ ] Aynı theme korundu (selamlaşma → greetings → saludos vs.)

## 📅 Tahmini Zaman

| Yaklaşım | Pair başına süre |
|----------|-------------------|
| Sadece AI script | 30 dk - 2 saat |
| AI + light review | 4-6 saat |
| AI + thorough review | 1-2 gün |
| Manuel curation | 1-2 hafta |

**Önerim: Sırayla AI script + light review (toplam ~30 saat ile 6 dil çifti).**

## 🔧 Çalışma Akışı

1. **Bu PR mevcut state**: Infrastructure hazır, placeholder courses var
2. **Test**: User TR-DE dışı dil seçer → "Yakında" gösterir, crash yok
3. **Phase 2 başlat**: Bir AI script ile TR-EN A1 üret
4. **Test**: Telefonda kontrol → kalite OK ise tüm seviyeler
5. **Devam**: Sırayla TR-ES, TR-FR, TR-IT, TR-AR, EN-DE
6. **Audio**: TTS ile listen exercise audio'ları (opsiyonel, ileri faz)

## 🤖 AI Model Seçimi Notları

- **Claude Sonnet 4.6**: Hızlı, kaliteli, ucuz. Genel dil çevirisi için ideal.
- **Claude Opus 4.7**: En kaliteli ama pahalı. Arapça gibi karmaşık diller için.
- **GPT-4o**: Almanca yüksek kalite. EN-DE için tercih.
- **Gemini Pro**: Multilingual güçlü, alternatif.
- **Grok**: Az test edildi, deneme amaçlı.

## 💰 Maliyet Tahmini (Claude Sonnet 4.6)

- 6000 satır per pair × 6 pair = ~36,000 satır
- ~500K input tokens + ~500K output tokens per pair
- $3 input + $15 output per million = ~$9 per pair
- Toplam: **~$54 for 6 pairs** (tek seferlik)

Çok makul.
