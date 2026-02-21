const DATA_URL = "data/mentors.json";
const INLINE_DATA_URL = "data/mentors.inline.js";
const PRIORITY_MENTOR_NAMES = Object.freeze({
  tian: "田飞",
  he: "何铭锋"
});
const PRIORITY_MENTORS = new Set(Object.values(PRIORITY_MENTOR_NAMES));
const SOURCE_URL = "https://art.hut.edu.cn/ljyjx.htm";
const DEFAULT_PHOTO_PATH = "photos/mentor-placeholder.svg";
const LIST_BATCH_SIZE = 12;
const SHARE_FROM_PARAM = "share_copy";
const SENIOR_PROFILE = Object.freeze({
  name: "子木音不离",
  xhsUrl: "https://xhslink.com/m/92nbiGWmQvj"
});

const DIRECTION_ROUTE_LABELS = Object.freeze({
  product: "产品设计",
  packaging: "包装设计",
  media: "传达与媒体设计",
  environment: "环境设计"
});

const DIRECTION_ROUTE_KEYWORDS = Object.freeze({
  product: ["产品", "工业", "交互", "用户体验", "服务设计", "硬件", "制造", "企业产品"],
  packaging: ["包装", "品牌", "文创", "智能包装", "包装结构", "材料工艺", "设计历史与理论"],
  media: ["传达", "媒体", "视觉", "动画", "影像", "新媒体", "数字媒体"],
  environment: ["环境", "环艺", "空间", "景观", "建筑", "城乡", "文旅", "乡村", "低碳", "生态"]
});

const MENTOR_EXTRA_LINKS = Object.freeze({
  [PRIORITY_MENTOR_NAMES.tian]: Object.freeze({
    links: Object.freeze([
      Object.freeze({ label: "小红书主页", url: "https://xhslink.com/m/3NdgyD9DdSh" }),
      Object.freeze({ label: "个人网站", url: "http://tianfei.chat" })
    ]),
    news: Object.freeze([
      Object.freeze({ label: "重要文章：3小时，AI带我开发出一个APP", url: "https://tianfei.chat/article/build-app-3hours-with-ai/" }),
      Object.freeze({ label: "重要文章：移动产品注册的交互设计思考", url: "https://tianfei.chat/article/mobile-signup-ux-design/" }),
      Object.freeze({ label: "重要文章：产品的用户、客户与粉丝", url: "https://tianfei.chat/article/users-customers-fans-difference/" })
    ])
  }),
  [PRIORITY_MENTOR_NAMES.he]: Object.freeze({
    links: Object.freeze([
      Object.freeze({ label: "小红书主页", url: "https://xhslink.com/m/1Q4wXVRAoxz" })
    ]),
    news: Object.freeze([])
  })
});

const INTERACTION_PRIORITY_KEYWORDS = [
  "交互", "用户体验", "数字媒体", "新媒体", "服务设计", "体验", "界面", "ux", "ui"
];

const INDUSTRIAL_PRIORITY_KEYWORDS = [
  "工业设计", "产品设计", "产品建模", "硬件", "制造", "结构", "工程", "落地", "材料工艺"
];

const ANALYSIS_STEPS = [
  "学姐经验库校准中：先识别你的方向倾向...",
  "学姐经验库校准中：匹配你已掌握的技能...",
  "学姐经验库校准中：推演你更适合先联系谁...",
  "推荐结论已生成，请优先查看重点导师。"
];

const ANALYSIS_HINTS = [
  "过来人提示：先联系、先沟通、再精筛，比一直纠结更有效。",
  "过来人提示：先看老师主页再写首封，命中率更高。",
  "过来人提示：首封别群发模板化，3 句话也要写出针对性。",
  "提示：仅供参考，请以学院官网信息为准。"
];

const ALUMNI_DIRECTION_POLICY_TIP = "匿名经验：2025届选导师按报考方向分组，联系前先确认报考方向与导师方向一致；2026届是否延续暂不确定，请以当年学院通知为准。";

