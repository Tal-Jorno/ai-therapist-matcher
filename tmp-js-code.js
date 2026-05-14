// Build Response Code
// Heuristic extraction only (no LLM).
// Detect: problem, city, language, therapy_type. Empty string if not detected.
// Keep response schema stable: { assistant_message, result: { top5, reasons, extraction } }

function clean(s) {
  return (s ?? '').toString().replace(/\s+/g, ' ').trim();
}

function lower(s) {
  return clean(s).toLowerCase();
}

function uniqNonEmpty(arr) {
  const out = [];
  const seen = new Set();
  for (const v of (arr ?? [])) {
    const c = clean(v);
    if (!c) continue;
    const k = c.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(c);
  }
  return out;
}

function matchIndex(re, text) {
  // Returns the first match index, or Infinity if no match.
  // Note: do not use global regexes here.
  try {
    const m = re.exec(text);
    return m ? m.index : Infinity;
  } finally {
    // Defensive: reset lastIndex if someone accidentally passed /g
    re.lastIndex = 0;
  }
}

function bestMatch(defs, text) {
  // defs: [{ value, res: [RegExp, ...] }]
  let bestValue = '';
  let bestIdx = Infinity;
  for (const d of defs) {
    for (const re of (d.res ?? [])) {
      const idx = matchIndex(re, text);
      if (idx < bestIdx) {
        bestIdx = idx;
        bestValue = d.value;
      }
    }
  }
  return bestIdx < Infinity ? bestValue : '';
}

// ---------------- final field cleanup helpers ----------------
const LANG_WORDS = ['english', 'hebrew', 'ivrit', 'arabic', 'russian', 'french', 'spanish'];

function cleanCityValue(s) {
  let x = clean(s);
  if (!x) return '';

  // Cut city if user continues the sentence: "Tel Aviv who speaks English" -> "Tel Aviv"
  x = x.replace(/\s+\b(?:who|that|which|for|with|therapist|therapy|counsel(?:or|ing)?|psycholog(?:ist|y)|speaks?|speaking)\b[\s\S]*$/iu, '');
  // "in English" is commonly appended and should not be part of the city
  x = x.replace(/\s+\bin\s+\b(?:english|hebrew|ivrit|arabic|russian|french|spanish)\b[\s\S]*$/iu, '');
  x = x.replace(/[\.,;:!\?\)\]]+$/g, '');
  x = clean(x);

  // Remove trailing connector words if they remain at the end
  let parts = x.split(' ').filter(Boolean);
  while (parts.length && /^(?:in|near|around|from|for|with|at|on|of)$/iu.test(parts[parts.length - 1])) parts.pop();
  x = clean(parts.join(' '));

  const xL = x.toLowerCase();
  if (!x) return '';
  if (LANG_WORDS.includes(xL)) return '';
  if (x.length < 2) return '';
  return x;
}

function cleanProblemFallbackText(raw) {
  let fb = clean(raw);
  if (!fb) return '';

  // Remove leading boilerplate but keep the actual problem description.
  fb = fb.replace(/^\b(?:i\s*am|i'm|im|we\s*are|we're|were|we)\s+(?:looking\s+for|searching\s+for|seeking)\b\s*/iu, '');
  fb = fb.replace(/^\b(?:i|we)\s+(?:need|want)\b\s*/iu, '');
  fb = fb.replace(/^\b(?:looking\s+for|searching\s+for|seeking)\b\s*/iu, '');
  fb = fb.replace(/^\b(?:find\s+me|get\s+me)\b\s*/iu, '');

  // Remove therapist/therapy words (and optional preceding article)
  fb = fb.replace(/\b(?:a|an|the)\s+(?:therapist|therapy|counsel(?:or|ing)?|psycholog(?:ist|y)|psychotherapy)\b/igu, ' ');
  fb = fb.replace(/\b(?:therapist|therapy|counsel(?:or|ing)?|psycholog(?:ist|y)|psychotherapy)\b/igu, ' ');

  // Remove language mentions
  fb = fb.replace(/\b(in\s+)?(english|hebrew|ivrit|arabic|russian|french|spanish)\b/igu, ' ');
  fb = fb.replace(/אנגלית|עברית|ערבית|רוסית|צרפתית|ספרדית/gu, ' ');
  // Remove therapy type mentions
  fb = fb.replace(/\b(cbt|emdr|psychodynamic|mindfulness|mbsr|mbct)\b/igu, ' ');
  fb = fb.replace(/קוגניטיבי\s*התנהגותי|טיפול\s*זוגי|טיפול\s*משפחתי|פסיכודינמי|מיינדפולנס/gu, ' ');
  // Remove simple location phrase
  fb = fb.replace(/\b(?:in|near|around|from)\s+[A-Za-z][A-Za-z'\-]*(?:\s+[A-Za-z][A-Za-z'\-]*){0,3}\b/igu, ' ');

  // Remove leftover filler words
  fb = fb.replace(/\b(?:please|pls|thanks|thank\s+you)\b/igu, ' ');
  fb = clean(fb);
  fb = fb.replace(/^(?:for|with|about|regarding)\s+/iu, '');
  fb = fb.replace(/\s+(?:please|pls)$/iu, '');
  fb = clean(fb);

  if (fb.length > 140) fb = clean(fb.slice(0, 140));

  // If it's too short / meaningless, return empty.
  const words = fb.split(' ').filter(Boolean);
  if (words.length <= 1) return '';
  if (/^(?:i|me|my|mine|we|us|our)$/iu.test(fb)) return '';
  return fb;
}

