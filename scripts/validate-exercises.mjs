// ════════════════════════════════════════════════════════════════
// VOGEL EXERCISE VALIDATOR
//
// Kullanım:
//   node scripts/validate-exercises.mjs > scripts/validator-report.txt
//
// Tüm tr-de-{a1,a2,b1,b2,c1}.ts dosyalarındaki exercise'ları tarar,
// muhtemel hataları bulup rapor eder.
//
// Kontroller:
//   1. multipleChoice: correctOptionId options arasında mı?
//   2. translate:      correctAnswer'in tüm kelimeleri wordBank'te mi?
//   3. fillBlank:      correctAnswer wordBank'te mi?
//   4. listen:         audioText === correctAnswer? wordBank tutarlı mı?
//   5. Duplicate ID:   Aynı id ile iki exercise var mı?
//   6. Türkçe karakter: prompt/question/text'lerde "yapilir" gibi
//                       ı kullanılmamış kelimeleri tespit et
// ════════════════════════════════════════════════════════════════

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const coursesDir = join(__dirname, '..', 'src', 'data', 'courses');

const files = [
  'tr-de-a1.ts',
  'tr-de-a2.ts',
  'tr-de-b1.ts',
  'tr-de-b2.ts',
  'tr-de-c1.ts',
];

// ────────────────────────────────────────────────────────────────
// Helper: '...' içindeki string'i yakala (escape edilmiş \' destekli)
// ────────────────────────────────────────────────────────────────
function extractString(text, pattern) {
  const re = new RegExp(`${pattern}\\s*:\\s*'((?:[^'\\\\]|\\\\.)*)'`);
  const m = text.match(re);
  if (!m) return null;
  return m[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\');
}

// ────────────────────────────────────────────────────────────────
// Helper: wordBank: [...] arrayini parse et
// ────────────────────────────────────────────────────────────────
function extractWordBank(text) {
  const m = text.match(/wordBank\s*:\s*\[([^\]]+)\]/);
  if (!m) return null;
  const raw = m[1];
  const words = [];
  const re = /'((?:[^'\\]|\\.)*)'/g;
  let mm;
  while ((mm = re.exec(raw)) !== null) {
    words.push(mm[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\'));
  }
  return words;
}

// ────────────────────────────────────────────────────────────────
// Helper: options: [{ id: 'a', text: '...' }, ...] dizisini parse
// ────────────────────────────────────────────────────────────────
function extractOptions(text) {
  const m = text.match(/options\s*:\s*\[(.+?)\]\s*,\s*correctOptionId/);
  if (!m) return null;
  const raw = m[1];
  const ids = [];
  const re = /\{\s*id\s*:\s*'([^']+)'/g;
  let mm;
  while ((mm = re.exec(raw)) !== null) {
    ids.push(mm[1]);
  }
  return ids;
}

// ────────────────────────────────────────────────────────────────
// Helper: bir cümleyi kelimelere ayır (noktalama dahil)
// "Ich habe gegessen." → ['Ich', 'habe', 'gegessen.']
// wordBank match için noktalamayı temizleyebiliriz
// ────────────────────────────────────────────────────────────────
function tokenize(sentence) {
  return sentence.trim().split(/\s+/);
}

// ────────────────────────────────────────────────────────────────
// Türkçe karakter eksikliği detector
// Türkçe metinde olması beklenen ama olmayan ı/ş/ğ/ü/ö/ç
// ────────────────────────────────────────────────────────────────
const TR_SUSPICIOUS_WORDS = [
  // Yazım kontrolü — "ı" eksik tespit
  /\b(yapilir|yapilan|kosuyor|kosar|cocuk|gormek|gorduğum|sevimli|bilgi|degil|guzel|dogru|gunluk|gunaydin|sabah|saat|merhaba|tesekkur|lutfen|ozur|ucretsiz|aksam|olmak|kalmak|yapmak|gitmek|gelmek|bekleme|bilmiyorum|anliyorum|seviyorum|istiyor|kazaniyorum)\b/gi,
];

// Türkçe yer/diller/şehirler
const TR_PROPER_NOUNS_OK = [
  'almanya', 'turkiye', 'turkce', 'almanca', 'ingilizce', 'fransizca',
  'berlin', 'munih', 'hamburg', 'koln', 'istanbul', 'ankara', 'izmir',
];

// ────────────────────────────────────────────────────────────────
// Main: dosya dosya işle
// ────────────────────────────────────────────────────────────────
const errors = [];
const warnings = [];
const allIds = new Map(); // id → {file, lineNum}
let totalExercises = 0;

