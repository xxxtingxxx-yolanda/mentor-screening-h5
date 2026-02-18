const DATA_URL = "data/mentors.json";
const INLINE_DATA_URL = "data/mentors.inline.js";
const PRIORITY_MENTORS = new Set(["田飞", "何铭锋"]);
const SOURCE_URL = "https://art.hut.edu.cn/ljyjx.htm";
const PRIORITY_MIN_SCORE = 64;
const PRIORITY_CLARITY_THRESHOLD = 42;
const DEFAULT_PHOTO_PATH = "photos/mentor-placeholder.svg";
const LIST_BATCH_SIZE = 12;

const DIRECTION_KEYWORDS = {
  "包装设计": ["包装", "品牌", "文创", "材料", "结构", "智能包装", "包装设计"],
  "传达与媒体设计": ["传达", "媒体", "动画", "数字", "影像", "交互", "新媒体"],
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
  preferPriorityMentorsByProfile: false,
  isAnalyzing: false,
  profile: null,
  mentorsReady: false,
  mentorLoadPromise: null,
  renderLimit: LIST_BATCH_SIZE
};

const toastState = {
  layer: null,
  element: null,
  timerId: null
};

const els = {
  launchScreen: document.getElementById("launchScreen"),
  startAppBtn: document.getElementById("startAppBtn"),
  appMain: document.getElementById("appMain"),
  formPage: document.getElementById("formPage"),
  resultPage: document.getElementById("resultPage"),
  backToFormBtn: document.getElementById("backToFormBtn"),
  profileForm: document.getElementById("profileForm"),
  targetDirection: document.getElementById("targetDirection"),
  targetDirectionChips: document.getElementById("targetDirectionChips"),
  targetDirectionExtra: document.getElementById("targetDirectionExtra"),
  currentSkills: document.getElementById("currentSkills"),
  currentSkillsChips: document.getElementById("currentSkillsChips"),
  currentSkillsExtra: document.getElementById("currentSkillsExtra"),
  careerPlan: document.getElementById("careerPlan"),
  careerPlanChips: document.getElementById("careerPlanChips"),
  careerPlanExtra: document.getElementById("careerPlanExtra"),
  privacyConsent: document.getElementById("privacyConsent"),
  analyzeBtn: document.getElementById("analyzeBtn"),
  resetBtn: document.getElementById("resetBtn"),
  formMsg: document.getElementById("formMsg"),
  copyShareBtn: document.getElementById("copyShareBtn"),
  directionFilter: document.getElementById("directionFilter"),
  keywordFilter: document.getElementById("keywordFilter"),
  mentorList: document.getElementById("mentorList"),
  loadMoreBtn: document.getElementById("loadMoreBtn"),
  resultCount: document.getElementById("resultCount"),
  resultAiNote: document.getElementById("resultAiNote"),
  detailDrawer: document.getElementById("detailDrawer"),
  detailContent: document.getElementById("detailContent"),
  closeDetailBtn: document.getElementById("closeDetailBtn"),
  mentorCardTemplate: document.getElementById("mentorCardTemplate"),
  analysisOverlay: document.getElementById("analysisOverlay"),
  analysisStepText: document.getElementById("analysisStepText"),
  analysisProgressBar: document.getElementById("analysisProgressBar")
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  bindEvents();
  bindChipGroups();
  hydrateProfileFromStorage();
  showLaunchView();
}

function bindEvents() {
  if (els.startAppBtn) {
    els.startAppBtn.addEventListener("click", enterApp);
  }
  if (els.backToFormBtn) {
    els.backToFormBtn.addEventListener("click", showFormPage);
  }
  els.profileForm.addEventListener("submit", onAnalyze);
  els.resetBtn.addEventListener("click", onReset);
  if (els.copyShareBtn) {
    els.copyShareBtn.addEventListener("click", onCopyShare);
  }
  if (els.directionFilter) {
    els.directionFilter.addEventListener("change", () => applyFilters({ resetRender: true }));
  }
  if (els.keywordFilter) {
    els.keywordFilter.addEventListener("input", () => applyFilters({ resetRender: true }));
  }
  if (els.loadMoreBtn) {
    els.loadMoreBtn.addEventListener("click", onLoadMoreMentors);
  }

  if (els.closeDetailBtn) {
    els.closeDetailBtn.addEventListener("click", closeDetail);
  }
  if (els.detailDrawer) {
    els.detailDrawer.addEventListener("click", (event) => {
      if (event.target === els.detailDrawer) closeDetail();
    });
  }
}