const input = $input.first().json;
const body = input.body ?? input;

// From backend payload: { message, available_therapists, conversation, ... }
const message = clean(body.message ?? body.text ?? body.user_message ?? input.message ?? input.text);
const mL = lower(message);

const extraction = {
  problem: '',
  city: '',
  language: '',
  therapy_type: '',
};

// ---------------- language ----------------
const languageDefs = [
  {
    value: 'English',
    res: [
      /\b(english)\b/iu,
      /\b(in|speak|speaking|prefer|preferred)\s+english\b/iu,
      /\benglish\s*(please|pls)\b/iu,
      /אנגלית|באנגלית/iu,
    ],
  },
  {
    value: 'Hebrew',
    res: [
      /\b(hebrew|ivrit)\b/iu,
      /\b(in|speak|speaking|prefer|preferred)\s+(hebrew|ivrit)\b/iu,
      /עברית|בעברית/iu,
    ],
  },
  {
    value: 'Arabic',
    res: [
      /\b(arabic)\b/iu,
      /\b(in|speak|speaking|prefer|preferred)\s+arabic\b/iu,
      /ערבית|בערבית/iu,
      /\bعربي\b|باللغة\s*العربية|العربية/iu,
    ],
  },
  {
    value: 'Russian',
    res: [
      /\b(russian)\b/iu,
      /\b(in|speak|speaking|prefer|preferred)\s+russian\b/iu,
      /רוסית|ברוסית/iu,
      /русск(ий|ого|ом)|по-русски|на\s+русском/iu,
    ],
  },
  {
    value: 'French',
    res: [
      /\b(french)\b/iu,
      /\b(in|speak|speaking|prefer|preferred)\s+french\b/iu,
      /צרפתית|בצרפתית/iu,
      /fran[çc]ais|en\s+fran[çc]ais/iu,
    ],
  },
  {
    value: 'Spanish',
    res: [
      /\b(spanish)\b/iu,
      /\b(in|speak|speaking|prefer|preferred)\s+spanish\b/iu,
      /ספרדית|בספרדית/iu,
      /espa[ñn]ol|en\s+espa[ñn]ol/iu,
    ],
  },
];

extraction.language = bestMatch(languageDefs, message);

