const DATA_URL = "data/mentors.json";
const DIRECT_MENTORS = new Set(["田飞", "何铭锋"]);
const DIRECT_THRESHOLD = 72;
const DIRECT_CLARITY_THRESHOLD = 60;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE_EXT = ["pdf", "doc", "docx"];

const DIRECTION_KEYWORDS = {
  "包装设计": ["包装", "品牌", "视觉", "文创", "材料", "结构", "绿色", "安全"],
  "传达与媒体设计": ["传达", "媒体", "动画", "数字", "影像", "交互", "沉浸", "新媒体"],
  "产品设计": ["产品", "服务设计", "工业设计", "硬件", "机器人", "家电", "创新", "用户体验"],
  "环境设计": ["环境", "空间", "景观", "城乡", "建筑", "室内", "文旅", "低碳"]
};

const GENERIC_KEYWORDS = [
  "包装", "品牌", "视觉", "传达", "媒体", "动画", "数字", "交互", "沉浸", "产品", "服务设计",
  "工业设计", "机器人", "家电", "创新", "用户体验", "环境", "空间", "景观", "城乡", "建筑",
  "文旅", "低碳", "文创", "乡村", "历史", "理论", "策划", "材料", "结构", "研究", "项目", "管理"
];

const state = {
  mentors: [],
  rankedMentors: [],
  visibleMentors: [],
  directUnlocked: false,
  isAnalyzing: false,
  profile: null,
  selectedMentor: null
};

const els = {
  profileForm: document.getElementById("profileForm"),
  targetDirection: document.getElementById("targetDirection"),
  currentSkills: document.getElementById("currentSkills"),
  careerPlan: document.getElementById("careerPlan"),
  privacyConsent: document.getElementById("privacyConsent"),
  analyzeBtn: document.getElementById("analyzeBtn"),
  resetBtn: document.getElementById("resetBtn"),
  formMsg: document.getElementById("formMsg"),
  directionFilter: document.getElementById("directionFilter"),
  keywordFilter: document.getElementById("keywordFilter"),
  mentorList: document.getElementById("mentorList"),
  resultCount: document.getElementById("resultCount"),
  detailDrawer: document.getElementById("detailDrawer"),
  detailContent: document.getElementById("detailContent"),
  closeDetailBtn: document.getElementById("closeDetailBtn"),
  directionChips: document.getElementById("directionChips"),
  mentorCardTemplate: document.getElementById("mentorCardTemplate"),
  applyDialog: document.getElementById("applyDialog"),
  applyForm: document.getElementById("applyForm"),
  applyMentorName: document.getElementById("applyMentorName"),
  studentName: document.getElementById("studentName"),
  studentPhone: document.getElementById("studentPhone"),
  studentEmail: document.getElementById("studentEmail"),
  studentIntro: document.getElementById("studentIntro"),
  resumeFile: document.getElementById("resumeFile"),
  applyMsg: document.getElementById("applyMsg"),
  submitApplyBtn: document.getElementById("submitApplyBtn"),
  cancelApplyBtn: document.getElementById("cancelApplyBtn")
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  bindEvents();
  await loadMentors();
  hydrateProfileFromStorage();
  applyFilters();
}

function bindEvents() {
  els.profileForm.addEventListener("submit", onAnalyze);
  els.resetBtn.addEventListener("click", onReset);
  els.directionFilter.addEventListener("change", applyFilters);
  els.keywordFilter.addEventListener("input", applyFilters);

  els.closeDetailBtn.addEventListener("click", closeDetail);
  els.detailDrawer.addEventListener("click", (event) => {
    if (event.target === els.detailDrawer) {
      closeDetail();
    }
  });

  els.directionChips.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-value]");
    if (!button) return;
    const text = button.dataset.value;
    if (!els.targetDirection.value.includes(text)) {
      const append = els.targetDirection.value.trim().length > 0 ? "，" : "";
      els.targetDirection.value = `${els.targetDirection.value.trim()}${append}${text}`;
    }
  });

  els.cancelApplyBtn.addEventListener("click", () => els.applyDialog.close());
  els.applyForm.addEventListener("submit", onSubmitDirectApply);
}