function showLaunchView() {
  if (els.launchScreen) {
    els.launchScreen.hidden = false;
  }
  if (els.appMain) {
    els.appMain.classList.add("app-hidden");
  }
}

async function enterApp() {
  if (els.launchScreen) {
    els.launchScreen.hidden = true;
  }
  if (els.appMain) {
    els.appMain.classList.remove("app-hidden");
  }
  showFormPage();

  if (state.mentorsReady) return;

  els.formMsg.style.color = "#2c5e4c";
  els.formMsg.textContent = "正在加载导师库...";
  try {
    await ensureMentorsReady();
    els.formMsg.textContent = "";
  } catch (error) {
    els.formMsg.style.color = "#b63f3f";
    els.formMsg.textContent = `数据加载失败：${error.message}`;
  }
}

function showFormPage() {
  if (els.formPage) {
    els.formPage.hidden = false;
  }
  if (els.resultPage) {
    els.resultPage.hidden = true;
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showResultPage() {
  if (els.formPage) {
    els.formPage.hidden = true;
  }
  if (els.resultPage) {
    els.resultPage.hidden = false;
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function bindChipGroups() {
  bindChipGroup(els.targetDirectionChips, els.targetDirection, els.targetDirectionExtra);
  bindChipGroup(els.currentSkillsChips, els.currentSkills, els.currentSkillsExtra);
  bindChipGroup(els.careerPlanChips, els.careerPlan, els.careerPlanExtra);
}

function bindChipGroup(container, hiddenInput, extraInput) {
  if (!container || !hiddenInput || !extraInput) return;

  container.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-value]");
    if (!button) return;
    button.classList.toggle("active");
    syncChipGroup(container, hiddenInput, extraInput);
  });

  if (extraInput.type !== "hidden") {
    extraInput.addEventListener("input", () => {
      syncChipGroup(container, hiddenInput, extraInput);
    });
  }

  syncChipGroup(container, hiddenInput, extraInput);
}

function syncChipGroup(container, hiddenInput, extraInput) {
  const selected = [...container.querySelectorAll(".chip.active")].map((node) => normalizeText(node.dataset.value));
  const canUseExtra = Boolean(extraInput) && extraInput.type !== "hidden";
  const extra = canUseExtra ? normalizeText(extraInput.value) : "";

  let merged = selected.join("、");
  if (extra) {
    merged = merged ? `${merged}、${extra}` : extra;
  }

  hiddenInput.value = merged;
}

async function loadMentors() {
  try {
    const payload = await loadMentorPayload();
    if (!payload || !Array.isArray(payload.mentors) || payload.mentors.length === 0) {
      throw new Error("导师数据为空");
    }

    state.mentors = payload.mentors.map((mentor) => normalizeMentor(mentor));
    state.rankedMentors = [...state.mentors];
    state.mentorsReady = true;
    state.renderLimit = LIST_BATCH_SIZE;
    fillDirectionFilter();
    applyFilters({ resetRender: true });
    if (els.resultCount) {
      els.resultCount.textContent = `导师库 ${state.mentors.length} 位`;
    }
  } catch (error) {
    state.mentorsReady = false;
    throw error;
  }
}

async function loadMentorPayload() {
  if (window.__MENTORS_PAYLOAD__ && Array.isArray(window.__MENTORS_PAYLOAD__.mentors) && window.__MENTORS_PAYLOAD__.mentors.length > 0) {
    return window.__MENTORS_PAYLOAD__;
  }

  const isFileProtocol = window.location.protocol === "file:";
  if (isFileProtocol) {
    const inlinePayload = await loadInlineMentorPayload();
    if (inlinePayload) return inlinePayload;
    throw new Error("本地模式数据加载失败，请检查 data/mentors.inline.js");
  }

  try {
    const res = await fetch(DATA_URL, { cache: "force-cache" });
    if (!res.ok) throw new Error(`加载数据失败: ${res.status}`);
    return await res.json();
  } catch (fetchError) {
    const inlinePayload = await loadInlineMentorPayload();
    if (inlinePayload) return inlinePayload;
    throw fetchError;
  }
}

async function loadInlineMentorPayload() {
  if (window.__MENTORS_PAYLOAD__ && Array.isArray(window.__MENTORS_PAYLOAD__.mentors) && window.__MENTORS_PAYLOAD__.mentors.length > 0) {
    return window.__MENTORS_PAYLOAD__;
  }

  try {
    await loadScript(INLINE_DATA_URL);
  } catch (_) {
    return null;
  }

  if (window.__MENTORS_PAYLOAD__ && Array.isArray(window.__MENTORS_PAYLOAD__.mentors) && window.__MENTORS_PAYLOAD__.mentors.length > 0) {
    return window.__MENTORS_PAYLOAD__;
  }
  return null;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "1") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`脚本加载失败: ${src}`)), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.addEventListener("load", () => {
      script.dataset.loaded = "1";
      resolve();
    }, { once: true });
    script.addEventListener("error", () => reject(new Error(`脚本加载失败: ${src}`)), { once: true });
    document.head.appendChild(script);
  });
}