const ALUMNI_EXPERIENCE_LIBRARY = [
  "匿名经验：先联系、先沟通、再精筛，效率明显更高。",
  "匿名经验：邮件不要群发模板化，先看官网主页再定制首封更稳。",
  "匿名经验：先找方向最接近的导师沟通，再补充作品集细节。",
  "匿名经验：先完成 1 封高质量首封邮件，比一次性海投更有效。",
  "匿名经验：经验仅供参考，最终请以学院官网信息核验。",
  ALUMNI_DIRECTION_POLICY_TIP
];

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
  activeFocusMentors: [],
  priorityDecision: null,
  referrerFrom: "",
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
  resultAiNote: document.getElementById("resultAiNote"),
  focusMentorGrid: document.getElementById("focusMentorGrid"),
  recommendReasonText: document.getElementById("recommendReasonText"),
  alumniExperienceList: document.getElementById("alumniExperienceList"),
  detailDrawer: document.getElementById("detailDrawer"),
  detailContent: document.getElementById("detailContent"),
  closeDetailBtn: document.getElementById("closeDetailBtn"),
  mentorCardTemplate: document.getElementById("mentorCardTemplate"),
  analysisOverlay: document.getElementById("analysisOverlay"),
  analysisStepText: document.getElementById("analysisStepText"),
  analysisHintText: document.getElementById("analysisHintText"),
  analysisProgressBar: document.getElementById("analysisProgressBar")
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  initAnalyticsBuffer();
  readInboundSource();
  bindEvents();
  bindChipGroups();
  hydrateProfileFromStorage();
  showLaunchView();
  renderInsightBlocks();
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
    els.loadMoreBtn.addEventListener("click", () => {
      trackEvent("load_more_click", {
        visibleCount: state.visibleMentors.length,
        currentRenderLimit: state.renderLimit
      });
      onLoadMoreMentors();
    });
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

function initAnalyticsBuffer() {
  if (!Array.isArray(window.__MENTOR_ANALYTICS__)) {
    window.__MENTOR_ANALYTICS__ = [];
  }
}

function readInboundSource() {
  try {
    const currentUrl = new URL(window.location.href);
    state.referrerFrom = normalizeText(currentUrl.searchParams.get("from"));
  } catch (_) {
    state.referrerFrom = "";
  }

  if (state.referrerFrom) {
    trackEvent("share_reflow_visit", {
      from: state.referrerFrom
    });
  }
}

function trackEvent(name, payload = {}) {
  const record = {
    event: name,
    at: new Date().toISOString(),
    from: state.referrerFrom || "direct",
    ...payload
  };

  if (Array.isArray(window.__MENTOR_ANALYTICS__)) {
    window.__MENTOR_ANALYTICS__.push(record);
  }

  if (window.dataLayer && typeof window.dataLayer.push === "function") {
    window.dataLayer.push({
      event: `mentor_${name}`,
      ...record
    });
  }
}

function showLaunchView() {
  document.body.classList.remove("in-app");
  if (els.launchScreen) {
    els.launchScreen.hidden = false;
  }
  if (els.appMain) {
    els.appMain.classList.add("app-hidden");
  }
}

