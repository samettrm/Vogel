// ─────────────────────────────────────────────────────────────────────────────
// Builds the large offline German → Turkish dictionary bundled with the app.
//
// It downloads a German frequency word list, translates each word to Turkish
// in batches via Google's public endpoint, and writes the result to
// lib/data/german-dictionary.json (an array of { "w": <de>, "t": <tr> }).
//
// Usage:   node scripts/build-german-dictionary.mjs [wordCount]
//          (default 12000)
//
// Resumable: re-running continues from the words already translated, so an
// interrupted run is never lost. Safe to run repeatedly.
// ─────────────────────────────────────────────────────────────────────────────
import fs from 'node:fs';
import path from 'node:path';

const WORD_COUNT = Number(process.argv[2] ?? 12000);
const OUT_PATH = path.join(process.cwd(), 'lib', 'data', 'german-dictionary.json');
const FREQ_URL =
  'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/de/de_50k.txt';
const BATCH_SIZE = 48;
const DELAY_MS = 350;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Downloads the frequency list and returns the top N plausible German words.
async function getWordList() {
  process.stdout.write('Downloading German frequency list…\n');
  const res = await fetch(FREQ_URL);
  if (!res.ok) throw new Error(`frequency list download failed (${res.status})`);
  const text = await res.text();

  const words = [];
  const seen = new Set();
  for (const line of text.split('\n')) {
    const raw = line.split(' ')[0]?.trim();
    if (!raw) continue;
    if (!/^[a-zäöüßA-ZÄÖÜ]+$/.test(raw)) continue; // letters only
    if (raw.length < 2 || raw.length > 28) continue;
    const key = raw.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    words.push(raw);
    if (words.length >= WORD_COUNT) break;
  }
  process.stdout.write(`Word pool: ${words.length} words\n`);
  return words;
}

// Translates an array of German words to Turkish in one request (newline-
// joined). Returns an array aligned 1:1 with the input.
async function translateBatch(words) {
  const q = encodeURIComponent(words.join('\n'));
  const url =
    `https://translate.googleapis.com/translate_a/single` +
    `?client=gtx&sl=de&tl=tr&dt=t&q=${q}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`translate http ${res.status}`);
  const data = await res.json();
  const segments = Array.isArray(data?.[0]) ? data[0] : [];
  const texts = segments.map((s) => (Array.isArray(s) ? String(s[0] ?? '').trim() : ''));
  return texts;
}

async function translateOne(word) {
  const out = await translateBatch([word]);
  return out[0] ?? '';
}

function loadExisting() {
  try {
    const arr = JSON.parse(fs.readFileSync(OUT_PATH, 'utf8'));
    if (Array.isArray(arr)) return arr;
  } catch {
    // no existing file / invalid — start fresh
  }
  return [];
}

function save(entries) {
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(entries), 'utf8');
}

async function main() {
  const words = await getWordList();

  const existing = loadExisting();
  const done = new Map(existing.map((e) => [e.w.toLowerCase(), e]));
  const result = [...existing];

  const pending = words.filter((w) => !done.has(w.toLowerCase()));
  process.stdout.write(
    `Already translated: ${existing.length} · remaining: ${pending.length}\n`,
  );

  let added = 0;
  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE);
    let texts = [];
    try {
      texts = await translateBatch(batch);
    } catch (err) {
      process.stdout.write(`  batch failed (${err.message}); retrying slowly…\n`);
      await sleep(2000);
    }

    // When the batch response doesn't line up, fall back to per-word.
    if (texts.length !== batch.length) {
      texts = [];
      for (const w of batch) {
        try {
          texts.push(await translateOne(w));
        } catch {
          texts.push('');
        }
        await sleep(120);
      }
    }

    for (let j = 0; j < batch.length; j++) {
      const w = batch[j];
      const t = (texts[j] ?? '').trim();
      // Skip empty results and untranslated echoes.
      if (!t || t.toLowerCase() === w.toLowerCase()) continue;
      const entry = { w, t };
      result.push(entry);
      done.set(w.toLowerCase(), entry);
      added++;
    }

    // Persist progress after every batch so an interrupted run is safe.
    save(result);
    process.stdout.write(
      `  ${Math.min(i + BATCH_SIZE, pending.length)}/${pending.length} · total ${result.length}\n`,
    );
    await sleep(DELAY_MS);
  }

  process.stdout.write(`Done. Added ${added}, total ${result.length} entries.\n`);
}

main().catch((err) => {
  process.stderr.write(`Build failed: ${err.message}\n`);
  process.exit(1);
});