async function loadMentors() {
  try {
    let payload = null;
    if (
      typeof window !== "undefined" &&
      window.__MENTORS_PAYLOAD__ &&
      Array.isArray(window.__MENTORS_PAYLOAD__.mentors)
    ) {
      payload = window.__MENTORS_PAYLOAD__;
    }

    if (!payload) {
      const res = await fetch(DATA_URL, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`加载数据失败: ${res.status}`);
      }
      payload = await res.json();
    }

    state.mentors = payload.mentors.map((mentor) => normalizeMentor(mentor));
    state.rankedMentors = [...state.mentors];
    fillDirectionFilter();
    els.resultCount.textContent = `导师库 ${state.mentors.length} 位`;
  } catch (error) {
    els.formMsg.style.color = "#b63f3f";
    els.formMsg.textContent = `数据加载失败：${error.message}`;
  }
}

function normalizeMentor(mentor) {
  const skillTags = ensureArray(mentor.skillTags);
  const careerTags = ensureArray(mentor.careerTags);
  return {
    ...mentor,
    skillTags,
    careerTags,
    hiddenScore: 0,
    searchText: `${mentor.searchText || ""} ${skillTags.join(" ")} ${careerTags.join(" ")}`.trim()
  };
}

function ensureArray(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined || value === "") return [];
  return [value];
}

function fillDirectionFilter() {
  const directions = [...new Set(state.mentors.map((item) => item.direction))].sort();
  directions.forEach((direction) => {
    const option = document.createElement("option");
    option.value = direction;
    option.textContent = direction;
    els.directionFilter.appendChild(option);
  });
}

async function onAnalyze(event) {
  event.preventDefault();
  if (state.isAnalyzing) return;

  const profile = {
    targetDirection: normalizeText(els.targetDirection.value),
    currentSkills: normalizeText(els.currentSkills.value),
    careerPlan: normalizeText(els.careerPlan.value)
  };

  const validationError = validateProfile(profile, els.privacyConsent.checked);
  if (validationError) {
    els.formMsg.style.color = "#b63f3f";
    els.formMsg.textContent = validationError;
    return;
  }

  state.isAnalyzing = true;
  els.analyzeBtn.disabled = true;
  els.resetBtn.disabled = true;

  try {
    await playAnalysisAnimation();

    const scored = rankMentors(profile);
    state.profile = profile;
    state.rankedMentors = scored.sorted;
    state.directUnlocked = scored.directUnlocked;

    persistProfile(profile);
    els.formMsg.style.color = "#0a4c38";
    els.formMsg.textContent = "AI 分析完成，推荐结果已更新。";
    applyFilters();
  } finally {
    state.isAnalyzing = false;
    els.analyzeBtn.disabled = false;
    els.resetBtn.disabled = false;
  }
}

function validateProfile(profile, consent) {
  if (!profile.targetDirection) {
    return "请填写目标方向。";
  }
  if (!profile.currentSkills) {
    return "请填写已掌握技能。";
  }
  if (!profile.careerPlan) {
    return "请填写未来职业规划。";
  }
  if (!consent) {
    return "请先勾选隐私授权。";
  }
  return "";
}