async function enterApp() {
  trackEvent("start_click", {
    from: state.referrerFrom || "direct"
  });

  document.body.classList.add("in-app");
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
  const name = normalizeMentorName(mentor.name);
  const skillTags = ensureArray(mentor.skillTags);
  const careerTags = ensureArray(mentor.careerTags);
  const photoPath = normalizeText(mentor.photoPath || "") || DEFAULT_PHOTO_PATH;
  const rawSearch = `${mentor.searchText || ""} ${skillTags.join(" ")} ${careerTags.join(" ")}`.trim();
  const searchSeed = rawSearch.replaceAll("何明峰", "何铭锋").replaceAll("何铭峰", "何铭锋");

  return {
    ...mentor,
    name,
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
  trackEvent("analyze_submit", {
    targetDirectionCount: profile.targetDirection ? profile.targetDirection.split("、").length : 0,
    currentSkillsCount: profile.currentSkills ? profile.currentSkills.split("、").length : 0,
    careerPlanCount: profile.careerPlan ? profile.careerPlan.split("、").length : 0,
    consent: Boolean(els.privacyConsent.checked)
  });

  const validationError = validateProfile(profile, els.privacyConsent.checked);
  if (validationError) {
    els.formMsg.style.color = "#b63f3f";
    els.formMsg.textContent = validationError;
    trackEvent("analyze_validation_fail", { reason: validationError });
    return;
  }

  try {
    await ensureMentorsReady();
  } catch (error) {
    els.formMsg.style.color = "#b63f3f";
    els.formMsg.textContent = `数据加载失败：${error.message}`;
    trackEvent("analyze_data_load_fail", { reason: error.message || "data-load-error" });
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
    state.priorityDecision = scored.priorityDecision;
    state.activeFocusMentors = scored.focusMentors;

    persistProfile(profile);
    els.formMsg.style.color = "#0a4c38";
    els.formMsg.textContent = "推荐结论已生成，请优先查看重点导师。";
    trackEvent("analyze_success", {
      top1: scored.sorted[0]?.name || "",
      top2: scored.sorted[1]?.name || "",
      reasonType: scored.priorityDecision?.reasonType || "unknown",
      resultCount: scored.sorted.length
    });
    applyFilters({ resetRender: true });
    showResultPage();
  } catch (error) {
    els.formMsg.style.color = "#b63f3f";
    els.formMsg.textContent = error.message || "生成推荐失败，请重试。";
    trackEvent("analyze_fail", { reason: error.message || "analyze-error" });
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
  showAnalysisOverlay();
  els.formMsg.style.color = "#2c5e4c";
  for (let index = 0; index < ANALYSIS_STEPS.length; index += 1) {
    const step = ANALYSIS_STEPS[index];
    const progress = Math.round(((index + 1) / ANALYSIS_STEPS.length) * 100);
    setAnalysisStep(step, progress);
    setAnalysisHint(ANALYSIS_HINTS[index] || ANALYSIS_HINTS[ANALYSIS_HINTS.length - 1] || "");
    els.formMsg.textContent = step;
    await delay(420);
  }
  await delay(160);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function rankMentors(profile) {
  const priorityDecision = resolvePriorityDecision(profile);

  const scoredMentors = state.mentors.map((mentor) => {
    const directionScore = calcDirectionScore(profile.targetDirection, mentor);
    const skillScore = calcOverlapScore(profile.currentSkills, mentor, "skills");
    const careerScore = calcOverlapScore(profile.careerPlan, mentor, "career");

    let total = directionScore * 0.5 + skillScore * 0.3 + careerScore * 0.2;
    const name = normalizeText(mentor.name);
    if (name === priorityDecision.top1Name) {
      total += 20 + Math.min(6, priorityDecision.top1HitCount * 2);
    } else if (name === priorityDecision.top2Name) {
      total += 13 + Math.min(4, priorityDecision.top2HitCount * 1.5);
    } else if (priorityDecision.priorityMentorBoost && isPriorityMentor(mentor)) {
      total += 6;
    }

    return {
      ...mentor,
      hiddenScore: Number(clamp(total, 0, 100).toFixed(2))
    };
  });

  scoredMentors.sort((a, b) => (b.hiddenScore - a.hiddenScore) || a.name.localeCompare(b.name, "zh-CN"));
  const ordered = reorderMentorsByPriority(scoredMentors, priorityDecision);
  const scoreMap = buildExperienceScoreMap(ordered, priorityDecision);
  const sorted = ordered.map((mentor) => ({
    ...mentor,
    displayScore: scoreMap.get(mentorKey(mentor)) ?? Math.round(mentor.hiddenScore || 0)
  }));

  return {
    sorted,
    priorityDecision,
    focusMentors: pickFocusMentors(sorted, priorityDecision)
  };
}

function resolvePriorityDecision(profile) {
  const textByField = {
    targetDirection: profile.targetDirection || "",
    currentSkills: profile.currentSkills || "",
    careerPlan: profile.careerPlan || ""
  };
  const route = resolvePrimaryDirectionRoute(textByField.targetDirection);

  if (route !== "product") {
    const primaryDirection = DIRECTION_ROUTE_LABELS[route];
    const pickedNames = pickDirectionPriorityNames(primaryDirection, profile);
    const top1Name = pickedNames[0] || "";
    const top2Name = pickedNames[1] || "";
    const pickedLabel = [top1Name, top2Name].filter(Boolean).join("、");

    return {
      top1Name,
      top2Name,
      top1HitCount: top1Name ? 1 : 0,
      top2HitCount: top2Name ? 1 : 0,
      reasonType: `${route}_random`,
      primaryDirection,
      priorityMentorBoost: false,
      tianStrength: 0,
      heStrength: 0,
      reasonText: pickedLabel
        ? `你的目标方向是${primaryDirection}，已在该方向随机推荐导师（${pickedLabel}），建议先联系再精筛。`
        : `你的目标方向是${primaryDirection}，已切换为同方向优先推荐，请结合官网信息筛选导师。`
    };
  }

  const tianHits = collectPriorityHits(textByField, INTERACTION_PRIORITY_KEYWORDS);
  const heHits = collectPriorityHits(textByField, INDUSTRIAL_PRIORITY_KEYWORDS);
  const tianStrength = tianHits.target + tianHits.skills * 2 + tianHits.career * 2;
  const heStrength = heHits.target + heHits.skills * 2 + heHits.career * 2;
  const reasonType = tianHits.total === 0 && heHits.total === 0
    ? "product_general_fixed"
    : (tianHits.total >= heHits.total ? "product_interaction_fixed" : "product_industrial_fixed");

  return {
    top1Name: PRIORITY_MENTOR_NAMES.tian,
    top2Name: PRIORITY_MENTOR_NAMES.he,
    top1HitCount: tianHits.total,
    top2HitCount: heHits.total,
    reasonType,
    primaryDirection: DIRECTION_ROUTE_LABELS.product,
    priorityMentorBoost: true,
    tianStrength,
    heStrength,
    reasonText: buildProductFixedReasonText(tianHits, heHits)
  };
}

function resolvePrimaryDirectionRoute(targetDirectionText) {
  const text = normalizeText(targetDirectionText);
  if (!text) return "product";

  if (containsAny(text, ["产品设计", "产品", "工业"])) return "product";
  if (containsAny(text, ["包装设计", "包装", "智能包装设计与技术", "设计历史与理论"])) return "packaging";
  if (containsAny(text, ["传达与媒体设计", "传达", "媒体"])) return "media";
  if (containsAny(text, ["环境设计", "环艺", "环境", "乡村振兴与生态设计"])) return "environment";

  const routeScores = Object.entries(DIRECTION_ROUTE_KEYWORDS).map(([route, keywords]) => ({
    route,
    score: findMatchedKeywords(text, keywords).length
  }));
  routeScores.sort((a, b) => b.score - a.score);
  return routeScores[0]?.score > 0 ? routeScores[0].route : "product";
}

function pickDirectionPriorityNames(direction, profile) {
  const mentorsInDirection = state.mentors
    .filter((mentor) => normalizeText(mentor.direction) === direction)
    .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));

  if (!mentorsInDirection.length) return [];
  if (mentorsInDirection.length <= 2) {
    return mentorsInDirection.map((mentor) => normalizeMentorName(mentor.name));
  }

  const seedText = `${direction}|${profile.targetDirection || ""}|${profile.currentSkills || ""}|${profile.careerPlan || ""}`;
  const start = hashSeed(seedText) % mentorsInDirection.length;
  const rotated = [...mentorsInDirection.slice(start), ...mentorsInDirection.slice(0, start)];
  return rotated.slice(0, 2).map((mentor) => normalizeMentorName(mentor.name));
}

function collectPriorityHits(textByField, keywords) {
  const targetMatched = findMatchedKeywords(textByField.targetDirection, keywords);
  const skillsMatched = findMatchedKeywords(textByField.currentSkills, keywords);
  const careerMatched = findMatchedKeywords(textByField.careerPlan, keywords);
  const allMatched = [...new Set([...targetMatched, ...skillsMatched, ...careerMatched])];

  return {
    target: targetMatched.length,
    skills: skillsMatched.length,
    career: careerMatched.length,
    total: allMatched.length,
    matched: allMatched
  };
}

function findMatchedKeywords(text, keywords) {
  const normalized = normalizeText(text).toLowerCase();
  if (!normalized) return [];
  return keywords.filter((keyword) => normalized.includes(keyword.toLowerCase()));
}

function buildProductFixedReasonText(tianHits, heHits) {
  const tianMatched = tianHits.matched.slice(0, 4).join("、");
  const heMatched = heHits.matched.slice(0, 4).join("、");

  if (tianHits.total === 0 && heHits.total === 0) {
    return "你的目标方向是产品设计，当前未明显命中细分关键词，建议先联系田飞老师（Top1），再联系何铭锋老师（Top2）。";
  }
  if (tianHits.total >= heHits.total) {
    return `你的目标方向是产品设计，且更偏交互与数字体验（命中：${tianMatched || "交互/数字体验"}），建议先联系田飞老师（Top1），再联系何铭锋老师（Top2）。`;
  }
  return `你的目标方向是产品设计，且更偏工业与产品落地（命中：${heMatched || "工业/产品落地"}），仍建议按产品方向优先顺序先联系田飞老师（Top1），再联系何铭锋老师（Top2）。`;
}

function reorderMentorsByPriority(list, decision) {
  const top1 = list.find((mentor) => normalizeText(mentor.name) === decision.top1Name);
  const top2 = list.find((mentor) => normalizeText(mentor.name) === decision.top2Name);

  const moved = [];
  if (top1) moved.push(top1);
  if (top2) moved.push(top2);

  return [...moved, ...list.filter((mentor) => !moved.some((picked) => mentorKey(picked) === mentorKey(mentor)))];
}

function buildExperienceScoreMap(list, decision) {
  const map = new Map();
  let maxRestScore = 79;

  list.forEach((mentor, index) => {
    const key = mentorKey(mentor);
    if (index === 0) {
      const score = clampInt(88 + decision.top1HitCount * 2 + (decision.reasonType === "general" ? 1 : 3), 88, 96);
      map.set(key, score);
      return;
    }
    if (index === 1) {
      const score = clampInt(80 + decision.top2HitCount * 2 + (decision.reasonType === "general" ? 1 : 2), 80, 89);
      map.set(key, score);
      maxRestScore = Math.min(79, score - 1);
      return;
    }

    const raw = Math.round(mentor.hiddenScore || 0);
    const bounded = clampInt(raw, 36, Math.max(36, maxRestScore));
    map.set(key, bounded);
    maxRestScore = Math.max(35, bounded - (index < 8 ? 1 : 0));
  });

  return map;
}

function pickFocusMentors(sorted, decision) {
  const byName = new Map(sorted.map((mentor) => [normalizeText(mentor.name), mentor]));
  const top1 = byName.get(decision.top1Name);
  const top2 = byName.get(decision.top2Name);
  return [top1, top2].filter(Boolean);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function clampInt(value, min, max) {
  return Math.round(clamp(value, min, max));
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

function normalizeMentorName(name) {
  const normalized = normalizeText(name);
  if (normalized === "何明峰" || normalized === "何铭峰") return "何铭锋";
  return normalized;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function safeExternalUrl(url) {
  const normalized = normalizeText(url);
  if (!normalized) return "";
  return /^https?:\/\//i.test(normalized) ? normalized : "";
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

  if (resetRender) {
    state.renderLimit = LIST_BATCH_SIZE;
  }

  state.visibleMentors = list;
  renderMentorList();
  renderInsightBlocks();
  updateResultAiNote();
}

function updateResultAiNote() {
  if (!els.resultAiNote) return;

  if (!state.profile) {
    els.resultAiNote.textContent = "先完成学生画像，AI 会生成优先顺序和匹配解读。";
    return;
  }

  const focusMentors = state.activeFocusMentors.length ? state.activeFocusMentors : state.visibleMentors.slice(0, 2);
  const focusNames = focusMentors.map((mentor) => mentor?.name).filter(Boolean).join("、");
  const fallbackFocusNames = resolveFallbackFocusNames();
  const topScore = focusMentors[0]?.displayScore ?? Math.round(focusMentors[0]?.hiddenScore || 0);

  if (!state.visibleMentors.length) {
    els.resultAiNote.textContent = `推荐结论已生成，当前筛选下暂无结果。建议先看重点导师：${focusNames || fallbackFocusNames}。`;
    return;
  }

  const scoreText = Number.isFinite(topScore) && topScore > 0 ? `（Top1 经验型匹配值 ${topScore}%）` : "";
  els.resultAiNote.textContent = `推荐结论已生成，请优先查看重点导师：${focusNames || fallbackFocusNames}${scoreText}。`;
}

function renderInsightBlocks() {
  renderFocusMentorZone();
  renderRecommendReasonCard();
  renderAlumniExperienceTips();
}

function renderFocusMentorZone() {
  if (!els.focusMentorGrid) return;
  els.focusMentorGrid.innerHTML = "";

  const fallbackNames = state.priorityDecision
    ? [state.priorityDecision.top1Name, state.priorityDecision.top2Name].filter(Boolean)
    : [PRIORITY_MENTOR_NAMES.tian, PRIORITY_MENTOR_NAMES.he];
  const focusMentors = state.activeFocusMentors.length
    ? state.activeFocusMentors
    : fallbackNames.map((name) => resolveMentorByName(name)).filter(Boolean);

  if (!focusMentors.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "导师数据加载后将展示重点推荐。";
    els.focusMentorGrid.appendChild(empty);
    return;
  }

  focusMentors.slice(0, 2).forEach((mentor, index) => {
    const card = document.createElement("article");
    card.className = `focus-mentor-card clickable focus-top${index + 1}`;
    card.style.animationDelay = `${Math.min(index * 0.04, 0.1)}s`;
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `查看 ${normalizeText(mentor.name)} 导师详情`);

    const score = mentor.displayScore ?? Math.round(mentor.hiddenScore || 0);
    const scoreText = state.profile ? `匹配值 ${score}%` : "待匹配";
    const scoreClass = state.profile ? resolveScoreClass(score) : "";
    const mentorName = escapeHtml(mentor.name);
    const mentorMeta = escapeHtml(`${mentor.direction}·${mentor.title}`);
    const mentorResearch = escapeHtml(mentor.researchAreas || "研究方向待补充");
    const photoSrc = escapeHtml(mentor.photoPath || DEFAULT_PHOTO_PATH);
    const photoAlt = escapeHtml(`${mentor.name} 头像`);
    card.innerHTML = `
      <div class="focus-head">
        <img class="focus-photo" src="${photoSrc}" alt="${photoAlt}" loading="${index === 0 ? "eager" : "lazy"}" decoding="async">
        <div class="focus-info">
          <div class="focus-title-row">
            <h4>${mentorName}</h4>
            <div class="mentor-badges">
              <span class="rank-chip">Top ${index + 1}</span>
              <span class="score-chip${scoreClass ? ` ${scoreClass}` : ""}">${scoreText}</span>
            </div>
          </div>
          <p class="focus-meta">${mentorMeta}</p>
          <p class="focus-research">${mentorResearch}</p>
        </div>
      </div>
      <div class="focus-actions">
        <button type="button" class="focus-btn" data-action="profile">查看主页</button>
        <button type="button" class="focus-btn ghost" data-action="email">复制邮箱</button>
        <button type="button" class="focus-btn ghost" data-action="template">复制首封邮件模板</button>
      </div>
    `;

    const profileBtn = card.querySelector('[data-action="profile"]');
    const emailBtn = card.querySelector('[data-action="email"]');
    const templateBtn = card.querySelector('[data-action="template"]');
    const photo = card.querySelector(".focus-photo");

    photo?.addEventListener("error", () => {
      if (photo.src.includes(DEFAULT_PHOTO_PATH)) return;
      photo.src = DEFAULT_PHOTO_PATH;
    }, { once: true });

    profileBtn?.addEventListener("click", () => openMentorProfile(mentor));
    emailBtn?.addEventListener("click", () => copyEmail(mentor.email, mentor.name));
    templateBtn?.addEventListener("click", () => copyFirstContactTemplate(mentor));

    card.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      trackEvent("focus_card_open_detail", { mentorName: mentor.name });
      openDetail(mentor);
    });
    card.addEventListener("keydown", (event) => {
      if (event.target.closest("button")) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      trackEvent("focus_card_open_detail", { mentorName: mentor.name });
      openDetail(mentor);
    });

    els.focusMentorGrid.appendChild(card);
  });
}

function resolveFallbackFocusNames() {
  const names = state.priorityDecision
    ? [state.priorityDecision.top1Name, state.priorityDecision.top2Name].filter(Boolean)
    : [];
  if (names.length) return names.join("、");
  return `${PRIORITY_MENTOR_NAMES.tian}、${PRIORITY_MENTOR_NAMES.he}`;
}

function renderRecommendReasonCard() {
  if (!els.recommendReasonText) return;

  if (!state.profile || !state.priorityDecision) {
    els.recommendReasonText.textContent = "暂无解释，提交画像后自动生成。";
    return;
  }

  els.recommendReasonText.textContent = state.priorityDecision.reasonText;
}

function renderAlumniExperienceTips() {
  if (!els.alumniExperienceList) return;

  const tips = pickAlumniExperienceTips();
  els.alumniExperienceList.innerHTML = "";
  tips.forEach((tip) => {
    const li = document.createElement("li");
    li.textContent = tip;
    els.alumniExperienceList.appendChild(li);
  });
}

function pickAlumniExperienceTips() {
  const tipPool = ALUMNI_EXPERIENCE_LIBRARY.filter((tip) => tip !== ALUMNI_DIRECTION_POLICY_TIP);
  const randomPickCount = 3;

  if (tipPool.length <= randomPickCount) {
    return [...tipPool, ALUMNI_DIRECTION_POLICY_TIP];
  }

  const seedText = state.profile
    ? `${state.profile.targetDirection}|${state.profile.currentSkills}|${state.profile.careerPlan}`
    : "default";
  const start = hashSeed(seedText) % tipPool.length;
  const picks = [];
  for (let index = 0; index < randomPickCount; index += 1) {
    picks.push(tipPool[(start + index) % tipPool.length]);
  }
  picks.push(ALUMNI_DIRECTION_POLICY_TIP);
  return picks;
}

function hashSeed(text) {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

function resolveMentorByName(name) {
  const targetName = normalizeText(name);
  return state.rankedMentors.find((mentor) => normalizeText(mentor.name) === targetName)
    || state.mentors.find((mentor) => normalizeText(mentor.name) === targetName)
    || null;
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
  const displayScoreMap = buildDisplayScoreMap(state.visibleMentors);

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

    const roundedScore = displayScoreMap.get(mentorKey(mentor)) ?? Math.round(mentor.hiddenScore || 0);
    if (state.profile) {
      scoreChip.textContent = `匹配值 ${roundedScore}%`;
      scoreChip.classList.add(resolveScoreClass(roundedScore));
    } else {
      scoreChip.textContent = "待匹配";
    }

    const detailBtn = cardNode.querySelector(".detail-btn");
    detailBtn.addEventListener("click", () => {
      trackEvent("mentor_detail_open", {
        mentorName: mentor.name
      });
      openDetail(mentor);
    });

    const contactBtn = cardNode.querySelector(".contact-btn");
    contactBtn.textContent = "复制邮箱";
    contactBtn.addEventListener("click", () => copyEmail(mentor.email, mentor.name));

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

function buildDisplayScoreMap(list) {
  const map = new Map();
  let prev = 100;

  list.forEach((mentor) => {
    const base = Number.isFinite(mentor.displayScore) ? mentor.displayScore : Math.round(mentor.hiddenScore || 0);
    const display = Math.max(0, Math.min(base, prev));
    map.set(mentorKey(mentor), display);
    prev = display;
  });

  return map;
}

function resolveScoreClass(score) {
  if (score >= 78) return "high";
  if (score >= 58) return "medium";
  return "low";
}

function openDetail(mentor) {
  const profileUrl = safeExternalUrl(mentor.profileUrl);
  const hasProfile = Boolean(profileUrl);
  const profileLink = profileUrl
    ? `<p class="detail-meta">信息来源：<a href="${profileUrl}" target="_blank" rel="noopener">学院官网导师介绍 &gt;</a></p>`
    : "";
  const safeName = escapeHtml(mentor.name || "未公开");
  const safeMeta = escapeHtml(`${mentor.direction || "未公开"} · ${mentor.title || "未公开"}`);
  const safeOrigin = escapeHtml(mentor.origin || "未公开");
  const safeBirthYear = escapeHtml(mentor.birthYear || "未公开");
  const safeEmail = escapeHtml(mentor.email || "未公开");
  const safeResearch = escapeHtml(mentor.researchAreas || "待补充");
  const safeNotes = escapeHtml(mentor.notes || "待补充");
  const safePhotoPath = escapeHtml(mentor.photoPath || DEFAULT_PHOTO_PATH);
  const extraResourceBlocks = buildExtraResourceBlocks(mentor.name);

  els.detailContent.innerHTML = `
    <div class="detail-head">
      <img class="detail-photo" src="${safePhotoPath}" alt="${safeName} 头像">
      <div>
        <h3>${safeName}</h3>
        <p class="detail-meta">${safeMeta}</p>
        <p class="detail-meta">籍贯：${safeOrigin}</p>
        <p class="detail-meta">出生年份：${safeBirthYear}</p>
        <p class="detail-meta">邮箱：${safeEmail}</p>
        ${profileLink}
        <div class="action-row detail-inline-actions">
          <button type="button" id="detailEmailBtn">复制邮箱</button>
          ${hasProfile ? '<button type="button" id="detailProfileBtn" class="ghost">查看主页</button>' : ""}
        </div>
      </div>
    </div>
    <div class="detail-block">
      <h4>研究方向</h4>
      <p>${safeResearch}</p>
    </div>
    <div class="detail-block">
      <h4>简介</h4>
      <p>${safeNotes}</p>
    </div>
    ${extraResourceBlocks}
    <div class="detail-block detail-action-block">
      <h4>学姐建议动作</h4>
      <ol class="detail-action-list">
        <li>先看老师主页，确认研究方向是否和你当前目标一致。</li>
        <li>复制邮箱，避免在群里临时找不到联系方式。</li>
        <li>用首封邮件模板做个性化修改后再发送。</li>
      </ol>
      <div class="action-row detail-inline-actions">
        <button type="button" id="detailTemplateBtn">复制首封邮件模板</button>
      </div>
      <p class="detail-tip">经验仅供参考，请以学院官网最新信息为准。</p>
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
    detailEmailBtn.addEventListener("click", () => copyEmail(mentor.email, mentor.name));
  }
  const detailProfileBtn = document.getElementById("detailProfileBtn");
  if (detailProfileBtn) {
    detailProfileBtn.addEventListener("click", () => openMentorProfile(mentor));
  }
  const detailTemplateBtn = document.getElementById("detailTemplateBtn");
  if (detailTemplateBtn) {
    detailTemplateBtn.addEventListener("click", () => copyFirstContactTemplate(mentor));
  }

  els.detailDrawer.hidden = false;
}

function buildExtraResourceBlocks(mentorName) {
  const resources = resolveMentorExternalResources(mentorName);
  const blocks = [];

  if (resources.links.length) {
    blocks.push(buildResourceBlock("扩展链接", resources.links));
  }
  if (resources.news.length) {
    blocks.push(buildResourceBlock("重要文章", resources.news));
  }

  return blocks.join("");
}

function buildResourceBlock(title, links) {
  const listHtml = links
    .map((item) => `<li><a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">${escapeHtml(item.label)} &gt;</a></li>`)
    .join("");

  return `
    <div class="detail-block">
      <h4>${escapeHtml(title)}</h4>
      <ul class="detail-link-list">${listHtml}</ul>
    </div>
  `;
}

function resolveMentorExternalResources(mentorName) {
  const raw = MENTOR_EXTRA_LINKS[normalizeMentorName(mentorName)] || { links: [], news: [] };
  const normalizeItems = (items) => items
    .map((item) => ({ label: normalizeText(item.label), url: safeExternalUrl(item.url) }))
    .filter((item) => item.label && item.url);

  return {
    links: normalizeItems(raw.links || []),
    news: normalizeItems(raw.news || [])
  };
}

function closeDetail() {
  els.detailDrawer.hidden = true;
}

function openMentorProfile(mentor) {
  const url = safeExternalUrl(mentor?.profileUrl);
  if (!url) {
    showTempMessage("官网主页暂未公开，请先使用邮箱联系。", false);
    trackEvent("profile_open_fail", {
      mentorName: mentor?.name || ""
    });
    return;
  }
  trackEvent("profile_open", {
    mentorName: mentor.name
  });
  window.open(url, "_blank", "noopener");
}

async function copyFirstContactTemplate(mentor) {
  const template = buildFirstContactTemplate(mentor);
  try {
    await copyText(template);
    showTempMessage("首封邮件模板已复制，可直接粘贴修改。", true);
    trackEvent("first_template_copy", {
      mentorName: mentor?.name || ""
    });
  } catch (_) {
    showTempMessage("复制失败，请稍后再试。", false);
    trackEvent("first_template_copy_fail", {
      mentorName: mentor?.name || ""
    });
  }
}

function buildFirstContactTemplate(mentor) {
  const mentorName = mentor?.name || "老师";
  const direction = mentor?.direction || "设计方向";
  const areas = mentor?.researchAreas || "研究方向";
  const sourceLine = mentor?.profileUrl ? `我已阅读您在学院官网的导师介绍：${mentor.profileUrl}` : "我已阅读学院官网导师信息。";

  return [
    `邮件主题：申请咨询｜${direction}方向｜姓名-本科院校`,
    "",
    `${mentorName}老师您好，`,
    "",
    "我是湖南工业大学相关方向考研/调剂同学，想向您咨询研究方向与培养机会。",
    `我目前更关注：${areas}。`,
    sourceLine,
    "如您方便，我希望进一步请教您对研究准备和作品方向的建议。",
    "",
    "附件（可选）：个人简历 / 作品集链接",
    "",
    "感谢您在百忙中的阅读，期待您的指导。",
    "",
    "此致",
    "敬礼",
    "姓名",
    "联系电话",
    "日期",
    "",
    "说明：本模板仅供参考，请结合个人情况与官网信息个性化修改。"
  ].join("\n");
}

async function copyEmail(email, mentorName = "") {
  const value = normalizeText(email);
  if (!value || value.includes("未公开") || value.includes("未在公开信息中明确")) {
    showTempMessage("该导师邮箱待补充，请先查看官网主页。", false);
    trackEvent("email_copy_fail", {
      mentorName,
      reason: "email-not-public"
    });
    return;
  }

  try {
    await copyText(value);
    showTempMessage(`邮箱已复制：${value}`, true);
    trackEvent("email_copy", {
      mentorName
    });
  } catch (_) {
    showTempMessage("复制失败，请手动长按邮箱复制。", false);
    trackEvent("email_copy_fail", {
      mentorName,
      reason: "copy-error"
    });
  }
}

async function onCopyShare() {
  const message = buildShareMessage();
  try {
    await copyText(message);
    showTempMessage("分享文案已复制，去微信粘贴即可转发。", true);
    trackEvent("share_copy", {
      topMentor: state.activeFocusMentors[0]?.name || state.visibleMentors[0]?.name || ""
    });
  } catch (_) {
    showTempMessage("复制失败，请稍后再试。", false);
    trackEvent("share_copy_fail");
  }
}

function buildShareMessage() {
  const topMentor = state.activeFocusMentors[0] || state.visibleMentors[0];
  const topMentorName = topMentor?.name || PRIORITY_MENTOR_NAMES.tian;
  const target = state.profile?.targetDirection || "设计相关方向";
  const shareUrl = buildShareUrl(SHARE_FROM_PARAM);

  return [
    `我刚用一个学姐做的导师筛选工具测了下，当前更建议先联系【${topMentorName}】。`,
    `我的方向是「${target}」，结论里还有推荐理由和首封邮件模板。`,
    "她当年也被“选导师”折磨过，所以把踩坑经验做成了这个工具。",
    `同方向同学也测一下：${shareUrl}`,
    `学姐小红书：${SENIOR_PROFILE.xhsUrl}`,
    `仅供参考，以学院官网为准：${SOURCE_URL}`
  ].filter(Boolean).join("\n");
}

function buildShareUrl(fromValue) {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("from", fromValue);
    return url.toString();
  } catch (_) {
    const hasQuery = window.location.href.includes("?");
    return `${window.location.href}${hasQuery ? "&" : "?"}from=${encodeURIComponent(fromValue)}`;
  }
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
  setAnalysisHint(ANALYSIS_HINTS[0] || "");
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

function setAnalysisHint(text) {
  if (!els.analysisHintText) return;
  els.analysisHintText.textContent = text;
}

function hideAnalysisOverlay() {
  if (!els.analysisOverlay) return;
  els.analysisOverlay.hidden = true;
  setAnalysisStep("准备中...", 0);
  setAnalysisHint(ANALYSIS_HINTS[0] || "");
}

function onReset() {
  if (state.isAnalyzing) return;
  trackEvent("form_reset");

  els.profileForm.reset();
  clearChipGroup(els.targetDirectionChips, els.targetDirection, els.targetDirectionExtra);
  clearChipGroup(els.currentSkillsChips, els.currentSkills, els.currentSkillsExtra);
  clearChipGroup(els.careerPlanChips, els.careerPlan, els.careerPlanExtra);

  els.formMsg.textContent = "";
  els.formMsg.style.color = "#b63f3f";
  state.profile = null;
  state.activeFocusMentors = [];
  state.priorityDecision = null;
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
