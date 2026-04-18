import json
from pathlib import Path


IN_PATH = Path("n8n-workflows-export-pretty.json")
OUT_PATH = Path("n8n-workflows-updated.json")


TAIL = r"""
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
""".lstrip("\n")


def main() -> None:
    data = json.loads(IN_PATH.read_text(encoding="utf-8"))
    node = next(n for n in data[0]["nodes"] if n.get("name") == "Build Response Code")
    js = node["parameters"]["jsCode"]

    # We only replace the matching section, keeping extraction intact.
    marker = "// ---------------- therapist matching"
    pos = js.find(marker)
    if pos < 0:
        raise RuntimeError(f"marker not found: {marker}")

    node["parameters"]["jsCode"] = js[:pos] + TAIL
    OUT_PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


if __name__ == "__main__":
    main()

