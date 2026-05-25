// German function words — prepositions, pronouns, conjunctions, articles and
// common particles. These are the highest-frequency words in the language and
// rarely have a clean dictionary entry, so their Turkish meanings are
// hand-written here. This guarantees a word like "zur" or "zurück" always
// resolves to a correct meaning instead of a garbled machine translation.
import type { CuratedWord } from '@/lib/mock-data';

type FunctionType = 'pronoun' | 'preposition' | 'conjunction' | 'article' | 'adverb';

const fw = (
  word: string,
  type: FunctionType,
  tr: string,
  en: string,
): CuratedWord => ({ id: word, word, language: 'de', type, shortDef: { tr, en } });

const prep = (word: string, tr: string, en: string) => fw(word, 'preposition', tr, en);
const pron = (word: string, tr: string, en: string) => fw(word, 'pronoun', tr, en);
const conj = (word: string, tr: string, en: string) => fw(word, 'conjunction', tr, en);
const art = (word: string, tr: string, en: string) => fw(word, 'article', tr, en);
const adv = (word: string, tr: string, en: string) => fw(word, 'adverb', tr, en);

// ─── Prepositions (incl. article contractions like zur, zum, im) ──────────────
const PREPOSITIONS: CuratedWord[] = [
  prep('in', 'içinde, -de / -da', 'in'),
  prep('an', '-de, -da, kenarında', 'at, on'),
  prep('auf', 'üstünde, üzerine', 'on, onto'),
  prep('für', 'için', 'for'),
  prep('mit', 'ile, -le / -la', 'with'),
  prep('von', '-den, -dan, -in / -nin', 'from, of'),
  prep('bei', 'yanında, -de', 'at, near, with'),
  prep('nach', '-e doğru, sonra', 'to, after'),
  prep('aus', '-den, -dan (içinden)', 'out of, from'),
  prep('über', 'üzerinde, hakkında', 'over, about'),
  prep('unter', 'altında, arasında', 'under, among'),
  prep('vor', 'önünde, önce', 'in front of, before'),
  prep('hinter', 'arkasında', 'behind'),
  prep('neben', 'yanında', 'next to, beside'),
  prep('zwischen', 'arasında', 'between'),
  prep('durch', 'içinden, vasıtasıyla', 'through'),
  prep('gegen', '-e karşı', 'against'),
  prep('ohne', '-siz, olmadan', 'without'),
  prep('um', 'etrafında, saat …’de', 'around, at'),
  prep('zu', '-e, -ye (yönelme)', 'to'),
  prep('zur', '“zu der”ın kısaltması — -e, -ye', 'to the (zu + der)'),
  prep('zum', '“zu dem”in kısaltması — -e, -ye', 'to the (zu + dem)'),
  prep('am', '“an dem”in kısaltması — -de, -da', 'at the (an + dem)'),
  prep('im', '“in dem”in kısaltması — içinde', 'in the (in + dem)'),
  prep('ins', '“in das”ın kısaltması — içine', 'into the (in + das)'),
  prep('beim', '“bei dem”in kısaltması — yanında', 'at the (bei + dem)'),
  prep('vom', '“von dem”in kısaltması — -den', 'from the (von + dem)'),
  prep('seit', '-den beri', 'since, for'),
  prep('während', 'sırasında, esnasında', 'during'),
  prep('wegen', '-den dolayı, yüzünden', 'because of'),
  prep('trotz', '-e rağmen', 'despite'),
  prep('bis', '-e kadar', 'until, up to'),
  prep('ab', '-den itibaren', 'from, starting'),
];

// ─── Pronouns ─────────────────────────────────────────────────────────────────
const PRONOUNS: CuratedWord[] = [
  pron('ich', 'ben', 'I'),
  pron('du', 'sen (samimi)', 'you (informal)'),
  pron('er', 'o (eril)', 'he'),
  pron('sie', 'o (dişil); onlar; siz (resmi "Sie")', 'she; they; you (formal "Sie")'),
  pron('es', 'o (nötr)', 'it'),
  pron('wir', 'biz', 'we'),
  pron('ihr', 'siz (çoğul, samimi); onun (dişil); sizin (resmi "Ihr")', 'you (plural, informal); her; your (formal "Ihr")'),
  pron('mich', 'beni', 'me'),
  pron('dich', 'seni (samimi)', 'you (informal)'),
  pron('dir', 'sana (samimi)', 'to you (informal)'),
  pron('ihnen', 'onlara; size (resmi "Ihnen")', 'to them; to you (formal "Ihnen")'),
  pron('uns', 'bizi, bize', 'us'),
  pron('euch', 'sizi, size (çoğul, samimi)', 'you (plural, informal)'),
  pron('mein', 'benim', 'my'),
  pron('dein', 'senin (samimi)', 'your (informal)'),
  pron('dieser', 'bu', 'this'),
  pron('jener', 'şu, o', 'that'),
  pron('wer', 'kim', 'who'),
  pron('was', 'ne', 'what'),
  pron('man', 'belirsiz özne — insan, kişi', 'one, you (impersonal)'),
  pron('alles', 'her şey', 'everything'),
  pron('nichts', 'hiçbir şey', 'nothing'),
  pron('etwas', 'bir şey, biraz', 'something'),
  pron('jemand', 'biri, birisi', 'someone'),
  pron('niemand', 'hiç kimse', 'nobody'),
];