async function ensureMentorsReady() {
  if (state.mentorsReady) return;

  if (!state.mentorLoadPromise) {
    state.mentorLoadPromise = loadMentors().finally(() => {
      state.mentorLoadPromise = null;
    });
  }

  await state.mentorLoadPromise;
}

function normalizeMentor(mentor) {
  const skillTags = ensureArray(mentor.skillTags);
  const careerTags = ensureArray(mentor.careerTags);
  const photoPath = normalizeText(mentor.photoPath || "") || DEFAULT_PHOTO_PATH;
  const searchSeed = `${mentor.searchText || ""} ${skillTags.join(" ")} ${careerTags.join(" ")}`.trim();

  return {
    ...mentor,
    photoPath,
    skillTags,
    careerTags,
    hiddenScore: 0,
    searchText: searchSeed,
    isPriority: PRIORITY_MENTORS.has(mentor.name)
  };
}

function ensureArray(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined || value === "") return [];
  return [value];
}

function fillDirectionFilter() {
  if (!els.directionFilter) return;
  els.directionFilter.innerHTML = '<option value="">全部方向</option>';
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

  try {
    await ensureMentorsReady();
  } catch (error) {
    els.formMsg.style.color = "#b63f3f";
    els.formMsg.textContent = `数据加载失败：${error.message}`;
    return;
  }

  state.isAnalyzing = true;
  els.analyzeBtn.disabled = true;
  els.resetBtn.disabled = true;
  const oldBtnText = els.analyzeBtn.textContent;
  els.analyzeBtn.textContent = "分析中...";

  try {
    await playAnalysisAnimation();

    if (!state.mentors.length) {
      throw new Error("导师库未加载成功，请刷新页面后重试。");
    }

    const scored = rankMentors(profile);
    if (!scored.sorted.length) {
      throw new Error("当前未拿到导师数据，请刷新后重试。");
    }

    state.profile = profile;
    state.rankedMentors = scored.sorted;
    state.preferPriorityMentorsByProfile = scored.preferPriorityMentors;

    persistProfile(profile);
    els.formMsg.style.color = "#0a4c38";
    els.formMsg.textContent = "AI 分析完成，已更新导师优先顺序。";
    applyFilters({ resetRender: true });
    showResultPage();
  } catch (error) {
    els.formMsg.style.color = "#b63f3f";
    els.formMsg.textContent = error.message || "生成推荐失败，请重试。";
  } finally {
    hideAnalysisOverlay();
    state.isAnalyzing = false;
    els.analyzeBtn.disabled = false;
    els.resetBtn.disabled = false;
    els.analyzeBtn.textContent = oldBtnText;
  }
}

function validateProfile(profile, consent) {
  if (!profile.targetDirection) return "请至少选择 1 个目标方向。";
  if (!profile.currentSkills) return "请至少选择 1 项已掌握技能。";
  if (!profile.careerPlan) return "请至少选择 1 项未来职业规划。";
  if (!consent) return "请先勾选隐私授权。";
  return "";
}