for (const file of files) {
  const fullPath = join(coursesDir, file);
  let content;
  try {
    content = readFileSync(fullPath, 'utf8');
  } catch (e) {
    console.error(`❌ Cannot read ${file}: ${e.message}`);
    continue;
  }

  const lines = content.split('\n');

  lines.forEach((line, lineIndex) => {
    const lineNum = lineIndex + 1;

    // Sadece exercise satırlarını yakala
    const idMatch = line.match(/id\s*:\s*'(tr-de-[a-c]\d-u\d+-l\d+-e\d+)'/);
    if (!idMatch) return;

    const id = idMatch[1];
    totalExercises++;

    // Duplicate ID kontrolü
    if (allIds.has(id)) {
      errors.push({
        file,
        lineNum,
        id,
        type: 'DUPLICATE_ID',
        msg: `Aynı id daha önce kullanılmış: ${allIds.get(id).file}:${allIds.get(id).lineNum}`,
      });
    } else {
      allIds.set(id, { file, lineNum });
    }

    // Type tespit
    const typeMatch = line.match(/type\s*:\s*'([^']+)'/);
    if (!typeMatch) return;
    const type = typeMatch[1];

    // ─── multipleChoice ─────────────────────────────────────
    if (type === 'multipleChoice') {
      const correctIdMatch = line.match(/correctOptionId\s*:\s*'([^']+)'/);
      const optionIds = extractOptions(line);
      if (correctIdMatch && optionIds) {
        const correctId = correctIdMatch[1];
        if (!optionIds.includes(correctId)) {
          errors.push({
            file,
            lineNum,
            id,
            type,
            msg: `correctOptionId '${correctId}' options arasında YOK. Mevcut options: [${optionIds.join(', ')}]`,
          });
        }
        if (optionIds.length < 2) {
          errors.push({
            file,
            lineNum,
            id,
            type,
            msg: `multipleChoice'da en az 2 option olmalı, mevcut: ${optionIds.length}`,
          });
        }
        // Tüm correctOptionId'lerin 'a' olduğunu kontrol etmek için
        // dataset bias olarak warning olarak işaretleyelim
        // (sonra global olarak kaç tane 'a' var diye sayacağız)
      }
    }

    // ─── translate / listen / fillBlank ─────────────────────
    if (type === 'translate' || type === 'listen' || type === 'fillBlank') {
      const correctAnswer = extractString(line, 'correctAnswer');
      const wordBank = extractWordBank(line);

      if (correctAnswer === null) {
        errors.push({
          file,
          lineNum,
          id,
          type,
          msg: 'correctAnswer alanı bulunamadı veya parse edilemedi',
        });
        return;
      }

      if (wordBank === null) {
        errors.push({
          file,
          lineNum,
          id,
          type,
          msg: 'wordBank alanı bulunamadı veya parse edilemedi',
        });
        return;
      }

      // fillBlank için tek kelime kontrolü
      if (type === 'fillBlank') {
        // correctAnswer tek kelime olabilir veya birkaç kelime
        // (örn: "klipp und" gibi composite)
        const correctTokens = tokenize(correctAnswer);
        if (correctTokens.length === 1) {
          if (!wordBank.includes(correctAnswer)) {
            errors.push({
              file,
              lineNum,
              id,
              type,
              msg: `fillBlank correctAnswer '${correctAnswer}' wordBank'te YOK. wordBank: [${wordBank.join(', ')}]`,
            });
          }
        } else {
          // Multi-word fillBlank (nadir) — composite string kontrol
          if (!wordBank.includes(correctAnswer)) {
            warnings.push({
              file,
              lineNum,
              id,
              type,
              msg: `fillBlank composite correctAnswer '${correctAnswer}' wordBank'te direkt yok. wordBank: [${wordBank.join(', ')}]`,
            });
          }
        }
      }

      // translate ve listen için kelime kelime kontrolü
      if (type === 'translate' || type === 'listen') {
        const correctTokens = tokenize(correctAnswer);
        const missingTokens = correctTokens.filter((t) => !wordBank.includes(t));
        if (missingTokens.length > 0) {
          errors.push({
            file,
            lineNum,
            id,
            type,
            msg: `correctAnswer kelimeleri wordBank'te EKSİK: [${missingTokens.join(', ')}]\n    correctAnswer: "${correctAnswer}"\n    wordBank: [${wordBank.join(', ')}]`,
          });
        }
      }
    }

    // ─── listen ek kontrol: audioText === correctAnswer? ───
    if (type === 'listen') {
      const audioText = extractString(line, 'audioText');
      const correctAnswer = extractString(line, 'correctAnswer');
      if (audioText !== null && correctAnswer !== null && audioText !== correctAnswer) {
        errors.push({
          file,
          lineNum,
          id,
          type,
          msg: `audioText ≠ correctAnswer!\n    audioText:     "${audioText}"\n    correctAnswer: "${correctAnswer}"`,
        });
      }
    }

    // ─── Türkçe karakter eksikliği (warning) ────────────────
    // Sadece prompt ve question alanları için
    const promptMatch = line.match(/prompt\s*:\s*'((?:[^'\\]|\\.)*)'/);
    const questionMatch = line.match(/question\s*:\s*'((?:[^'\\]|\\.)*)'/);
    const texts = [];
    if (promptMatch) texts.push({ field: 'prompt', value: promptMatch[1] });
    if (questionMatch) texts.push({ field: 'question', value: questionMatch[1] });

    for (const { field, value } of texts) {
      for (const pattern of TR_SUSPICIOUS_WORDS) {
        const matches = value.match(pattern);
        if (matches) {
          // Filter out OK proper nouns
          const real = matches.filter(
            (m) => !TR_PROPER_NOUNS_OK.includes(m.toLowerCase()),
          );
          if (real.length > 0) {
            warnings.push({
              file,
              lineNum,
              id,
              type: 'TR_CHAR',
              msg: `${field}: '${value}' — şüpheli kelime(ler): [${real.join(', ')}]`,
            });
          }
        }
      }
    }
  });
}

