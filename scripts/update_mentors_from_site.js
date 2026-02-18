const fs = require("fs");
const path = require("path");

const htmlPath = path.join(process.cwd(), "tmp_ljyjx.html");
const dataPath = path.join(process.cwd(), "docs", "data", "mentors.json");
const inlinePath = path.join(process.cwd(), "docs", "data", "mentors.inline.js");
const photoDir = path.join(process.cwd(), "docs", "photos");
const baseUrl = "https://art.hut.edu.cn/";
const defaultPhoto = "photos/mentor-placeholder.svg";

const directionSet = new Set(["包装设计", "传达与媒体设计", "产品设计", "环境设计"]);

function cleanText(raw) {
  return (raw || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(raw) {
  const value = (raw || "").trim();
  if (!value) return "";
  try {
    return new URL(value, baseUrl).href;
  } catch {
    return "";
  }
}

function getDirectionOrder(direction) {
  const order = {
    包装设计: 1,
    传达与媒体设计: 2,
    产品设计: 3,
    环境设计: 4
  };
  return order[direction] || 99;
}

function getTitleOrder(title) {
  if (title === "教授") return 1;
  if (title === "副教授") return 2;
  return 9;
}

function getCareerTags(direction) {
  switch (direction) {
    case "包装设计":
      return ["包装", "品牌", "视觉", "文创", "材料", "结构", "安全", "可持续"];
    case "传达与媒体设计":
      return ["数字媒体", "动画", "交互", "沉浸", "影像", "展示", "新媒体", "叙事"];
    case "产品设计":
      return ["产品", "工业设计", "服务设计", "创新", "装备", "家电", "机器人", "用户体验"];
    case "环境设计":
      return ["环境", "空间", "景观", "城乡", "建筑", "乡村", "低碳", "文旅"];
    default:
      return ["设计"];
  }
}

function extractResearch(desc, fallback) {
  const m1 = desc.match(/【研究方向[:：]([^】]+)】/);
  if (m1) return cleanText(m1[1]);
  const m2 = desc.match(/研究方向[:：]\s*([^。；;\n]+)/);
  if (m2) return cleanText(m2[1]);
  return fallback || "待补充";
}

function splitSkillTags(researchAreas) {
  const tokens = (researchAreas || "")
    .replace(/[（(][^）)]*[）)]/g, " ")
    .split(/[、，,；;。/\s]+/)
    .map((item) => item.trim())
    .filter((item) => item && item.length >= 2 && item.length <= 24);
  return [...new Set(tokens)].slice(0, 14);
}

function parseSiteMentors(html) {
  const parsed = [];
  const directionMatches = [...html.matchAll(/<div class="title">([^<]+)<\/div>/g)];

  for (let i = 0; i < directionMatches.length; i += 1) {
    const direction = cleanText(directionMatches[i][1]);
    if (!directionSet.has(direction)) continue;

    const start = directionMatches[i].index;
    const end = i < directionMatches.length - 1 ? directionMatches[i + 1].index : html.length;
    const directionSegment = html.slice(start, end);

    const rankMatches = [...directionSegment.matchAll(/<span class="p-name">([^<]+)<\/span>/g)];
    for (let r = 0; r < rankMatches.length; r += 1) {
      const title = cleanText(rankMatches[r][1]);
      const rStart = rankMatches[r].index;
      const rEnd = r < rankMatches.length - 1 ? rankMatches[r + 1].index : directionSegment.length;
      const rankSegment = directionSegment.slice(rStart, rEnd);

      const cardPattern =
        /<a href="([^"]*)"><span>([^<]+)<\/span><\/a>[\s\S]*?<img class="head-img" src="([^"]*)">[\s\S]*?<p class="h-name">\s*([^<]+?)\s*<\/p>[\s\S]*?<p class="h-desc-p">([\s\S]*?)<\/p>/g;
      const cards = [...rankSegment.matchAll(cardPattern)];

      for (const card of cards) {
        const name = cleanText(card[4]) || cleanText(card[2]);
        if (!name) continue;

        parsed.push({
          name,
          direction,
          title,
          profileUrl: normalizeUrl(card[1]),
          photoUrl: normalizeUrl(card[3]),
          notes: cleanText(card[5])
        });
      }
    }
  }

  const uniqMap = new Map();
  for (const item of parsed) {
    if (!uniqMap.has(item.name)) uniqMap.set(item.name, item);
  }

  return [...uniqMap.values()].sort((a, b) => {
    const d = getDirectionOrder(a.direction) - getDirectionOrder(b.direction);
    if (d !== 0) return d;
    const t = getTitleOrder(a.title) - getTitleOrder(b.title);
    if (t !== 0) return t;
    return a.name.localeCompare(b.name, "zh-CN");
  });
}

async function downloadIfNeeded(url, targetPath) {
  if (!url) return false;
  try {
    const response = await fetch(url);
    if (!response.ok) return false;
    const buffer = Buffer.from(await response.arrayBuffer());
    if (!buffer.length) return false;
    fs.writeFileSync(targetPath, buffer);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const html = fs.readFileSync(htmlPath, "utf8");
  const siteMentors = parseSiteMentors(html);

  const payload = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const mentors = payload.mentors;
  const byName = new Map(mentors.map((mentor) => [mentor.name, mentor]));

  let updatedCount = 0;
  for (const siteMentor of siteMentors) {
    const existing = byName.get(siteMentor.name);
    if (!existing) continue;

    const researchAreas = extractResearch(siteMentor.notes, existing.researchAreas);
    existing.direction = siteMentor.direction || existing.direction;
    existing.title = siteMentor.title || existing.title;
    existing.researchAreas = researchAreas;
    existing.notes = siteMentor.notes || existing.notes;
    existing.profileUrl = siteMentor.profileUrl || existing.profileUrl || "";
    existing.officialPhotoUrl = siteMentor.photoUrl || existing.officialPhotoUrl || "";
    const skillTags = splitSkillTags(researchAreas);
    if (skillTags.length > 0) existing.skillTags = skillTags;
    existing.careerTags = getCareerTags(existing.direction);
    existing.searchText = `${existing.name} ${existing.direction} ${existing.researchAreas} ${existing.notes}`.trim();
    updatedCount += 1;
  }

  const idNums = mentors
    .map((mentor) => Number((mentor.id || "").replace("mentor-", "")))
    .filter((num) => Number.isFinite(num));
  let nextIdNum = idNums.length > 0 ? Math.max(...idNums) + 1 : 1;

  const addedNames = [];
  for (const siteMentor of siteMentors) {
    if (byName.has(siteMentor.name)) continue;

    const id = `mentor-${String(nextIdNum).padStart(3, "0")}`;
    nextIdNum += 1;

    let photoPath = defaultPhoto;
    if (siteMentor.photoUrl) {
      const extFromUrl = path.extname(new URL(siteMentor.photoUrl).pathname) || ".jpg";
      const ext = extFromUrl.length <= 5 ? extFromUrl.toLowerCase() : ".jpg";
      const photoFileName = `${id}${ext}`;
      const localPhotoPath = path.join(photoDir, photoFileName);
      const downloaded = await downloadIfNeeded(siteMentor.photoUrl, localPhotoPath);
      if (downloaded) {
        photoPath = `photos/${photoFileName}`;
      }
    }

    const researchAreas = extractResearch(siteMentor.notes, "待补充");

    const mentor = {
      id,
      name: siteMentor.name,
      direction: siteMentor.direction,
      title: siteMentor.title,
      researchAreas,
      origin: "未公开",
      birthYear: "未公开",
      email: "未公开",
      notes: siteMentor.notes || "待补充",
      profileUrl: siteMentor.profileUrl || "",
      officialPhotoUrl: siteMentor.photoUrl || "",
      photoPath,
      allowDirectApply: false,
      skillTags: splitSkillTags(researchAreas),
      careerTags: getCareerTags(siteMentor.direction),
      searchText: `${siteMentor.name} ${siteMentor.direction} ${researchAreas} ${siteMentor.notes || ""}`.trim()
    };

    mentors.push(mentor);
    byName.set(mentor.name, mentor);
    addedNames.push(mentor.name);
  }

  payload.generatedAt = new Date().toISOString().replace("T", " ").slice(0, 19);
  payload.source = "https://art.hut.edu.cn/ljyjx.htm（教育教学 > 研究生教育 > 导师列表）";
  payload.count = mentors.length;

  const jsonText = `${JSON.stringify(payload, null, 2)}\n`;
  fs.writeFileSync(dataPath, jsonText, "utf8");
  fs.writeFileSync(inlinePath, `window.__MENTORS_PAYLOAD__ = ${jsonText};\n`, "utf8");

  console.log("site mentors:", siteMentors.length);
  console.log("updated mentors:", updatedCount);
  console.log("added mentors:", addedNames.length ? addedNames.join("、") : "none");
  console.log("final count:", payload.count);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
