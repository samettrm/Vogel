// ════════════════════════════════════════════════════════════════
// NAVIGATION STATE — Cross-screen ephemeral flags
//
// Module-level mutable state. Used to communicate between screens
// without route params (which persist) or Zustand (which is overkill).
//
// Pattern:
//   - Screen A sets flag before navigation
//   - Screen B reads flag on focus
//   - Screen B consumes (resets) flag immediately
//
// Şu an tek kullanım: Map screen'in lesson exit'te scroll yapmaması için
// lesson screen `fromLesson = true` set eder, map consume eder.
// ════════════════════════════════════════════════════════════════

export const mapNavState = {
  // True when user is returning from /lesson/X to /(tabs)/ (map).
  // Set by lesson screen before router.replace, consumed by map's
  // useFocusEffect to suppress auto-scroll for this focus cycle.
  fromLesson: false,
  // V31: 'exit' (X button, abandon) → restore previous scroll position
  //      'complete' (DEVAM after success) → smooth focus to next playable lesson
  lessonReturnMode: null as 'exit' | 'complete' | null,
};