// ---------------- therapy_type ----------------
// Only these values are allowed per current response contract.
const therapyTypeDefs = [
  {
    value: 'CBT',
    res: [
      /\bcbt\b/iu,
      /\bcognitive\s*(behavior(al)?|behaviour(al)?)\b/iu,
      /קוגניטיבי\s*התנהגותי|סי\s*בי\s*טי/iu,
    ],
  },
  {
    value: 'Psychodynamic',
    res: [
      /\bpsychodynamic\b/iu,
      /\bpsycho\s*-?dynamic\b/iu,
      /פסיכודינמי/iu,
    ],
  },
  {
    value: 'Couples Therapy',
    res: [
      /\b(couples?|marriage)\s+(therapy|counsel(ing)?)\b/iu,
      /\b(couples?|couple|marriage)\b/iu,
      /טיפול\s*זוגי/iu,
    ],
  },
  {
    value: 'Family Therapy',
    res: [
      /\bfamily\s+(therapy|counsel(ing)?)\b/iu,
      /טיפול\s*משפחתי/iu,
    ],
  },
  {
    value: 'Trauma Therapy',
    res: [
      /\btrauma\s+therapy\b/iu,
      /\b(ptsd|cptsd)\b/iu,
      /\btrauma\b/iu,
      /טראומ(ה|טי)/iu,
    ],
  },
  {
    value: 'EMDR',
    res: [
      /\bemdr\b/iu,
      /eye\s*movement\s*desensitization\s*and\s*reprocessing/iu,
      /אי\s*אם\s*די\s*אר/iu,
    ],
  },
  {
    value: 'Mindfulness-Based Therapy',
    res: [
      /\bmindfulness\b/iu,
      /\b(mbsr|mbct)\b/iu,
      /mindfulness\s*-?based/iu,
      /מיינדפולנס|קשיבות/iu,
    ],
  },
];

extraction.therapy_type = bestMatch(therapyTypeDefs, message);

// ---------------- city ----------------
// Prefer matching a city that exists in the therapists list (simple & accurate).
const cities = uniqNonEmpty((body.available_therapists ?? []).map(t => t?.city));
// Try longer city names first to avoid partial matches
cities.sort((a, b) => b.length - a.length);

for (const c of cities) {
  const cL = c.toLowerCase();
  if (cL && mL.includes(cL)) {
    extraction.city = c;
    break;
  }
}

// Fallback (English): "in <city>" / "near <city>" / "around <city>" / "from <city>"
if (!extraction.city) {
  const m = message.match(/\b(?:in|near|around|from)\s+([A-Za-z][A-Za-z'\-]*(?:\s+[A-Za-z][A-Za-z'\-]*){0,3})\b/i);
  if (m) {
    const candidate = clean(m[1]).replace(/[\.,;:!\?\)\]]+$/g, '');
    // Avoid confusing language words ("in English") with cities
    const candidateL = candidate.toLowerCase();
    const isLanguageWord = LANG_WORDS.includes(candidateL);
    if (candidate && !isLanguageWord) extraction.city = candidate;
  }
}

// Final city cleanup (applies to both the therapists-list match and fallback regex)
extraction.city = cleanCityValue(extraction.city);

// ---------------- problem ----------------
// Structured categories from keyword heuristics.
// Must remain a string in extraction.problem.
const problemDefs = [
  {
    value: 'Anxiety',
    res: [
      /\b(anxiety|anxious|worry|overthinking)\b/iu,
      /\bpanic(\s+attacks?)?\b/iu,
      /חרד(ה|הים|ות)|פאניק(ה|ות)/iu,
    ],
  },
  {
    value: 'Depression',
    res: [
      /\b(depression|depressed|low\s+mood)\b/iu,
      /דיכאון|דיכאוני/iu,
    ],
  },
  {
    value: 'Trauma',
    res: [
      /\b(ptsd|cptsd)\b/iu,
      /\btrauma(tic)?\b/iu,
      /טראומ(ה|טי)/iu,
    ],
  },
  {
    value: 'Relationship Issues',
    res: [
      /\b(relationship|partner|boyfriend|girlfriend|spouse|marriage)\b/iu,
      /\b(break\s*up|divorce|separation|infidelity|cheating)\b/iu,
      /זוגיות|פרידה|גירושין|בגידה/iu,
    ],
  },
  {
    value: 'Family Issues',
    res: [
      /\b(family|parents?|mother|father|siblings?|in-?laws)\b/iu,
      /\b(parenting|family\s+conflict)\b/iu,
      /משפחה|הורים|אמא|אבא|אחים|אחיות|חמי|חמות/iu,
    ],
  },
  {
    value: 'Self-Esteem',
    res: [
      /\b(self\s*-?esteem|self\s*-?worth|confidence)\b/iu,
      /דימוי\s*עצמי|ביטחון\s*עצמי/iu,
    ],
  },
  {
    value: 'Eating Disorders',
    res: [
      /\b(eating\s+disorder|anorexia|bulimia|binge\s*eating)\b/iu,
      /הפרעת\s*אכילה|אנורקסיה|בולימיה|בולמי/iu,
    ],
  },
  {
    value: 'OCD',
    res: [
      /\bocd\b/iu,
      /\bobsessive\s+compulsive\b/iu,
      /אובסס|קומפולס/iu,
    ],
  },
  {
    value: 'ADHD',
    res: [
      /\badhd\b/iu,
      /\badd\b/iu,
      /\battention\s+deficit\b/iu,
      /קשב\s*וריכוז|הפרעת\s*קשב/iu,
    ],
  },
  {
    value: 'Grief',
    res: [
      /\b(grief|bereave(d|ment)|loss|mourning)\b/iu,
      /אבל|אובדן|שכול/iu,
    ],
  },
];