// ────────────────────────────────────────────────────────────────
// Rapor
// ────────────────────────────────────────────────────────────────
const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';

console.log(`${BOLD}${CYAN}═══════════════════════════════════════════════════════════════${RESET}`);
console.log(`${BOLD}${CYAN}  🦅 VOGEL EXERCISE VALIDATOR — RAPOR${RESET}`);
console.log(`${BOLD}${CYAN}═══════════════════════════════════════════════════════════════${RESET}\n`);

console.log(`📊 ${BOLD}Genel İstatistik${RESET}`);
console.log(`   Toplam exercise sayısı: ${totalExercises}`);
console.log(`   ${RED}Hata: ${errors.length}${RESET}`);
console.log(`   ${YELLOW}Uyarı: ${warnings.length}${RESET}\n`);

// Hataları dosya bazlı grupla
const byFile = {};
for (const err of errors) {
  if (!byFile[err.file]) byFile[err.file] = [];
  byFile[err.file].push(err);
}

if (errors.length > 0) {
  console.log(`${BOLD}${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
  console.log(`${BOLD}${RED}  ❌ HATALAR (${errors.length})${RESET}`);
  console.log(`${BOLD}${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n`);

  for (const file of Object.keys(byFile)) {
    console.log(`\n${BOLD}📁 ${file} (${byFile[file].length} hata)${RESET}`);
    for (const err of byFile[file]) {
      console.log(`\n  ${RED}❌ ${file}:${err.lineNum}${RESET}`);
      console.log(`     id: ${err.id}`);
      console.log(`     type: ${err.type}`);
      console.log(`     msg: ${err.msg}`);
    }
  }
}

// Uyarıları dosya bazlı grupla
const warnByFile = {};
for (const w of warnings) {
  if (!warnByFile[w.file]) warnByFile[w.file] = [];
  warnByFile[w.file].push(w);
}

if (warnings.length > 0) {
  console.log(`\n\n${BOLD}${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
  console.log(`${BOLD}${YELLOW}  ⚠️  UYARILAR (${warnings.length})${RESET}`);
  console.log(`${BOLD}${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n`);

  for (const file of Object.keys(warnByFile)) {
    console.log(`\n${BOLD}📁 ${file} (${warnByFile[file].length} uyarı)${RESET}`);
    for (const w of warnByFile[file]) {
      console.log(`\n  ${YELLOW}⚠️  ${file}:${w.lineNum}${RESET}`);
      console.log(`     id: ${w.id}`);
      console.log(`     type: ${w.type}`);
      console.log(`     msg: ${w.msg}`);
    }
  }
}

console.log(`\n${BOLD}${CYAN}═══════════════════════════════════════════════════════════════${RESET}`);
if (errors.length === 0 && warnings.length === 0) {
  console.log(`${BOLD}${GREEN}  ✅ Tüm exercise'lar valid! Hiç hata bulunamadı.${RESET}`);
} else {
  console.log(`${BOLD}  📋 Özet: ${RED}${errors.length} hata${RESET}, ${YELLOW}${warnings.length} uyarı${RESET}`);
}
console.log(`${BOLD}${CYAN}═══════════════════════════════════════════════════════════════${RESET}`);

// Exit code
process.exit(errors.length > 0 ? 1 : 0);
