// ─────────────────────────────────────────────────────────────────────────────
// Builds lib/data/german-relations.json — antonyms and synonyms for the words
// in the bundled German dictionary, extracted from the German Wiktionary
// ("Gegenwörter" and "Synonyme" sections).
//
// Output shape:  { "<lowercase word>": { "o": [antonyms], "s": [synonyms] } }
// Examined words with no relations are stored as {} so a re-run skips them;
// these empties are stripped from the final shipped file.
//
// Usage:    node scripts/build-german-relations.mjs
// Resumable: re-running continues from where it stopped.
// ─────────────────────────────────────────────────────────────────────────────
import fs from 'node:fs';
import path from 'node:path';

const DICT_PATH = path.join(process.cwd(), 'lib', 'data', 'german-dictionary.json');
const OUT_PATH = path.join(process.cwd(), 'lib', 'data', 'german-relations.json');
const API = 'https://de.wiktionary.org/w/api.php';
const UA = 'LexoraDictionaryBuilder/1.0 (language learning app)';
const BATCH = 25;
const DELAY_MS = 500;
const RETRY_WAITS = [2000, 5000, 10000, 20000];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Pulls the [[linked]] words listed under a German Wiktionary section template
// (e.g. {{Gegenwörter}} or {{Synonyme}}).
function extractSection(content, marker) {
  const lines = content.split('\n');
  let idx = lines.findIndex((l) => l.trim() === `{{${marker}}}`);
  if (idx < 0) return [];
  const out = [];
  for (let i = idx + 1; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t.startsWith('{{') || t.startsWith('==')) break;
    if (!t.startsWith(':')) {
      if (t === '') continue;
      break;
    }
    for (const m of t.matchAll(/\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g)) {
      const w = m[1].trim();
      if (w && /^[A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß \-]*$/.test(w) && !out.includes(w)) {
        out.push(w);
      }
    }
  }
  return out.slice(0, 6);
}

async function fetchPages(titles) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    prop: 'revisions',
    rvprop: 'content',
    rvslots: 'main',
    titles: titles.join('|'),
  });
  const res = await fetch(`${API}?${params}`, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`http ${res.status}`);
  const data = await res.json();
  const map = new Map();
  for (const p of data?.query?.pages ?? []) map.set(p.title, p);
  return map;
}

async function fetchPagesWithRetry(titles) {
  for (let attempt = 0; attempt <= RETRY_WAITS.length; attempt++) {
    try {
      return await fetchPages(titles);
    } catch {
      if (attempt === RETRY_WAITS.length) return null;
      await sleep(RETRY_WAITS[attempt]);
    }
  }
  return null;
}

async function main() {
  const dict = JSON.parse(fs.readFileSync(DICT_PATH, 'utf8'));
  let relations = {};
  try {
    relations = JSON.parse(fs.readFileSync(OUT_PATH, 'utf8'));
  } catch {
    relations = {};
  }

  // One representative (correctly-cased) word per lowercase key.
  const byKey = new Map();
  for (const e of dict) {
    const key = e.w.toLowerCase();
    if (!byKey.has(key)) byKey.set(key, e.w);
  }
  const pending = [...byKey.entries()].filter(([key]) => relations[key] === undefined);
  process.stdout.write(`Total ${byKey.size} · to process ${pending.length}\n`);

  let withRelations = 0;
  for (let i = 0; i < pending.length; i += BATCH) {
    const batch = pending.slice(i, i + BATCH);
    const titles = batch.map(([, word]) => word);

    const pages = await fetchPagesWithRetry(titles);
    if (!pages) continue; // unflagged → retried on the next run

    for (const [key, word] of batch) {
      const page = pages.get(word);
      const content =
        page && !page.missing ? page.revisions?.[0]?.slots?.main?.content ?? '' : '';
      const entry = {};
      if (content) {
        const o = extractSection(content, 'Gegenwörter');
        const s = extractSection(content, 'Synonyme');
        if (o.length) entry.o = o;
        if (s.length) entry.s = s;
      }
      relations[key] = entry;
      if (entry.o || entry.s) withRelations++;
    }

    fs.writeFileSync(OUT_PATH, JSON.stringify(relations));
    process.stdout.write(
      `  ${Math.min(i + BATCH, pending.length)}/${pending.length} · withRelations ${withRelations}\n`,
    );
    await sleep(DELAY_MS);
  }

  process.stdout.write(`Done. ${withRelations} words have antonyms/synonyms.\n`);
}

main().catch((err) => {
  process.stderr.write(`Build failed: ${err.message}\n`);
  process.exit(1);
});