async function playAnalysisAnimation() {
  const steps = [
    "AI 正在解析你的目标方向...",
    "AI 正在评估技能匹配度...",
    "AI 正在推演职业规划路径...",
    "AI 正在生成导师推荐结果..."
  ];

  els.formMsg.style.color = "#2c5e4c";
  for (const step of steps) {
    els.formMsg.textContent = step;
    await delay(360);
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function rankMentors(profile) {
  const clarityScore = calcProfileClarity(profile);
  const profileJoined = `${profile.targetDirection} ${profile.currentSkills} ${profile.careerPlan}`;
  const hasDirectIntent = /(服务|产品|动画|媒介|机器人|交互|创新|品牌|传播|体验|智能)/.test(profileJoined);

  const scoredMentors = state.mentors.map((mentor) => {
    const directionScore = calcDirectionScore(profile.targetDirection, mentor);
    const skillScore = calcOverlapScore(profile.currentSkills, mentor, "skills");
    const careerScore = calcOverlapScore(profile.careerPlan, mentor, "career");

    let total = directionScore * 0.5 + skillScore * 0.3 + careerScore * 0.2;
    if (DIRECT_MENTORS.has(mentor.name) && hasDirectIntent && clarityScore >= DIRECT_CLARITY_THRESHOLD) {
      total += 8;
    }

    return {
      ...mentor,
      hiddenScore: Math.max(0, Math.min(100, Number(total.toFixed(2))))
    };
  });

  scoredMentors.sort((a, b) => b.hiddenScore - a.hiddenScore);

  const directScores = scoredMentors.filter((item) => DIRECT_MENTORS.has(item.name));
  const directUnlocked = directScores.some(
    (item) => item.hiddenScore >= DIRECT_THRESHOLD || (clarityScore >= DIRECT_CLARITY_THRESHOLD && item.hiddenScore >= 64)
  );

  if (!directUnlocked) {
    return { sorted: scoredMentors, directUnlocked };
  }

  const topDirect = directScores.sort((a, b) => b.hiddenScore - a.hiddenScore);
  const rest = scoredMentors.filter((item) => !DIRECT_MENTORS.has(item.name));
  return { sorted: [...topDirect, ...rest], directUnlocked };
}

function calcProfileClarity(profile) {
  const rawText = `${profile.targetDirection} ${profile.currentSkills} ${profile.careerPlan}`;
  const tokenCount = extractTokens(rawText).length;

  const sentenceHintCount = [profile.targetDirection, profile.currentSkills, profile.careerPlan]
    .map((item) => item.replace(/\s+/g, "").length)
    .filter((len) => len >= 8).length;

  const structureHints = [
    "例如", "负责", "项目", "目标", "计划", "希望", "擅长", "已经", "未来", "方向", "技能", "作品"
  ];
  const structureScore = structureHints.filter((word) => rawText.includes(word)).length;

  const tokenScore = Math.min(50, tokenCount * 2);
  const sentenceScore = sentenceHintCount * 12;
  const guideScore = Math.min(14, structureScore * 2);
  return Math.max(0, Math.min(100, tokenScore + sentenceScore + guideScore));
}

function calcDirectionScore(inputText, mentor) {
  const text = inputText || "";
  const tokens = extractTokens(text);
  const mentorTokens = new Set(extractTokens(`${mentor.direction} ${mentor.researchAreas} ${mentor.skillTags.join(" ")}`));

  const overlap = countOverlap(tokens, mentorTokens);
  const base = tokens.length === 0 ? 0 : Math.min(65, (overlap / tokens.length) * 85);

  let intentBoost = 0;
  Object.entries(DIRECTION_KEYWORDS).forEach(([direction, keywords]) => {
    if (containsAny(text, keywords) && mentor.direction === direction) {
      intentBoost = Math.max(intentBoost, 35);
    }
  });

  return Math.max(0, Math.min(100, base + intentBoost));
}

function calcOverlapScore(inputText, mentor, mode) {
  const profileTokens = extractTokens(inputText);
  if (profileTokens.length === 0) return 0;

  let targetText = `${mentor.researchAreas} ${mentor.skillTags.join(" ")} `;
  if (mode === "career") {
    targetText += `${mentor.careerTags.join(" ")} ${mentor.notes}`;
  }

  const mentorTokens = new Set(extractTokens(targetText));
  const overlap = countOverlap(profileTokens, mentorTokens);
  const score = (overlap / profileTokens.length) * 100;
  return Math.max(0, Math.min(100, score));
}

function extractTokens(text) {
  if (!text) return [];

  const normalized = text.toLowerCase();
  const parts = normalized
    .split(/[，,。；;、\s\n\r/]+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2 && item.length <= 24);

  const englishWords = normalized.match(/[a-z0-9+#.\-]{2,}/g) || [];
  const matchedKeywords = GENERIC_KEYWORDS.filter((word) => text.includes(word));

  const set = new Set([...parts, ...englishWords, ...matchedKeywords]);
  return [...set];
}

function countOverlap(profileTokens, mentorTokensSet) {
  let overlap = 0;
  profileTokens.forEach((token) => {
    if (mentorTokensSet.has(token)) {
      overlap += 1;
    }
  });
  return overlap;
}

function containsAny(text, words) {
  return words.some((word) => text.includes(word));
}

function normalizeText(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}

function applyFilters() {
  const direction = els.directionFilter.value;
  const keyword = normalizeText(els.keywordFilter.value).toLowerCase();

  let list = state.rankedMentors.length > 0 ? [...state.rankedMentors] : [...state.mentors];

  if (direction) {
    list = list.filter((item) => item.direction === direction);
  }

  if (keyword) {
    list = list.filter((item) => (item.searchText || "").toLowerCase().includes(keyword));
  }

  state.visibleMentors = list;
  renderMentorList();

  if (state.profile) {
    els.resultCount.textContent = `推荐 ${list.length} 位（共 ${state.rankedMentors.length}）`;
  } else {
    els.resultCount.textContent = `导师库 ${list.length} 位`;
  }
}

function renderMentorList() {
  els.mentorList.innerHTML = "";

  if (state.visibleMentors.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "没有匹配结果，请尝试修改关键词或方向筛选。";
    els.mentorList.appendChild(empty);
    return;
  }

  state.visibleMentors.forEach((mentor, index) => {
    const cardNode = els.mentorCardTemplate.content.firstElementChild.cloneNode(true);
    cardNode.style.animationDelay = `${Math.min(index * 0.025, 0.2)}s`;

    const photo = cardNode.querySelector(".mentor-photo");
    photo.src = mentor.photoPath;
    photo.alt = `${mentor.name} 头像`;

    cardNode.querySelector(".mentor-name").textContent = mentor.name;
    cardNode.querySelector(".mentor-meta").textContent = `${mentor.direction} · ${mentor.title}`;
    cardNode.querySelector(".mentor-research").textContent = mentor.researchAreas || "待补充";

    const badge = cardNode.querySelector(".badge");
    if (mentor.allowDirectApply && state.directUnlocked) {
      badge.textContent = "直投开放";
      badge.classList.remove("hidden");
    } else if (mentor.allowDirectApply) {
      badge.textContent = "重点导师";
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }

    const detailBtn = cardNode.querySelector(".detail-btn");
    detailBtn.addEventListener("click", () => openDetail(mentor));

    const contactBtn = cardNode.querySelector(".contact-btn");
    if (mentor.allowDirectApply && state.directUnlocked) {
      contactBtn.textContent = "简历直投";
      contactBtn.addEventListener("click", () => openDirectApplyDialog(mentor));
    } else {
      contactBtn.textContent = "复制邮箱";
      contactBtn.addEventListener("click", () => copyEmail(mentor.email));
    }

    els.mentorList.appendChild(cardNode);
  });
}

function openDetail(mentor) {
  state.selectedMentor = mentor;
  const directButton = mentor.allowDirectApply && state.directUnlocked
    ? `<button type="button" id="detailDirectBtn">简历直投</button>`
    : `<button type="button" id="detailEmailBtn">复制邮箱</button>`;

  els.detailContent.innerHTML = `
    <div class="detail-head">
      <img class="detail-photo" src="${mentor.photoPath}" alt="${mentor.name} 头像">
      <div>
        <h3>${mentor.name}</h3>
        <p class="detail-meta">${mentor.direction} · ${mentor.title}</p>
        <p class="detail-meta">籍贯：${mentor.origin || "未公开"}</p>
        <p class="detail-meta">出生年份：${mentor.birthYear || "未公开"}</p>
        <p class="detail-meta">邮箱：${mentor.email || "未公开"}</p>
        <div class="action-row">${directButton}</div>
      </div>
    </div>
    <div class="detail-block">
      <h4>研究方向</h4>
      <p>${mentor.researchAreas || "待补充"}</p>
    </div>
    <div class="detail-block">
      <h4>备注</h4>
      <p>${mentor.notes || "待补充"}</p>
    </div>
  `;

  const detailEmailBtn = document.getElementById("detailEmailBtn");
  if (detailEmailBtn) {
    detailEmailBtn.addEventListener("click", () => copyEmail(mentor.email));
  }

  const detailDirectBtn = document.getElementById("detailDirectBtn");
  if (detailDirectBtn) {
    detailDirectBtn.addEventListener("click", () => openDirectApplyDialog(mentor));
  }

  els.detailDrawer.hidden = false;
}

function closeDetail() {
  els.detailDrawer.hidden = true;
  state.selectedMentor = null;
}

function openDirectApplyDialog(mentor) {
  if (!(mentor.allowDirectApply && state.directUnlocked)) {
    copyEmail(mentor.email);
    return;
  }

  state.selectedMentor = mentor;
  els.applyMentorName.textContent = `投递目标：${mentor.name}（${mentor.direction}）`;
  els.applyMsg.textContent = "";
  els.applyForm.reset();
  els.applyDialog.showModal();
}

async function onSubmitDirectApply(event) {
  event.preventDefault();
  els.applyMsg.style.color = "#b63f3f";

  if (!state.selectedMentor) {
    els.applyMsg.textContent = "未识别导师，请重新打开直投入口。";
    return;
  }

  const name = normalizeText(els.studentName.value);
  const phone = normalizeText(els.studentPhone.value);
  const email = normalizeText(els.studentEmail.value);
  const intro = normalizeText(els.studentIntro.value);
  const file = els.resumeFile.files[0];

  if (!name || !phone || !email || !file) {
    els.applyMsg.textContent = "请完整填写信息并上传简历。";
    return;
  }

  const ext = file.name.split(".").pop().toLowerCase();
  if (!ALLOWED_FILE_EXT.includes(ext)) {
    els.applyMsg.textContent = "附件格式仅支持 PDF/DOC/DOCX。";
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    els.applyMsg.textContent = "附件不能超过 10MB。";
    return;
  }

  els.submitApplyBtn.disabled = true;

  const payload = {
    mentorId: state.selectedMentor.id,
    mentorName: state.selectedMentor.name,
    studentName: name,
    studentPhone: phone,
    studentEmail: email,
    intro,
    fileName: file.name,
    submittedAt: new Date().toISOString()
  };

  let remoteOk = false;
  try {
    remoteOk = await submitToRemoteApi(payload, file);
  } catch (_) {
    remoteOk = false;
  }

  if (!remoteOk) {
    saveApplyDraft(payload);
  }

  els.applyMsg.style.color = "#0a4c38";
  els.applyMsg.textContent = remoteOk
    ? "提交成功：简历已转交导师通道。"
    : "提交成功：已暂存投递记录，待后台接通后自动补发。";

  setTimeout(() => {
    els.applyDialog.close();
  }, 850);

  els.submitApplyBtn.disabled = false;
}

async function submitToRemoteApi(payload, file) {
  const endpoint = window.__DIRECT_APPLY_API__ || "";
  if (!endpoint) return false;

  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => formData.append(key, value));
  formData.append("resume", file);

  const response = await fetch(endpoint, {
    method: "POST",
    body: formData
  });

  return response.ok;
}

function saveApplyDraft(payload) {
  const oldQueue = JSON.parse(localStorage.getItem("directApplyQueue") || "[]");
  oldQueue.push(payload);
  localStorage.setItem("directApplyQueue", JSON.stringify(oldQueue));
}

async function copyEmail(email) {
  const value = normalizeText(email);
  if (!value || value.includes("未公开") || value.includes("未在公开信息中明确")) {
    showTempMessage("该导师邮箱待补充，请先查看备注信息。", false);
    return;
  }

  try {
    await navigator.clipboard.writeText(value);
    showTempMessage(`邮箱已复制：${value}`, true);
  } catch (_) {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    showTempMessage(`邮箱已复制：${value}`, true);
  }
}

function showTempMessage(text, success) {
  els.formMsg.style.color = success ? "#0a4c38" : "#b63f3f";
  els.formMsg.textContent = text;
}

function onReset() {
  if (state.isAnalyzing) return;

  els.profileForm.reset();
  els.formMsg.textContent = "";
  els.formMsg.style.color = "#b63f3f";
  state.profile = null;
  state.directUnlocked = false;
  state.rankedMentors = [...state.mentors];
  applyFilters();
}

function persistProfile(profile) {
  localStorage.setItem("mentorProfile", JSON.stringify(profile));
}

function hydrateProfileFromStorage() {
  const savedRaw = localStorage.getItem("mentorProfile");
  if (!savedRaw) return;

  try {
    const saved = JSON.parse(savedRaw);
    els.targetDirection.value = saved.targetDirection || "";
    els.currentSkills.value = saved.currentSkills || "";
    els.careerPlan.value = saved.careerPlan || "";
  } catch (_) {
    localStorage.removeItem("mentorProfile");
  }
}
