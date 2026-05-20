import type { ReviewResultPayload } from '../store/useUserStore';
import type { Exercise } from '../types';

export function normalizeAnswer(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/[.,!?;:]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function joinWords(words: string[]): string {
  return words.join(' ').replace(/\s+/g, ' ').trim();
}

export function getCorrectAnswerText(exercise: Exercise): string {
  switch (exercise.type) {
    case 'multipleChoice': {
      const correctOption = exercise.options.find(
        (option) => option.id === exercise.correctOptionId,
      );

      return correctOption?.text ?? '';
    }

    case 'translate':
    case 'listen':
    case 'fillBlank':
      return exercise.correctAnswer;

    case 'speak':
      return exercise.targetText;

    case 'matchPairs':
      return 'Eşleştirmeleri kontrol et.';

    default: {
      const exhaustiveCheck: never = exercise;
      return exhaustiveCheck;
    }
  }
}

export function getExercisePromptText(exercise: Exercise): string {
  switch (exercise.type) {
    case 'multipleChoice':
      return exercise.question;

    case 'translate':
    case 'fillBlank':
      return exercise.prompt;

    case 'listen':
      return exercise.prompt ?? exercise.audioText;

    case 'speak':
      return exercise.prompt;

    case 'matchPairs':
      return 'Eşleştirme sorusu';

    default: {
      const exhaustiveCheck: never = exercise;
      return exhaustiveCheck;
    }
  }
}

export function getReviewPayloadForExercise(
  exercise: Exercise,
  courseId: string,
): ReviewResultPayload | null {
  if (exercise.type === 'matchPairs') {
    return null;
  }

  const targetText = getCorrectAnswerText(exercise);

  if (targetText.trim().length === 0) {
    return null;
  }

  return {
    id: `${courseId}:${exercise.id}`,
    courseId,
    exerciseId: exercise.id,
    exerciseType: exercise.type,
    sourceText: getExercisePromptText(exercise),
    targetText,
  };
}

export function isAnswerCorrect(exercise: Exercise, answer: string): boolean {
  switch (exercise.type) {
    case 'multipleChoice': {
      const correctOption = exercise.options.find(
        (option) => option.id === exercise.correctOptionId,
      );

      return normalizeAnswer(answer) === normalizeAnswer(correctOption?.text ?? '');
    }

    case 'translate':
    case 'listen':
    case 'fillBlank':
      return normalizeAnswer(answer) === normalizeAnswer(exercise.correctAnswer);

    case 'speak':
      return normalizeAnswer(answer) === normalizeAnswer(exercise.targetText);

    case 'matchPairs':
      return false;

    default: {
      const exhaustiveCheck: never = exercise;
      return Boolean(exhaustiveCheck);
    }
  }
}