// ─── Conjunctions ─────────────────────────────────────────────────────────────
const CONJUNCTIONS: CuratedWord[] = [
  conj('und', 've', 'and'),
  conj('oder', 'veya, ya da', 'or'),
  conj('aber', 'ama, fakat', 'but'),
  conj('denn', 'çünkü', 'because, for'),
  conj('weil', 'çünkü, -dığı için', 'because'),
  conj('dass', '-dığını, ki', 'that'),
  conj('wenn', 'eğer, -dığında', 'if, when'),
  conj('ob', '-ip -mediğini, acaba', 'whether, if'),
  conj('sondern', 'aksine, bilakis', 'but rather'),
  conj('als', '-dığında; -den (karşılaştırma)', 'when, than, as'),
  conj('damit', '-mek için, ki', 'so that'),
  conj('obwohl', '-e rağmen, -dığı halde', 'although'),
];

// ─── Articles ─────────────────────────────────────────────────────────────────
const ARTICLES: CuratedWord[] = [
  art('der', 'eril belirli artikel', 'the (masculine)'),
  art('die', 'dişil / çoğul belirli artikel', 'the (feminine / plural)'),
  art('das', 'nötr belirli artikel', 'the (neuter)'),
  art('ein', 'bir (eril / nötr belirsiz artikel)', 'a, an'),
  art('eine', 'bir (dişil belirsiz artikel)', 'a, an'),
  art('kein', 'hiç(bir), -sız', 'no, not a'),
];

// ─── Question words & common particles (adverbs) ─────────────────────────────
const PARTICLES: CuratedWord[] = [
  adv('wie', 'nasıl', 'how'),
  adv('wo', 'nerede', 'where'),
  adv('wann', 'ne zaman', 'when'),
  adv('warum', 'neden, niçin', 'why'),
  adv('wohin', 'nereye', 'where to'),
  adv('woher', 'nereden', 'where from'),
  adv('welcher', 'hangi', 'which'),
  adv('nicht', 'değil, -me / -ma (olumsuzluk)', 'not'),
  adv('nein', 'hayır', 'no'),
  adv('ja', 'evet; (partikül) ya, biliyorsun ki', 'yes; (particle) you know'),
  adv('doch', 'yine de; (olumsuza karşı) evet; (partikül) ya hani, canım', 'yet, however; (particle) come on'),
  adv('schon', 'zaten, çoktan; (partikül, yumuşatıcı) olacak canım', 'already; (particle, reassurance)'),
  adv('noch', 'hâlâ, daha', 'still, yet'),
  adv('nur', 'sadece, yalnızca', 'only'),
  adv('auch', 'de, da, ayrıca', 'also, too'),
  adv('sehr', 'çok', 'very'),
  adv('zurück', 'geri, geriye', 'back'),
  adv('immer', 'her zaman, daima', 'always'),
  adv('vielleicht', 'belki', 'maybe'),
  adv('gern', 'severek, isteyerek', 'gladly'),
  // ── Modal particles — flavour words German uses constantly that translation
  //    engines either drop or mistranslate. Hand-curated so they always show
  //    the right Turkish nuance rather than a stale chained guess.
  adv('mal', '(partikül) bir kez, hadi, bir; ara sıra', '(particle) just, ever, once'),
  adv('eben', 'tam, az önce; (partikül) işte böyle', 'just now; (particle) precisely'),
  adv('halt', '(partikül) işte, ne yapalım', '(particle) just, well'),
  adv('wohl', 'sanırım, herhalde; iyi', 'probably; well'),
  adv('etwa', 'yaklaşık; (soruda) sahi mi, yoksa', 'about; (question) by any chance'),
  adv('überhaupt', '(partikül) hiç, esasen', 'at all, in general'),
  // einfach (adj+particle) covered in german-words-extra.ts
  // eigentlich (adv) covered in german-adverbs-extra.ts
];

// All curated German function words, ready to merge into the search pool.
export const GERMAN_FUNCTION_WORDS: CuratedWord[] = [
  ...PREPOSITIONS,
  ...PRONOUNS,
  ...CONJUNCTIONS,
  ...ARTICLES,
  ...PARTICLES,
];