async function playAnalysisAnimation() {
  const steps = [
    "正在读取你的方向标签...",
    "正在比对技能与研究关键词...",
    "正在推演职业路径匹配度...",
    "正在生成导师推荐排序..."
  ];

  showAnalysisOverlay();
  els.formMsg.style.color = "#2c5e4c";
  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];
    const progress = Math.round(((index + 1) / steps.length) * 100);
    setAnalysisStep(step, progress);
    els.formMsg.textContent = step;
    await delay(380);
  }
  await delay(180);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function rankMentors(profile) {
  const clarityScore = calcProfileClarity(profile);
  const profileJoined = `${profile.targetDirection} ${profile.currentSkills} ${profile.careerPlan}`;
  const hasPriorityIntent = /(产品|服务|交互|创新|品牌|传播|体验|智能|数字)/.test(profileJoined);

  const scoredMentors = state.mentors.map((mentor) => {
    const directionScore = calcDirectionScore(profile.targetDirection, mentor);
    const skillScore = calcOverlapScore(profile.currentSkills, mentor, "skills");
    const careerScore = calcOverlapScore(profile.careerPlan, mentor, "career");

    let total = directionScore * 0.5 + skillScore * 0.3 + careerScore * 0.2;
    if (isPriorityMentor(mentor) && hasPriorityIntent && clarityScore >= PRIORITY_CLARITY_THRESHOLD) {
      total += 8;
    }

    return {
      ...mentor,
      hiddenScore: Math.max(0, Math.min(100, Number(total.toFixed(2))))
    };
  });

  scoredMentors.sort((a, b) => b.hiddenScore - a.hiddenScore);

  const priorityMentorScores = scoredMentors.filter((item) => isPriorityMentor(item));
  const profileHasProductDirection = profile.targetDirection.includes("产品设计");
  const preferPriorityMentors =
    profileHasProductDirection ||
    (hasPriorityIntent &&
      clarityScore >= PRIORITY_CLARITY_THRESHOLD &&
      priorityMentorScores.some((item) => item.hiddenScore >= PRIORITY_MIN_SCORE));

  if (!preferPriorityMentors) {
    return { sorted: scoredMentors, preferPriorityMentors: false };
  }

  return {
    sorted: movePriorityMentorsToFront(scoredMentors),
    preferPriorityMentors: true
  };
}

function calcProfileClarity(profile) {
  const rawText = `${profile.targetDirection} ${profile.currentSkills} ${profile.careerPlan}`;
  const tokenCount = extractTokens(rawText).length;
  const selectedCount = rawText.split(/[、,，;；/\s\n\r]+/).map((item) => item.trim()).filter(Boolean).length;

  const tokenScore = Math.min(68, tokenCount * 4);
  const selectedScore = Math.min(32, selectedCount * 5);
  return Math.max(0, Math.min(100, tokenScore + selectedScore));
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
    if (mentorTokensSet.has(token)) overlap += 1;
  });
  return overlap;
}

function containsAny(text, words) {
  return words.some((word) => text.includes(word));
}

function normalizeText(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}

function applyFilters(options = {}) {
  const resetRender = options.resetRender !== false;
  const direction = els.directionFilter ? els.directionFilter.value : "";
  const keyword = normalizeText(els.keywordFilter ? els.keywordFilter.value : "").toLowerCase();

  let list = state.rankedMentors.length > 0 ? [...state.rankedMentors] : [...state.mentors];

  if (direction) {
    list = list.filter((item) => item.direction === direction);
  }

  if (keyword) {
    list = list.filter((item) => (item.searchText || "").toLowerCase().includes(keyword));
  }

  if (shouldPrioritizeMentors(direction)) {
    list = movePriorityMentorsToFront(list);
  }

  if (resetRender) {
    state.renderLimit = LIST_BATCH_SIZE;
  }

  state.visibleMentors = list;
  renderMentorList();
  updateResultAiNote();

  if (els.resultCount) {
    if (state.profile) {
      els.resultCount.textContent = `推荐 ${list.length} 位（共 ${state.rankedMentors.length}）`;
    } else {
      els.resultCount.textContent = `导师库 ${list.length} 位`;
    }
  }
}