// Pick up to 2 categories, ordered by first appearance in the message.
{
  const hits = [];
  for (const d of problemDefs) {
    let idx = Infinity;
    for (const re of (d.res ?? [])) idx = Math.min(idx, matchIndex(re, message));
    if (idx < Infinity) hits.push({ value: d.value, idx });
  }
  hits.sort((a, b) => a.idx - b.idx);
  const picked = uniqNonEmpty(hits.map(h => h.value)).slice(0, 2);
  if (picked.length) extraction.problem = picked.join(', ');
}

// Fallback: if no structured problem found, use a cleaned version of the message.
if (!extraction.problem) {
  extraction.problem = cleanProblemFallbackText(message);
}

// ---------------- therapist matching ----------------
// Use available_therapists[] + extracted fields to produce:
// - result.top5 = top 5 matched therapists
// - result.reasons = short reasons aligned to top5 order

const therapists = Array.isArray(body.available_therapists) ? body.available_therapists : [];

const reqCity = clean(extraction.city);
const reqLanguage = clean(extraction.language);
const reqTherapy = clean(extraction.therapy_type);
const reqProblem = clean(extraction.problem);

function norm(s) {
  return lower(s).replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}
function inc(h, n) {
  h = norm(h);
  n = norm(n);
  return !!h && !!n && h.includes(n);
}
function cityMatch(a, b) {
  a = norm(a);
  b = norm(b);
  return !!a && !!b && (a === b || a.includes(b) || b.includes(a));
}

const probSyn = {
  'Anxiety': ['anxiety', 'anxious', 'panic', 'worry', 'overthinking', 'חרדה', 'פאניק'],
  'Depression': ['depression', 'depressed', 'low mood', 'דיכאון'],
  'Trauma': ['trauma', 'ptsd', 'cptsd', 'טראומ'],
  'Relationship Issues': ['relationship', 'relationships', 'partner', 'marriage', 'break up', 'divorce', 'זוגיות', 'גירושין', 'פרידה'],
  'Family Issues': ['family', 'parents', 'parenting', 'mother', 'father', 'משפחה', 'הורים'],
  'Self-Esteem': ['self esteem', 'self-esteem', 'confidence', 'self worth', 'דימוי עצמי', 'ביטחון עצמי'],
  'Eating Disorders': ['eating disorder', 'anorexia', 'bulimia', 'binge', 'הפרעת אכילה', 'אנורקסיה', 'בולימיה'],
  'OCD': ['ocd', 'obsessive', 'compulsive', 'אובסס', 'קומפולס'],
  'ADHD': ['adhd', 'add', 'attention deficit', 'קשב', 'ריכוז'],
  'Grief': ['grief', 'bereavement', 'loss', 'mourning', 'אבל', 'אובדן', 'שכול'],
};

function partsCSV(s) {
  return uniqNonEmpty(clean(s).split(',').map(x => clean(x)));
}

function problemMatch(text) {
  const parts = partsCSV(reqProblem);
  if (!parts.length) return false;
  for (const p of parts) {
    const syns = probSyn[p] ?? [p];
    for (const s of syns) {
      if (inc(text, s)) return true;
    }
  }
  if (parts.length === 1 && parts[0].length >= 4) return inc(text, parts[0]);
  return false;
}

function topItem(t) {
  return {
    ...t,
    user_id: t?.user_id,
    full_name: t?.full_name,
    specialization: t?.specialization,
    languages: t?.languages ?? null,
    city: t?.city ?? null,
    is_online: Boolean(t?.is_online),
    price_per_session: t?.price_per_session ?? null,
  };
}

