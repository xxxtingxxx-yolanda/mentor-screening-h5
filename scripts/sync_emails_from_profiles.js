const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(process.cwd(), "docs", "data", "mentors.json");
const INLINE_PATH = path.join(process.cwd(), "docs", "data", "mentors.inline.js");
const APP_DATA_PATH = path.join(process.cwd(), "app", "src", "main", "assets", "h5", "data", "mentors.json");
const APP_INLINE_PATH = path.join(process.cwd(), "app", "src", "main", "assets", "h5", "data", "mentors.inline.js");

const UNKNOWN_EMAIL = "\u672A\u516C\u5F00";
const EMAIL_REGEX_GLOBAL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const EMAIL_REGEX_SINGLE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const HINT_REGEX = /(\u90AE\u7BB1|email|e-mail|mail)/i;

function normalizeExistingEmail(raw) {
  if (!raw) return "";

  const value = String(raw)
    .replace(/，/g, ",")
    .replace(/,com/gi, ".com")
    .replace(/\s+/g, "")
    .trim();

  const matched = value.match(EMAIL_REGEX_SINGLE);
  return matched ? matched[0].toLowerCase() : "";
}

function scoreEmailCandidate(email, htmlLower) {
  let score = 0;

  if (email.endsWith("hut.edu.cn")) score += 120;
  if (email.endsWith("edu.cn")) score += 40;
  if (email.endsWith("qq.com") || email.endsWith("163.com") || email.endsWith("126.com")) score += 20;

  const index = htmlLower.indexOf(email);
  if (index >= 0) {
    const start = Math.max(0, index - 40);
    const end = Math.min(htmlLower.length, index + email.length + 40);
    const around = htmlLower.slice(start, end);
    if (HINT_REGEX.test(around)) {
      score += 50;
    }
  }

  return score;
}

function pickEmailFromHtml(html) {
  const matches = html.match(EMAIL_REGEX_GLOBAL) || [];
  if (matches.length === 0) return "";

  const candidates = [...new Set(matches.map((item) => item.toLowerCase()))];
  const htmlLower = html.toLowerCase();

  const ranked = candidates
    .map((email) => ({ email, score: scoreEmailCandidate(email, htmlLower) }))
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.email || "";
}

async function fetchHtml(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.text();
}

async function main() {
  const payload = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const mentors = payload.mentors || [];

  let checked = 0;
  let extractedCount = 0;
  let normalizedCount = 0;
  let toUnknownCount = 0;
  let unchangedCount = 0;
  let fetchFailCount = 0;

  for (const mentor of mentors) {
    const oldRaw = mentor.email || "";
    const oldNormalized = normalizeExistingEmail(oldRaw);
    let nextEmail = "";

    if (mentor.profileUrl) {
      checked += 1;
      try {
        const html = await fetchHtml(mentor.profileUrl);
        nextEmail = pickEmailFromHtml(html);
      } catch (_) {
        fetchFailCount += 1;
      }
    }

    if (nextEmail) {
      mentor.email = nextEmail;
      if (nextEmail !== oldRaw) {
        normalizedCount += 1;
      } else {
        unchangedCount += 1;
      }
      extractedCount += 1;
      continue;
    }

    if (oldNormalized) {
      mentor.email = oldNormalized;
      if (oldNormalized !== oldRaw) {
        normalizedCount += 1;
      } else {
        unchangedCount += 1;
      }
      continue;
    }

    mentor.email = UNKNOWN_EMAIL;
    if (oldRaw !== UNKNOWN_EMAIL) {
      toUnknownCount += 1;
    } else {
      unchangedCount += 1;
    }
  }

  payload.generatedAt = new Date().toISOString().replace("T", " ").slice(0, 19);
  const jsonText = `${JSON.stringify(payload, null, 2)}\n`;
  fs.writeFileSync(DATA_PATH, jsonText, "utf8");
  fs.writeFileSync(INLINE_PATH, `window.__MENTORS_PAYLOAD__ = ${jsonText};\n`, "utf8");
  fs.writeFileSync(APP_DATA_PATH, jsonText, "utf8");
  fs.writeFileSync(APP_INLINE_PATH, `window.__MENTORS_PAYLOAD__ = ${jsonText};\n`, "utf8");

  console.log("mentors:", mentors.length);
  console.log("checked profile pages:", checked);
  console.log("extracted from profile:", extractedCount);
  console.log("normalized/updated:", normalizedCount);
  console.log("set to unknown:", toUnknownCount);
  console.log("fetch failed:", fetchFailCount);
  console.log("unchanged:", unchangedCount);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