function updateResultAiNote() {
  if (!els.resultAiNote) return;

  if (!state.profile) {
    els.resultAiNote.textContent = "先完成学生画像，AI 会生成优先顺序和匹配解读。";
    return;
  }

  if (!state.visibleMentors.length) {
    els.resultAiNote.textContent = "AI 已完成分析：当前筛选下暂无结果，建议放宽方向或关键词。";
    return;
  }

  const top = state.visibleMentors[0];
  const second = state.visibleMentors[1];
  const names = [top?.name, second?.name].filter(Boolean).join("、");
  const direction = state.profile.targetDirection.split("、")[0] || "你的目标方向";
  const score = Math.round(top?.hiddenScore || 0);
  els.resultAiNote.textContent = `AI 结论：你在「${direction}」方向匹配较清晰，当前优先建议联系 ${names}（Top1 匹配度 ${score}%）。`;
}

function shouldPrioritizeMentors(direction) {
  const byFilter = direction === "产品设计";
  const byProfile = state.preferPriorityMentorsByProfile;
  return byFilter || byProfile;
}

function movePriorityMentorsToFront(list) {
  const priority = [];
  const others = [];

  list.forEach((item) => {
    if (isPriorityMentor(item)) {
      priority.push(item);
    } else {
      others.push(item);
    }
  });

  return [...priority, ...others];
}

function isPriorityMentor(mentor) {
  return Boolean(mentor.isPriority || PRIORITY_MENTORS.has(mentor.name));
}

function renderMentorList() {
  els.mentorList.innerHTML = "";

  if (state.visibleMentors.length === 0) {
    updateLoadMoreButton(0, 0);
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "没有匹配结果，请尝试修改关键词或方向筛选。";
    els.mentorList.appendChild(empty);
    return;
  }

  const renderCount = Math.min(state.renderLimit, state.visibleMentors.length);
  const mentorsToRender = state.visibleMentors.slice(0, renderCount);
  const rankMap = new Map(state.rankedMentors.map((mentor, index) => [mentorKey(mentor), index + 1]));

  mentorsToRender.forEach((mentor, index) => {
    const cardNode = els.mentorCardTemplate.content.firstElementChild.cloneNode(true);
    cardNode.style.animationDelay = `${Math.min(index * 0.025, 0.2)}s`;

    const photo = cardNode.querySelector(".mentor-photo");
    photo.src = mentor.photoPath || DEFAULT_PHOTO_PATH;
    photo.alt = `${mentor.name} 头像`;
    photo.loading = index < 2 ? "eager" : "lazy";
    photo.decoding = "async";
    photo.setAttribute("fetchpriority", index < 2 ? "high" : "low");
    photo.addEventListener("error", () => {
      photo.src = DEFAULT_PHOTO_PATH;
    }, { once: true });

    cardNode.querySelector(".mentor-name").textContent = mentor.name;
    cardNode.querySelector(".mentor-meta").textContent = `${mentor.direction} · ${mentor.title}`;
    cardNode.querySelector(".mentor-research").textContent = mentor.researchAreas || "待补充";

    const rank = rankMap.get(mentorKey(mentor)) || index + 1;
    const rankChip = cardNode.querySelector(".rank-chip");
    const scoreChip = cardNode.querySelector(".score-chip");
    rankChip.textContent = `Top ${rank}`;

    const roundedScore = Math.round(mentor.hiddenScore || 0);
    if (state.profile) {
      scoreChip.textContent = `匹配 ${roundedScore}%`;
      scoreChip.classList.add(resolveScoreClass(roundedScore));
    } else {
      scoreChip.textContent = "待匹配";
    }

    const detailBtn = cardNode.querySelector(".detail-btn");
    detailBtn.addEventListener("click", () => openDetail(mentor));

    const contactBtn = cardNode.querySelector(".contact-btn");
    contactBtn.textContent = "复制邮箱";
    contactBtn.addEventListener("click", () => copyEmail(mentor.email));

    els.mentorList.appendChild(cardNode);
  });

  updateLoadMoreButton(state.visibleMentors.length, mentorsToRender.length);
}

