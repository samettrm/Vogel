// One-off: detect duplicate curated-word ids across the German vocab files.
import { readFileSync } from 'node:fs';

const files = [
  'german-nouns', 'german-nouns-extra',
  'german-verbs', 'german-verbs-extra',
  'german-words-extra', 'german-adjectives-extra',
  'german-adverbs-extra', 'german-function-words',
];

const seen = new Map();
const dups = [];
let total = 0;

for (const f of files) {
  const text = readFileSync(new URL(`../lib/${f}.ts`, import.meta.url), 'utf8');
  const re = /^\s*(?:n|v|vn|w|adj|adv|phr|fw)\(\s*'((?:[^'\\]|\\.)*)'/gm;
  let m;
  while ((m = re.exec(text))) {
    const id = m[1];
    total++;
    if (seen.has(id)) dups.push(`${id}  (${seen.get(id)} & ${f})`);
    else seen.set(id, f);
  }
}

console.log(`total entries: ${total}  unique ids: ${seen.size}  dups: ${dups.length}`);
for (const d of dups) console.log('  DUP', d);
