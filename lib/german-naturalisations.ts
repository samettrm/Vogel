// ─────────────────────────────────────────────────────────────────────────────
// Offline "more natural German" suggestions.
//
// ChatGPT can rewrite a stiff sentence into something a native speaker would
// actually say. Doing the same offline isn't realistic in general, but it is
// realistic for the *closed set* of awkward patterns A1/A2 learners produce
// over and over again — "Ich spreche ein wenig Deutsch", "Ich bin 25 Jahre"
// (without `alt`), "Ich möchte gern haben" (`gern` is redundant after
// `möchte`). Each rule below pairs a regex against the learner's sentence
// with a hand-curated natural rephrasing + a Turkish explainer.
//
// Add rules over time as we observe more recurring patterns. Order matters:
// earlier rules win, so put more specific ones first.
// ─────────────────────────────────────────────────────────────────────────────

export interface NaturalisationHint {
  /** Stable id used for React keys. */
  id: string;
  /** Awkward chunk found in the learner's text. */
  match: string;
  /** Idiomatic alternative we propose. */
  natural: string;
  /** One-line Turkish explanation of why the alternative is better. */
  hintTr: string;
}

interface NaturalisationRule {
  id: string;
  detect: (text: string) => Omit<NaturalisationHint, 'id'> | null;
}

const RULES: NaturalisationRule[] = [
  // 1) "Ich spreche ein wenig X" → "Ich kann ein bisschen X sprechen"
  //    The exam-card go-to when describing language skill is the modal-verb
  //    construction; "spreche ein wenig X" is grammatical but slightly stilted.
  {
    id: 'spreche-wenig-x',
    detect(text) {
      const m = text.match(/ich spreche (?:aber )?(?:auch )?ein (?:wenig|bisschen) (\w+)/i);
      if (!m) return null;
      return {
        match: m[0],
        natural: `Ich kann ein bisschen ${m[1]} sprechen.`,
        hintTr: 'Bir dili az bildiğini söylemek için "kann … sprechen" daha doğal: yetenek = modal fiil.',
      };
    },
  },

  // 2) "ein wenig" → "ein bisschen" — informal conversation register.
  {
    id: 'ein-wenig-bisschen',
    detect(text) {
      const m = text.match(/\bein wenig\b/i);
      if (!m) return null;
      return {
        match: 'ein wenig',
        natural: 'ein bisschen',
        hintTr: 'Konuşma dilinde "ein bisschen" daha yaygın; "ein wenig" yazılı/resmi tona kayar.',
      };
    },
  },

  // 3) Age without "alt" — "Ich bin 25 Jahre" missing the final adjective.
  {
    id: 'jahre-without-alt',
    detect(text) {
      const m = text.match(/ich bin (\d+) jahre(?! alt)\b/i);
      if (!m) return null;
      return {
        match: m[0],
        natural: `Ich bin ${m[1]} Jahre alt`,
        hintTr: 'Yaş söylerken "alt" mecburi — "Ich bin 25 Jahre alt".',
      };
    },
  },

  // 4) "Ich lebe in [city]" → "Ich wohne in [city]" — leben is heavier
  //    ("hayatımı … şehirde sürdürüyorum"). Daily "I live" = wohnen.
  {
    id: 'leben-vs-wohnen-city',
    detect(text) {
      const m = text.match(/ich lebe in ([A-ZÄÖÜ][\wäöüß]+)/);
      if (!m) return null;
      return {
        match: m[0],
        natural: `Ich wohne in ${m[1]}`,
        hintTr: 'Bir şehirde yaşadığını söylerken "wohnen" daha günlük; "leben" daha geniş, ömür/hayat tarzı için.',
      };
    },
  },

  // 5) "Mein Name ist X … Ich heiße X" — same info twice.
  {
    id: 'name-heisse-redundancy',
    detect(text) {
      const m = text.match(/mein name ist (\w+)[\s\S]*ich heiße \1/i);
      if (!m) return null;
      return {
        match: `Mein Name ist ${m[1]} … Ich heiße ${m[1]}`,
        natural: `Sadece "Ich heiße ${m[1]}." veya sadece "Mein Name ist ${m[1]}."`,
        hintTr: 'Aynı bilgiyi iki kez söylüyor — birini seç. İkisi tekrar yaratıyor.',
      };
    },
  },

  // 6) "Ich möchte gern(e) …" — gern after möchte is overstated politeness.
  {
    id: 'moechte-gerne',
    detect(text) {
      const m = text.match(/ich möchte gern(?:e)?\s+(\w+)/i);
      if (!m) return null;
      return {
        match: m[0],
        natural: `Ich möchte ${m[1]}`,
        hintTr: '"Möchte" zaten kibarlık ve istek katar; "gern" gereksiz tekrar.',
      };
    },
  },

  // 7) "in Schule / Universität" (missing article)
  {
    id: 'missing-article-institution',
    detect(text) {
      const re = /\bin (Schule|Universität|Kirche|Krankenhaus|Restaurant|Bibliothek)\b/i;
      const m = text.match(re);
      if (!m) return null;
      const articles: Record<string, string> = {
        schule: 'in die Schule',
        universität: 'an der Universität',
        kirche: 'in die Kirche',
        krankenhaus: 'im Krankenhaus',
        restaurant: 'im Restaurant',
        bibliothek: 'in der Bibliothek',
      };
      const key = m[1].toLowerCase();
      return {
        match: m[0],
        natural: articles[key] ?? m[0],
        hintTr: 'Almanca kurum/yapı isimlerinden önce artikel mecburi — "in die Schule" gibi.',
      };
    },
  },

  // 8) "Ich gehe nach Hause" is correct; flag "zu Hause" only when paired
  //    with movement verbs.
  {
    id: 'zuhause-vs-nachhause',
    detect(text) {
      const m = text.match(/ich gehe zu hause/i);
      if (!m) return null;
      return {
        match: 'Ich gehe zu Hause',
        natural: 'Ich gehe nach Hause',
        hintTr: 'Hareket varken "nach Hause" (eve doğru); "zu Hause" durumu (evde) anlatır.',
      };
    },
  },

  // 9) "ich liebe X" used for things you only "like" — common A1 over-translation
  {
    id: 'lieben-mogen',
    detect(text) {
      const m = text.match(/ich liebe (Pizza|Bier|Kaffee|Musik|Filme|Bücher|Fußball)/i);
      if (!m) return null;
      return {
        match: m[0],
        natural: `Ich mag ${m[1]} sehr`,
        hintTr: '"Lieben" derin/romantik sevgidir. Yiyecek-hobi için "mögen" + "sehr" daha doğal.',
      };
    },
  },

  // 10) "Ich spreche Türkisch und ich spreche Deutsch" — repeated subject + verb
  {
    id: 'repeated-ich-spreche',
    detect(text) {
      const m = text.match(/ich spreche (\w+) und ich spreche (\w+)/i);
      if (!m) return null;
      return {
        match: m[0],
        natural: `Ich spreche ${m[1]} und ${m[2]}`,
        hintTr: 'İkinci "ich spreche"yi sil — "und" sonrası özne tekrar etmez.',
      };
    },
  },
];

// Run every rule against the text and return up to `limit` hints.
// A single rule fires at most once per call (so we don't repeat ourselves
// if the same awkward chunk shows up twice in a long sentence).
export function findNaturalisationHints(text: string, limit = 3): NaturalisationHint[] {
  const out: NaturalisationHint[] = [];
  for (const rule of RULES) {
    const hit = rule.detect(text);
    if (hit) out.push({ id: rule.id, ...hit });
    if (out.length >= limit) break;
  }
  return out;
}