function onLoadMoreMentors() {
  state.renderLimit += LIST_BATCH_SIZE;
  renderMentorList();
}

function updateLoadMoreButton(total, rendered) {
  if (!els.loadMoreBtn) return;
  const canLoadMore = total > rendered;
  els.loadMoreBtn.hidden = !canLoadMore;
  if (canLoadMore) {
    els.loadMoreBtn.textContent = `加载更多导师（已显示 ${rendered}/${total}）`;
  }
}

function mentorKey(mentor) {
  return `${mentor.name || ""}|${mentor.direction || ""}|${mentor.title || ""}`;
}

function resolveScoreClass(score) {
  if (score >= 78) return "high";
  if (score >= 58) return "medium";
  return "low";
}

function openDetail(mentor) {
  const profileLink = mentor.profileUrl
    ? `<p class="detail-meta">信息来源：<a href="${mentor.profileUrl}" target="_blank" rel="noopener">学院官网导师介绍 &gt;</a></p>`
    : "";

  els.detailContent.innerHTML = `
    <div class="detail-head">
      <img class="detail-photo" src="${mentor.photoPath || DEFAULT_PHOTO_PATH}" alt="${mentor.name} 头像">
      <div>
        <h3>${mentor.name}</h3>
        <p class="detail-meta">${mentor.direction} · ${mentor.title}</p>
        <p class="detail-meta">籍贯：${mentor.origin || "未公开"}</p>
        <p class="detail-meta">出生年份：${mentor.birthYear || "未公开"}</p>
        <p class="detail-meta">邮箱：${mentor.email || "未公开"}</p>
        ${profileLink}
        <div class="action-row"><button type="button" id="detailEmailBtn">复制邮箱</button></div>
      </div>
    </div>
    <div class="detail-block">
      <h4>研究方向</h4>
      <p>${mentor.researchAreas || "待补充"}</p>
    </div>
    <div class="detail-block">
      <h4>简介</h4>
      <p>${mentor.notes || "待补充"}</p>
    </div>
  `;

  const detailPhoto = els.detailContent.querySelector(".detail-photo");
  if (detailPhoto) {
    detailPhoto.addEventListener("error", () => {
      detailPhoto.src = DEFAULT_PHOTO_PATH;
    }, { once: true });
  }

  const detailEmailBtn = document.getElementById("detailEmailBtn");
  if (detailEmailBtn) {
    detailEmailBtn.addEventListener("click", () => copyEmail(mentor.email));
  }

  els.detailDrawer.hidden = false;
}

function closeDetail() {
  els.detailDrawer.hidden = true;
}

async function copyEmail(email) {
  const value = normalizeText(email);
  if (!value || value.includes("未公开") || value.includes("未在公开信息中明确")) {
    showTempMessage("该导师邮箱待补充，请先查看官网主页。", false);
    return;
  }

  try {
    await copyText(value);
    showTempMessage(`邮箱已复制：${value}`, true);
  } catch (_) {
    showTempMessage("复制失败，请手动长按邮箱复制。", false);
  }
}

async function onCopyShare() {
  const message = buildShareMessage();
  try {
    await copyText(message);
    showTempMessage("分享文案已复制，去微信粘贴即可转发。", true);
  } catch (_) {
    showTempMessage("复制失败，请稍后再试。", false);
  }
}

function buildShareMessage() {
  const target = state.profile?.targetDirection || "包装设计相关方向";
  const topMentorNames = state.visibleMentors.slice(0, 3).map((item) => item.name).join("、");
  const topLine = topMentorNames ? `当前优先推荐：${topMentorNames}。` : "";

  return [
    "我刚用了「湖工大包装设计导师筛选」这个公益工具。",
    `我填写的目标方向：${target}。`,
    topLine,
    "适用对象：湖南工业大学包装设计艺术学院考研/调剂同学。",
    `信息来源：学院官网导师介绍 ${SOURCE_URL}`,
    `工具入口：${window.location.href}`
  ].filter(Boolean).join("\n");
}

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    return;
  } catch (_) {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    if (!copied) {
      throw new Error("copy failed");
    }
  }
}