function mkReason(f) {
  // Build a specific short reason from actual score contributions.
  const p = partsCSV(reqProblem)[0] || reqProblem;
  const clauses = [];

  if (reqCity) {
    if (f.city) clauses.push(`City match (${reqCity})`);
    else if (f.online) clauses.push('Online option (no city match)');
  }

  if (reqLanguage && f.language) clauses.push(`Language match (${reqLanguage})`);
  if (reqTherapy && f.therapy) clauses.push(`Therapy fit (${reqTherapy})`);
  if (reqProblem && f.problem) clauses.push(`Focus on ${p}`);

  // If we have almost no positive signals, still return something helpful.
  if (!clauses.length) {
    if (reqLanguage) return 'Good availability; language fit is less certain';
    if (reqCity) return 'Broader match; consider online or nearby options';
    return 'Broader match based on current availability';
  }

  // If we matched city but missed therapy/problem, call that out.
  const missingNeed = (reqTherapy && !f.therapy) || (reqProblem && !f.problem);
  if (f.city && missingNeed) clauses.push('Broader therapeutic fit');

  // Keep reasons compact (ASCII only).
  const reason = clauses.join(', ');
  return reason.length > 95 ? reason.slice(0, 92).trim() + '...' : reason;
}

const scored = therapists.map((t, i) => {
  let s = 0;
  // Track contributions so reasons are aligned to actual scoring.
  const f = {
    city: false,
    language: false,
    therapy: false,
    problem: false,
    online: false,
    cityPts: 0,
    langPts: 0,
    therapyPts: 0,
    problemPts: 0,
    onlinePts: 0,
  };
  const text = [t?.specialization, t?.bio].filter(Boolean).join(' | ');

  if (reqCity) {
    if (cityMatch(t?.city, reqCity)) {
      s += 4;
      f.city = true;
      f.cityPts = 4;
    } else if (t?.is_online) {
      s += 1;
      f.online = true;
      f.onlinePts = 1;
    }
  }

  if (reqLanguage && inc(t?.languages, reqLanguage)) {
    s += 3;
    f.language = true;
    f.langPts = 3;
  }

  if (reqTherapy && inc(text, reqTherapy)) {
    s += 4;
    f.therapy = true;
    f.therapyPts = 4;
  }

  if (reqProblem && problemMatch(text)) {
    s += 3;
    f.problem = true;
    f.problemPts = 3;
  }

  return { i, t, s, f };
});

scored.sort((a, b) => (b.s - a.s) || (a.i - b.i));

const top = scored.slice(0, 5);
const top5 = top.map(x => topItem(x.t));
const reasons = top.map(x => mkReason(x.f));
const best = top.length ? (top[0].s ?? 0) : 0;

// ---------------- assistant_message quality ----------------
const therapistCount = therapists.length;

// Compute how "strong" a match could be given what the user provided.
const maxPossible =
  (reqCity ? 4 : 0) +
  (reqLanguage ? 3 : 0) +
  (reqTherapy ? 4 : 0) +
  (reqProblem ? 3 : 0);

const strongThreshold = Math.max(4, Math.ceil(maxPossible * 0.65));
const isStrong = maxPossible > 0 ? best >= strongThreshold : best > 0;
const isBroad = therapistCount > 0 && (best === 0 || (maxPossible >= 6 && best < Math.ceil(maxPossible * 0.25)));

const missing = [];
if (!reqCity) missing.push('city');
if (!reqLanguage) missing.push('language');
if (!reqTherapy) missing.push('therapy type');
if (!reqProblem) missing.push('main concern');

let assistant_message = '';
if (therapistCount === 0) {
  assistant_message = 'No therapists are available right now. Please try again later.';
} else if (!top5.length) {
  assistant_message = 'I could not find matches from the current list based on your request.';
} else if (isBroad) {
  assistant_message = `I found ${top5.length} broader match${top5.length === 1 ? '' : 'es'} based on what's currently available.`;
} else {
  assistant_message = `I found ${top5.length} therapist${top5.length === 1 ? '' : 's'} that may fit your request based on your preferences and therapeutic needs.`;
}

// Optionally mention missing info (only when it would help refine matching).
if (missing.length && therapistCount > 0 && top5.length && !isStrong) {
  assistant_message += ` Sharing your ${missing.slice(0, 2).join(' and ')} could help narrow this down.`;
}

return [{ json: { assistant_message, result: { top5, reasons, extraction } } }];
