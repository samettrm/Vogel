# Vogel ders ekranı güncellemesi

Bu zip, mevcut Vogel projesine eklenecek/değiştirilecek dosyaları içerir.

## Eklenecek dosyalar

- `app/lesson/[lessonId].tsx`
- `src/components/exercises/MultipleChoiceExercise.tsx`
- `src/components/exercises/TranslateExercise.tsx`
- `src/components/exercises/ListenExercise.tsx`
- `src/components/lesson/LessonHeader.tsx`
- `src/components/lesson/ProgressBar.tsx`
- `src/components/lesson/AnswerFeedback.tsx`
- `src/utils/exerciseHelpers.ts`

## Değiştirilecek dosyalar

- `src/data/courses/tr-de-a1.ts`
- `src/types/index.ts`

## Manuel yapılacak küçük işlem

`app/(tabs)/index.tsx` içindeki geçici `Alert.alert` kodunu kaldırıp şu mantığa çevir:

```tsx
import { useRouter } from 'expo-router';

const router = useRouter();

onPress={() => {
  if (status === 'current' || status === 'completed') {
    router.push(`/lesson/${lesson.id}`);
  }
}}
```

Örnek patch dosyası: `app/(tabs)/index.PATCH.tsx`

## Not

Mevcut `colors.ts` dosyanda şu renk isimlerinden biri eksikse TypeScript hata verir:

- `green`, `greenDark`, `greenLight`
- `red`, `redDark`, `redLight`
- `blue`, `blueDark`, `blueLight`
- `neutral200`, `neutral300`, `neutral400`, `neutral500`, `neutral600`, `neutral800`, `neutral900`
- `white`

Eksik varsa mevcut paletine alias olarak eklemek yeterlidir.