function showTempMessage(text, success) {
  els.formMsg.style.color = success ? "#0a4c38" : "#b63f3f";
  els.formMsg.textContent = text;
  showToast(text, success);
}

function ensureToastElement() {
  if (toastState.element && toastState.layer) return toastState.element;

  const layer = document.createElement("div");
  layer.className = "app-toast-layer";

  const toast = document.createElement("div");
  toast.className = "app-toast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");

  layer.appendChild(toast);
  document.body.appendChild(layer);

  toastState.layer = layer;
  toastState.element = toast;
  return toast;
}

function showToast(text, success) {
  const toast = ensureToastElement();
  const layer = toastState.layer;
  toast.textContent = text;
  toast.classList.toggle("error", !success);
  layer.classList.add("show");
  toast.classList.add("show");

  if (toastState.timerId) {
    clearTimeout(toastState.timerId);
  }

  toastState.timerId = setTimeout(() => {
    layer.classList.remove("show");
    toast.classList.remove("show");
  }, 1200);
}

function showAnalysisOverlay() {
  if (!els.analysisOverlay) return;
  els.analysisOverlay.hidden = false;
  setAnalysisStep("准备分析...", 8);
}

function setAnalysisStep(text, progress) {
  if (els.analysisStepText) {
    els.analysisStepText.textContent = text;
  }
  if (els.analysisProgressBar) {
    const safeProgress = Math.max(0, Math.min(100, progress));
    els.analysisProgressBar.style.width = `${safeProgress}%`;
  }
}

function hideAnalysisOverlay() {
  if (!els.analysisOverlay) return;
  els.analysisOverlay.hidden = true;
  setAnalysisStep("准备中...", 0);
}

function onReset() {
  if (state.isAnalyzing) return;

  els.profileForm.reset();
  clearChipGroup(els.targetDirectionChips, els.targetDirection, els.targetDirectionExtra);
  clearChipGroup(els.currentSkillsChips, els.currentSkills, els.currentSkillsExtra);
  clearChipGroup(els.careerPlanChips, els.careerPlan, els.careerPlanExtra);

  els.formMsg.textContent = "";
  els.formMsg.style.color = "#b63f3f";
  state.profile = null;
  state.preferPriorityMentorsByProfile = false;
  state.rankedMentors = [...state.mentors];
  applyFilters({ resetRender: true });
}

function clearChipGroup(container, hiddenInput, extraInput) {
  container.querySelectorAll(".chip.active").forEach((node) => node.classList.remove("active"));
  hiddenInput.value = "";
  extraInput.value = "";
}

function persistProfile(profile) {
  localStorage.setItem("mentorProfile", JSON.stringify(profile));
}

function hydrateProfileFromStorage() {
  const savedRaw = localStorage.getItem("mentorProfile");
  if (!savedRaw) return;

  try {
    const saved = JSON.parse(savedRaw);
    applySavedToChipGroup(saved.targetDirection || "", els.targetDirectionChips, els.targetDirection, els.targetDirectionExtra);
    applySavedToChipGroup(saved.currentSkills || "", els.currentSkillsChips, els.currentSkills, els.currentSkillsExtra);
    applySavedToChipGroup(saved.careerPlan || "", els.careerPlanChips, els.careerPlan, els.careerPlanExtra);
  } catch (_) {
    localStorage.removeItem("mentorProfile");
  }
}

function applySavedToChipGroup(rawValue, container, hiddenInput, extraInput) {
  clearChipGroup(container, hiddenInput, extraInput);

  const value = normalizeText(rawValue);
  if (!value) {
    syncChipGroup(container, hiddenInput, extraInput);
    return;
  }

  const chipButtons = [...container.querySelectorAll(".chip")];
  const chipValues = new Set(chipButtons.map((node) => normalizeText(node.dataset.value)));
  const parts = value.split(/[、,，;；/]/).map((item) => normalizeText(item)).filter(Boolean);

  parts.forEach((part) => {
    if (chipValues.has(part)) {
      const button = chipButtons.find((node) => normalizeText(node.dataset.value) === part);
      if (button) button.classList.add("active");
    }
  });

  extraInput.value = "";
  syncChipGroup(container, hiddenInput, extraInput);
}
