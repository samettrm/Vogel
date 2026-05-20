import type { Course, CEFRLevel } from '../../types';
import { TR_DE_A1 } from './tr-de-a1';
import { TR_DE_A2 } from './tr-de-a2';
import { TR_DE_B1 } from './tr-de-b1';
import { TR_DE_B2 } from './tr-de-b2';
import { TR_DE_C1 } from './tr-de-c1';

export const ALL_COURSES: Course[] = [
  TR_DE_A1,
  TR_DE_A2,
  TR_DE_B1,
  TR_DE_B2,
  TR_DE_C1,
];

export function getCourseById(id: string): Course | undefined {
  return ALL_COURSES.find((c) => c.id === id);
}

// Belirli bir seviyeye gore kurs bul
export function getCourseByLevel(level: CEFRLevel): Course | undefined {
  return ALL_COURSES.find((c) => c.level === level);
}

// Mevcut tum seviyeler (UI sekmelerinde gosterilir)
export const AVAILABLE_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];
