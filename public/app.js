import {
  modules,
  allFunctions,
  functionById,
  moduleById,
  sources
} from './catalog.js';
import { exercises as coreExercises } from './exercises.js';
import { ptaExercises } from './pta-exercises.js';
import { functionGuides } from './function-guides.js';

const levelNames = { 1: 'L1 热身', 2: 'L2 基础', 3: 'L3 标准', 4: 'L4 进阶', 5: 'L5 综合' };
const exercises = [...coreExercises, ...ptaExercises]
  .map((exercise) => ({ ...exercise, levelName: levelNames[exercise.level] || 'L3 标准' }))
  .sort((a, b) => a.level - b.level || a.minutes - b.minutes || a.title.localeCompare(b.title));

const exerciseById = new Map(exercises.map((item) => [item.id, item]));


const icons = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/>',
  route: '<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8.2 18H14a4 4 0 0 0 0-8h-4a4 4 0 0 1 0-8"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z"/><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20"/><path d="M8 7h8M8 11h6"/>',
  brain: '<path d="M9.5 4.5A3 3 0 0 0 6.4 7a3.4 3.4 0 0 0-1.9 6.1A3.4 3.4 0 0 0 7 18.7a3 3 0 0 0 5 2V4.5a2 2 0 0 0-2.5 0Z"/><path d="M14.5 4.5A3 3 0 0 1 17.6 7a3.4 3.4 0 0 1 1.9 6.1 3.4 3.4 0 0 1-2.5 5.6 3 3 0 0 1-5 2V4.5a2 2 0 0 1 2.5 0Z"/><path d="M7 9h2M15 9h2M7 14h2M15 14h2"/>',
  flask: '<path d="M9 3h6M10 3v5l-5.5 9.2A3 3 0 0 0 7.1 22h9.8a3 3 0 0 0 2.6-4.8L14 8V3"/><path d="M7.5 15h9"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
  flame: '<path d="M12 22c4 0 7-2.7 7-6.5 0-2.8-1.5-5.1-4.1-7.4.2 2.1-.8 3.5-2.1 4.3.2-3.5-1.2-6.1-3.8-8.4.1 4.1-4 6.7-4 11.5C5 19.3 8 22 12 22Z"/><path d="M9.8 18.1c0-1.5.9-2.7 2.2-3.6-.1 1.1.4 1.9 1.1 2.3.1-1.2.5-2.2 1.4-3 .1 2.1 1.5 2.6 1.5 4.2 0 1.7-1.4 3-3.1 3s-3.1-1.3-3.1-2.9Z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  play: '<path d="m8 5 11 7-11 7V5Z"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  code: '<path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14"/>',
  spark: '<path d="m12 3 1.3 4.2L17.5 8.5l-4.2 1.3L12 14l-1.3-4.2-4.2-1.3 4.2-1.3L12 3Z"/><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M9 2h6M12 2v3"/>',
  file: '<path d="M6 2h8l4 4v16H6V2Z"/><path d="M14 2v5h5M9 12h6M9 16h6"/>',
  git: '<circle cx="6" cy="5" r="2.5"/><circle cx="18" cy="19" r="2.5"/><circle cx="6" cy="19" r="2.5"/><path d="M6 7.5v9M8.5 5H14a4 4 0 0 1 4 4v7.5"/>',
  external: '<path d="M14 3h7v7M21 3l-9 9"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  refresh: '<path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M6.1 9a7 7 0 0 1 11.5-2L20 12M4 12l2.4 5a7 7 0 0 0 11.5-2"/>',
  save: '<path d="M5 3h12l3 3v15H4V3h1Z"/><path d="M8 3v6h8V3M8 21v-7h8v7"/>',
  ai: '<rect x="4" y="6" width="16" height="14" rx="4"/><path d="M9 13h.01M15 13h.01M9 17h6M12 6V3M8 3h8"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',
  terminal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3M13 15h4"/>',
  bulb: '<path d="M9 18h6M10 22h4M8.2 15.2A7 7 0 1 1 15.8 15.2c-.8.6-1.3 1.3-1.3 2.3h-5c0-1-.5-1.7-1.3-2.3Z"/>'
};

function icon(name, size = 18, className = '') {
  return `<svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.spark}</svg>`;
}

const STORAGE_KEY = 'fx-c-function-lab-v1';
const defaultState = {
  version: 1,
  labs: {},
  mistakes: {},
  activity: {},
  streak: { lastDate: null, days: 0 },
  xp: 0,
  dailyGoal: 3
};

function freshState() {
  return JSON.parse(JSON.stringify(defaultState));
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved || typeof saved !== 'object') return freshState();
    return {
      ...freshState(),
      ...saved,
      labs: saved.labs || {},
      mistakes: saved.mistakes || {},
      activity: saved.activity || {},
      streak: { ...defaultState.streak, ...(saved.streak || {}) }
    };
  } catch {
    return freshState();
  }
}

let state = loadState();
let health = { compiler: { available: false, version: '' }, ai: { configured: false, model: null } };
let atlasQuery = '';
let atlasModule = 'all';
let atlasSort = 'frequency';
let lastRouteKey = '';
let saveTimer = null;
const lastLabResults = new Map();

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('学习进度保存失败', error);
  }
}

function todayKey() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function dayOffset(dateString, amount) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return date.toISOString().slice(0, 10);
}

function touchActivity(points = 0) {
  const today = todayKey();
  state.activity[today] = (state.activity[today] || 0) + 1;
  if (state.streak.lastDate !== today) {
    state.streak.days = state.streak.lastDate === dayOffset(today, -1) ? state.streak.days + 1 : 1;
    state.streak.lastDate = today;
  }
  state.xp = Math.max(0, (state.xp || 0) + points);
}

function dailyQuizCount() {
  return Object.values(state.labs).filter((record) => String(record.lastRunAt || '').slice(0, 10) === todayKey()).length;
}

function practicedFunctions() {
  const names = new Set();
  for (const exercise of exercises) {
    if (!state.labs[exercise.id]?.passed) continue;
    for (const name of exercise.functions) names.add(name);
  }
  return names;
}

function masteredFunctionCount() {
  return practicedFunctions().size;
}

function relatedExercisesForFunctionId(functionId) {
  const item = functionById.get(functionId);
  if (!item) return [];
  return exercises.filter((exercise) => exercise.functions.includes(item.name));
}

function isFunctionComplete(functionId) {
  const related = relatedExercisesForFunctionId(functionId);
  return related.length > 0 && related.every((exercise) => state.labs[exercise.id]?.passed);
}

function passedExercisesForFunctionId(functionId) {
  return relatedExercisesForFunctionId(functionId).filter((exercise) => state.labs[exercise.id]?.passed);
}

function nextPracticeExercise() {
  return exercises.find((exercise) => !state.labs[exercise.id]?.passed) || exercises[0];
}

function passedLabCount() {
  return exercises.filter((exercise) => state.labs[exercise.id]?.passed).length;
}



function moduleStats(moduleId) {
  const module = moduleById.get(moduleId);
  const moduleExercises = exercises.filter((exercise) => exercise.moduleId === moduleId);
  const completed = moduleExercises.filter((exercise) => state.labs[exercise.id]?.passed).length;
  const practiced = new Set();
  for (const exercise of moduleExercises) {
    if (!state.labs[exercise.id]?.passed) continue;
    for (const name of exercise.functions) {
      if (module.functions.some((item) => item.name === name)) practiced.add(name);
    }
  }
  return {
    total: module.functions.length,
    mastered: practiced.size,
    completed,
    exerciseTotal: moduleExercises.length,
    percent: moduleExercises.length ? Math.round((completed / moduleExercises.length) * 100) : 0
  };
}

function pct(done, total) {
  if (!total) return 0;
  return Math.min(100, Math.round((done / total) * 100));
}

function formatShortDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function truncate(text, length = 90) {
  return String(text).length > length ? `${String(text).slice(0, length - 1)}…` : String(text);
}

function toast(message, type = 'success') {
  const root = document.getElementById('toast-root');
  const item = document.createElement('div');
  item.className = `toast toast-${type}`;
  item.innerHTML = `${icon(type === 'error' ? 'close' : 'check', 16)}<span>${escapeHtml(message)}</span>`;
  root.appendChild(item);
  requestAnimationFrame(() => item.classList.add('is-visible'));
  setTimeout(() => {
    item.classList.remove('is-visible');
    setTimeout(() => item.remove(), 240);
  }, 3200);
}

const navItems = [
  { id: 'home', path: '/', label: '今日训练', icon: 'home' },
  { id: 'path', path: '/path', label: '刷题路线', icon: 'route' },
  { id: 'atlas', path: '/atlas', label: '函数图鉴', icon: 'book' },
  { id: 'labs', path: '/labs', label: '编码刷题', icon: 'code' },
  { id: 'report', path: '/report', label: '学习报告', icon: 'chart' }
];

const routeMeta = {
  home: { eyebrow: 'OVERVIEW', title: '今日训练' },
  path: { eyebrow: 'CURRICULUM', title: '训练路线' },
  atlas: { eyebrow: 'REFERENCE', title: '函数图鉴' },
  drill: { eyebrow: 'CODE PRACTICE', title: '编码刷题' },
  labs: { eyebrow: 'HANDS-ON PRACTICE', title: '编码刷题' },
  lab: { eyebrow: 'CODE PRACTICE', title: '刷题工作台' },
  report: { eyebrow: 'PROGRESS', title: '学习报告' },
  about: { eyebrow: 'METHOD', title: '依据与配置' }
};

function parseRoute() {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [pathPart, queryPart = ''] = raw.split('?');
  const segments = pathPart.split('/').filter(Boolean);
  return {
    raw,
    segments,
    name: segments[0] || 'home',
    id: segments[1] || '',
    query: new URLSearchParams(queryPart)
  };
}

function renderSidebar(route) {
  const sidebar = document.getElementById('sidebar');
  const mastered = masteredFunctionCount();
  const masteryPercent = pct(mastered, allFunctions.length);
  const dailyDone = Math.min(dailyQuizCount(), state.dailyGoal);
  const goalPercent = pct(dailyDone, state.dailyGoal);
  const activeId = route.name === 'lab' || route.name === 'drill' ? 'labs' : route.name;
  const remaining = Math.max(0, exercises.length - passedLabCount());
  sidebar.innerHTML = `
    <div class="sidebar-brand">
      <a class="brand" href="#/" aria-label="返回首页">
        <span class="brand-mark">ƒ<span>x</span></span>
        <span class="brand-text"><strong>函数训练场</strong><small>C STANDARD LIBRARY</small></span>
      </a>
    </div>
    <nav class="nav-list" aria-label="学习功能">
      ${navItems.map((item, index) => `
        <a class="nav-item ${activeId === item.id ? 'is-active' : ''}" href="#${item.path}" ${activeId === item.id ? 'aria-current="page"' : ''}>
          <span class="nav-icon">${icon(item.icon, 19)}</span>
          <span class="nav-label">${item.label}</span>
          ${item.id === 'labs' ? `<span class="nav-count">${remaining}</span>` : ''}
          ${index === 0 && dailyQuizCount() === 0 ? '<span class="nav-pulse" aria-label="有新训练"></span>' : ''}
        </a>
      `).join('')}
    </nav>
    <div class="sidebar-spacer"></div>
    <section class="sidebar-goal" aria-label="今日目标">
      <div class="goal-head">
        <span>${icon('target', 15)} 今日目标</span>
        <strong>${dailyDone}/${state.dailyGoal}</strong>
      </div>
      <div class="goal-bar"><span style="width:${goalPercent}%"></span></div>
      <p>${dailyDone >= state.dailyGoal ? '今天的目标已完成。' : `再完成 ${state.dailyGoal - dailyDone} 道编码题。`}</p>
    </section>
    <section class="sidebar-mastery">
      <div class="mastery-ring" style="--ring:${masteryPercent}%">
        <span>${masteryPercent}<small>%</small></span>
      </div>
      <div>
        <strong>${mastered}<span> / ${allFunctions.length}</span></strong>
        <p>函数已练</p>
      </div>
    </section>
    <a class="sidebar-footer ${route.name === 'about' ? 'is-active' : ''}" href="#/about">
      <span class="status-dot ${health.ai.configured ? 'is-online' : ''}"></span>
      <span>${health.ai.configured ? `AI · ${health.ai.model}` : 'AI 待配置'}</span>
      ${icon('settings', 15)}
    </a>
  `;
}

function renderTopbar(route) {
  const meta = routeMeta[route.name] || routeMeta.home;
  const topbar = document.getElementById('topbar');
  const streak = state.streak.days || 0;
  topbar.innerHTML = `
    <div class="topbar-title">
      <a class="topbar-mobile-brand" href="#/" aria-label="首页">ƒx</a>
      <div>
        <span>${meta.eyebrow}</span>
        <h2>${meta.title}</h2>
      </div>
    </div>
    <div class="topbar-actions">
      <button class="search-shortcut" type="button" data-action="focus-search" aria-label="搜索函数">
        ${icon('search', 17)}<span>搜索函数</span><kbd>/</kbd>
      </button>
      <span class="system-pill ${health.compiler.available ? 'is-ready' : 'is-warn'}" title="${escapeHtml(health.compiler.version || '编译器状态未知')}">
        ${icon('terminal', 15)} ${health.compiler.available ? 'gcc 就绪' : '编译器离线'}
      </span>
      <a class="streak-pill" href="#/report" title="连续学习天数">
        ${icon('flame', 16)} <strong>${streak}</strong><span>天</span>
      </a>
      <a class="avatar" href="#/report" aria-label="查看学习报告">${state.xp >= 1000 ? 'PRO' : 'C'}</a>
    </div>
  `;
}

function renderHome() {
  const mastered = masteredFunctionCount();
  const masteryPercent = pct(mastered, allFunctions.length);
  const dailyDone = dailyQuizCount();
  const nextLab = nextPracticeExercise();
  const nextFunction = allFunctions.find((item) => item.name === nextLab.functions[0]) || allFunctions[0];
  const topFunctions = allFunctions.slice(0, 8);
  const hasProgress = passedLabCount() > 0;

  return `
    <section class="hero-card">
      <div class="hero-copy">
        <div class="hero-kicker"><span></span>C STANDARD LIBRARY · FUNCTION LAB</div>
        <h1>别背函数，<br><em>练出手感。</em></h1>
        <p class="hero-lead">从最常用的 <code>strlen</code> 到综合数据管线。113 个常用接口按使用频率分类，${exercises.length} 道必须动手写的编码题由浅入深，${exercises.reduce((sum, item) => sum + item.tests.length, 0)} 个测试由 gcc 真实编译判分。</p>
        <div class="hero-actions">
          <a class="button button-primary" href="#/labs">${icon('play', 17)} ${hasProgress ? '继续编码刷题' : '从 L1 开始动手写'} ${icon('arrow', 17)}</a>
          <a class="button button-ghost" href="#/path">查看训练路线</a>
        </div>
        <div class="hero-proof">
          <span>${icon('check', 14)} ISO C11 语义</span>
          <span>${icon('check', 14)} 公共测试 + AI 审查</span>
          <span>${icon('check', 14)} 完全本地运行</span>
        </div>
      </div>
      <div class="hero-visual" aria-label="当前推荐函数 ${nextFunction.name}">
        <div class="hero-orbit orbit-one"></div>
        <div class="hero-orbit orbit-two"></div>
        <div class="floating-token token-one">size_t</div>
        <div class="floating-token token-two">NULL</div>
        <div class="floating-token token-three">%zu</div>
        <div class="hero-function-card">
          <div class="function-card-top">
            <span class="mini-label">NEXT UP · #${nextFunction.rank}</span>
            <span class="freq-badge">${nextFunction.frequency}</span>
          </div>
          <div class="function-symbol">${escapeHtml(nextFunction.name)}<span>()</span></div>
          <code class="function-signature">${escapeHtml(nextFunction.signature)}</code>
          <p>${escapeHtml(nextFunction.task)}</p>
          <a href="#/labs?function=${encodeURIComponent(nextFunction.id)}" class="function-card-link">专项练这个函数 ${icon('arrow', 15)}</a>
        </div>
        <div class="mastery-orbit" style="--ring:${masteryPercent}%">
          <span><strong>${masteryPercent}%</strong><small>覆盖度</small></span>
        </div>
        <div class="hero-notch">ƒ(x)</div>
      </div>
    </section>

    <section class="stat-grid" aria-label="学习概况">
      <article class="stat-card">
        <span class="stat-icon pink">${icon('code', 18)}</span>
        <div><strong>${passedLabCount()}</strong><span>已通过编码题</span></div>
        <em>共 ${exercises.length} 道动手题</em>
      </article>
      <article class="stat-card">
        <span class="stat-icon mauve">${icon('book', 18)}</span>
        <div><strong>${mastered}</strong><span>已练过的函数</span></div>
        <em>${allFunctions.length} 个函数分类目录</em>
      </article>
      <article class="stat-card">
        <span class="stat-icon clay">${icon('check', 18)}</span>
        <div><strong>${Object.values(state.labs).reduce((sum, record) => sum + (record.bestPassed || 0), 0)}</strong><span>测试用例通过</span></div>
        <em>共 ${exercises.reduce((sum, item) => sum + item.tests.length, 0)} 个公共测试</em>
      </article>
      <article class="stat-card">
        <span class="stat-icon sand">${icon('flame', 18)}</span>
        <div><strong>${state.streak.days || 0}</strong><span>连续学习天数</span></div>
        <em>${state.xp} XP 累计</em>
      </article>
    </section>

    <div class="content-grid home-grid">
      <section class="panel today-panel">
        <div class="section-heading compact">
          <div>
            <span class="eyebrow">TODAY'S PATH</span>
            <h2>今天怎么练</h2>
          </div>
          <span class="soft-label">${dailyDone >= state.dailyGoal ? '目标已达成' : `今日 ${dailyDone}/${state.dailyGoal}`}</span>
        </div>
        <div class="today-steps">
          <a class="today-step ${dailyDone >= 1 ? 'is-done' : ''}" href="#/labs?level=1">
            <span class="step-index">${dailyDone >= 1 ? icon('check', 16) : '01'}</span>
            <div><strong>先写一道 L1 热身题</strong><p>自己输入代码，通过编译与测试，不再做选择题。</p></div>
            <span class="step-time">${icon('timer', 14)} 8–12 min</span>
          </a>
          <a class="today-step ${state.labs[nextLab.id]?.passed ? 'is-done' : ''}" href="#/lab/${nextLab.id}">
            <span class="step-index">${state.labs[nextLab.id]?.passed ? icon('check', 16) : '02'}</span>
            <div><strong>${escapeHtml(nextLab.title)}</strong><p>${escapeHtml(nextLab.summary)}</p></div>
            <span class="step-time">${icon('timer', 14)} ${nextLab.minutes} min</span>
          </a>
          <a class="today-step" href="#/about">
            <span class="step-index">03</span>
            <div><strong>用 PTA 规则做代码体检</strong><p>内置 25 条常见错因与逐字符输出比对；配置 API 后还可追加 AI 审查。</p></div>
            <span class="step-time">${health.ai.configured ? '本地 + AI' : '本地可用'}</span>
          </a>
        </div>
      </section>

      <aside class="panel rank-panel">
        <div class="section-heading compact">
          <div><span class="eyebrow">FREQUENCY SIGNAL</span><h2>高频热榜</h2></div>
          <a class="text-link" href="#/atlas">全部 ${allFunctions.length} 个 ${icon('chevron', 14)}</a>
        </div>
        <ol class="rank-list">
          ${topFunctions.map((item) => {
            const related = relatedExercisesForFunctionId(item.id);
            const done = passedExercisesForFunctionId(item.id).length;
            const complete = related.length > 0 && done === related.length;
            return `<li>
              <button class="rank-row" type="button" data-action="open-function" data-function="${item.id}">
                <span class="rank-number">${String(item.rank).padStart(2, '0')}</span>
                <span class="rank-name"><code>${item.name}</code><small>${item.header}</small></span>
                <span class="rank-meter"><i style="width:${item.score}%"></i></span>
                <span class="rank-state ${complete ? 'done' : ''}">${complete ? icon('check', 14) : related.length ? `${done}/${related.length}` : '—'}</span>
              </button>
            </li>`;
          }).join('')}
        </ol>
      </aside>
    </div>

    <section class="module-section">
      <div class="section-heading">
        <div>
          <span class="eyebrow">LEARNING MAP</span>
          <h2>六大函数域，逐层综合</h2>
          <p>先按函数分类做单点题，再进入综合题。每道题都必须自己写代码并通过真实测试。</p>
        </div>
        <a class="button button-ghost small" href="#/path">查看完整路线 ${icon('arrow', 15)}</a>
      </div>
      <div class="module-grid">
        ${modules.map((module) => {
          const stats = moduleStats(module.id);
          return `<a class="module-card tone-${module.stage}" href="#/labs?module=${module.id}">
            <div class="module-top">
              <span class="module-mark">${module.mark}</span>
              <span class="stage-tag">STAGE ${String(module.stage).padStart(2, '0')}</span>
            </div>
            <h3>${module.name}</h3>
            <p>${module.description}</p>
            <div class="module-functions">${module.functions.slice(0, 4).map((item) => `<code>${item.name}</code>`).join('')}<span>+${module.functions.length - 4}</span></div>
            <div class="module-progress">
              <div><span>${stats.completed}/${stats.exerciseTotal} 题通过</span><strong>${stats.percent}%</strong></div>
              <div class="progress-track"><i style="width:${stats.percent}%"></i></div>
            </div>
          </a>`;
        }).join('')}
      </div>
    </section>

    <section class="method-strip">
      <div class="method-strip-icon">${icon('spark', 24)}</div>
      <div><span class="eyebrow">WHY THIS ORDER</span><h3>频率优先，难度递进，代码必须跑通。</h3><p>L1 热身 → L2 基础 → L3 标准 → L4 进阶 → L5 综合。PTA 规则先查常见错因，gcc 再用真实输入输出判分。</p></div>
      <a class="text-link" href="#/about">查看依据 ${icon('external', 14)}</a>
    </section>
  `;
}

function renderPath() {
  const overall = pct(passedLabCount(), exercises.length);
  return `
    <section class="page-intro path-intro">
      <div>
        <span class="eyebrow">FROM ATOMS TO SYSTEMS</span>
        <h1>从单函数，到可交付的 C 程序。</h1>
        <p>按函数类别和使用频率组织，难度从 L1 到 L5 逐级增加。每道题都要自己写 C 代码，由 gcc 编译、公共测试判分，并可用 PTA 规则做代码体检。</p>
        <div class="inline-actions">
          <a class="button button-primary" href="#/labs?level=1">从 L1 开始写 ${icon('arrow', 16)}</a>
          <a class="button button-ghost" href="#/labs">浏览全部编码题</a>
        </div>
      </div>
      <div class="route-summary-card">
        <span class="mini-label">YOUR ROUTE</span>
        <strong>${overall}%</strong>
        <p>编码题完成度</p>
        <div class="route-summary-grid">
          <div><b>113</b><span>函数</span></div>
          <div><b>${exercises.length}</b><span>编码题</span></div>
          <div><b>${exercises.reduce((sum, item) => sum + item.tests.length, 0)}</b><span>测试</span></div>
          <div><b>6</b><span>阶段</span></div>
        </div>
      </div>
    </section>

    <section class="learning-principles">
      <article><span>01</span><div><strong>先识别语义</strong><p>知道“该用谁”：从任务反推标准库接口。</p></div></article>
      <article><span>02</span><div><strong>再盯住边界</strong><p>终止符、容量、EOF、NULL、溢出与精度。</p></div></article>
      <article><span>03</span><div><strong>最后做综合</strong><p>用 stdin/stdout 契约验证真实程序行为。</p></div></article>
    </section>

    <section class="timeline-section">
      <div class="section-heading">
        <div><span class="eyebrow">STAGE BY STAGE</span><h2>训练主线</h2><p>顺序不是绝对限制；已经掌握的部分可以直接跳到实验。</p></div>
        <span class="soft-label">${passedLabCount()} / ${exercises.length} 题已通过</span>
      </div>
      <div class="stage-timeline">
        ${modules.map((module) => {
          const stats = moduleStats(module.id);
          const top = module.functions.slice(0, 7);
          const labs = exercises.filter((exercise) => exercise.moduleId === module.id);
          return `<article class="stage-card">
            <div class="stage-rail"><span>${String(module.stage).padStart(2, '0')}</span><i></i></div>
            <div class="stage-body">
              <div class="stage-heading">
                <div class="stage-heading-main">
                  <span class="module-mark small">${module.mark}</span>
                  <div><span class="eyebrow">${module.source} · ${module.header}</span><h3>${module.name}</h3></div>
                </div>
                <span class="completion ${stats.percent === 100 ? 'done' : ''}">${stats.percent}%</span>
              </div>
              <p>${module.description}</p>
              <div class="stage-outcome"><span>${icon('target', 16)}</span><p><strong>阶段产出</strong>${module.outcome}</p></div>
              <div class="stage-functions">
                ${top.map((item) => `<button type="button" class="function-chip ${isFunctionComplete(item.id) ? 'is-done' : ''}" data-action="open-function" data-function="${item.id}"><code>${item.name}</code><small>#${item.rank}</small></button>`).join('')}
                <a class="function-chip more" href="#/atlas?module=${module.id}">+${module.functions.length - top.length} 个</a>
              </div>
              <div class="stage-actions">
                <a class="button button-primary small" href="#/labs?module=${module.id}">练这一组 ${icon('arrow', 14)}</a>
                <a class="button button-ghost small" href="#/labs?module=${module.id}">${labs.length} 道相关题</a>
              </div>
            </div>
          </article>`;
        }).join('')}
      </div>
    </section>

    <section class="panel integration-panel">
      <div class="integration-copy">
        <span class="eyebrow">CAPSTONE TRACK</span>
        <h2>综合编码挑战</h2>
        <p>单点题达到 60% 后进入综合题。题目按“解析 → 计算 → 排序/查找 → 格式化输出”的真实程序链组织，而不是孤立 API 调用。</p>
        <a class="button button-primary" href="#/labs">查看全部 ${exercises.length} 道编码题 ${icon('arrow', 16)}</a>
      </div>
      <div class="integration-list">
        ${exercises.slice(-5).map((exercise, index) => `<a href="#/lab/${exercise.id}"><span>${String(index + 1).padStart(2, '0')}</span><div><strong>${escapeHtml(exercise.title)}</strong><small>${escapeHtml(exercise.track)} · ${exercise.minutes} min</small></div>${state.labs[exercise.id]?.passed ? icon('check', 17) : icon('chevron', 17)}</a>`).join('')}
      </div>
    </section>
  `;
}

function filteredFunctions() {
  return allFunctions
    .filter((item) => atlasModule === 'all' || item.moduleId === atlasModule)
    .filter((item) => {
      const query = atlasQuery.trim().toLowerCase();
      if (!query) return true;
      return [item.name, item.signature, item.summary, item.pitfall, item.header, item.moduleName]
        .some((value) => String(value).toLowerCase().includes(query));
    })
    .sort((a, b) => {
      if (atlasSort === 'name') return a.name.localeCompare(b.name);
      if (atlasSort === 'module') return a.moduleId.localeCompare(b.moduleId) || a.rank - b.rank;
      return a.rank - b.rank;
    });
}

function renderAtlasRows(items) {
  if (!items.length) {
    return `<div class="empty-state">${icon('search', 24)}<h3>没有匹配的函数</h3><p>换一个关键词，或清除模块筛选。</p><button class="button button-ghost small" type="button" data-action="clear-atlas">清除筛选</button></div>`;
  }
  return `<div class="atlas-table" role="table" aria-label="函数目录">
    <div class="atlas-table-head" role="row">
      <span>频率排名</span><span>函数与头文件</span><span>一句话语义</span><span>编码题</span><span></span>
    </div>
    ${items.map((item) => {
      const related = relatedExercisesForFunctionId(item.id);
      const passed = passedExercisesForFunctionId(item.id).length;
      const complete = related.length > 0 && passed === related.length;
      return `<button class="atlas-row" type="button" role="row" data-action="open-function" data-function="${item.id}">
        <span class="atlas-rank" role="cell"><b>#${String(item.rank).padStart(3, '0')}</b><i style="width:${item.score}%"></i></span>
        <span class="atlas-name" role="cell"><code>${escapeHtml(item.name)}</code><small>${escapeHtml(item.header)} · ${escapeHtml(item.frequency)}频</small></span>
        <span class="atlas-summary" role="cell">${escapeHtml(truncate(item.summary, 72))}</span>
        <span class="atlas-mastery ${complete ? 'done' : ''}" role="cell">${related.length ? `${passed}/${related.length} 题` : '待出题'}</span>
        <span class="atlas-arrow" role="cell">${icon('chevron', 16)}</span>
      </button>`;
    }).join('')}
  </div>`;
}

function renderAtlas(route) {
  const queryModule = route.query.get('module');
  if (queryModule && moduleById.has(queryModule)) atlasModule = queryModule;
  if (!queryModule && route.query.has('reset')) atlasModule = 'all';
  const items = filteredFunctions();
  return `
    <section class="page-intro atlas-intro">
      <div>
        <span class="eyebrow">113 FUNCTIONS · ${exercises.length} CODING TASKS</span>
        <h1>函数图鉴</h1>
        <p>按全局使用频率排序的常用 C 标准库目录。这里不是文档复读机：每个条目都附带“什么时候用”和“最容易错在哪”。</p>
      </div>
      <div class="atlas-number">113<small>常用接口</small></div>
    </section>

    <section class="atlas-toolbar panel">
      <label class="search-field">
        ${icon('search', 18)}
        <input id="atlas-search" type="search" value="${escapeHtml(atlasQuery)}" placeholder="搜索 strlen、内存、换行、qsort……" autocomplete="off" aria-label="搜索函数">
        <kbd>/</kbd>
      </label>
      <div class="sort-control" role="group" aria-label="排序方式">
        <button type="button" class="${atlasSort === 'frequency' ? 'is-active' : ''}" data-action="atlas-sort" data-sort="frequency">频率</button>
        <button type="button" class="${atlasSort === 'name' ? 'is-active' : ''}" data-action="atlas-sort" data-sort="name">名称</button>
        <button type="button" class="${atlasSort === 'module' ? 'is-active' : ''}" data-action="atlas-sort" data-sort="module">模块</button>
      </div>
    </section>

    <div class="filter-row" aria-label="模块筛选">
      <button type="button" class="filter-chip ${atlasModule === 'all' ? 'is-active' : ''}" data-action="atlas-module" data-module="all">全部 <span>${allFunctions.length}</span></button>
      ${modules.map((module) => `<button type="button" class="filter-chip ${atlasModule === module.id ? 'is-active' : ''}" data-action="atlas-module" data-module="${module.id}">${module.name} <span>${module.functions.length}</span></button>`).join('')}
    </div>

    <div class="atlas-meta">
      <span>显示 <strong id="atlas-count">${items.length}</strong> 个函数</span>
      <span>${icon('check', 13)} 频率分数是教学排序权重，不是官方统计排名</span>
    </div>
    <div id="atlas-results">${renderAtlasRows(items)}</div>

    <section class="authority-note panel">
      <span class="authority-icon">${icon('book', 20)}</span>
      <div><strong>如何使用这张图鉴</strong><p>按分类和频率找到函数，点开看签名与陷阱，再进入对应的编码题。题目必须自己写代码并通过测试，不做选择题。</p></div>
      <a href="#/labs" class="text-link">开始编码刷题 ${icon('arrow', 14)}</a>
    </section>
  `;
}

function openFunctionDetail(functionId) {
  const item = functionById.get(functionId);
  if (!item) return;
  const relatedExercises = relatedExercisesForFunctionId(item.id);
  const passedExercises = passedExercisesForFunctionId(item.id);
  const relatedLab = relatedExercises[0];
  const modal = document.getElementById('modal-root');
  modal.innerHTML = `
    <div class="modal-backdrop" data-action="close-modal">
      <section class="modal-card function-modal" role="dialog" aria-modal="true" aria-labelledby="function-modal-title">
        <button class="modal-close" type="button" data-action="close-modal" aria-label="关闭">${icon('close', 19)}</button>
        <div class="function-modal-head">
          <div class="function-modal-rank">#${String(item.rank).padStart(3, '0')} · ${item.frequency}频</div>
          <div class="function-modal-title">
            <code id="function-modal-title">${escapeHtml(item.name)}</code>
            <span>${escapeHtml(item.header)}</span>
          </div>
          <p>${escapeHtml(item.summary)}</p>
        </div>
        <div class="signature-block">
          <span>PROTOTYPE</span>
          <code>${escapeHtml(item.signature)}</code>
          <button type="button" data-action="copy-text" data-copy="${escapeHtml(item.signature)}" aria-label="复制函数原型">${icon('copy', 15)}</button>
        </div>
        <div class="modal-facts">
          <div><span>什么时候用</span><p>${escapeHtml(item.task)}</p></div>
          <div class="pitfall-fact"><span>最容易错</span><p>${escapeHtml(item.pitfall)}</p></div>
        </div>
        <div class="modal-progress">
          <div><span>相关编码题</span><strong>${passedExercises.length}/${relatedExercises.length} 已通过</strong></div>
          <div class="progress-track"><i style="width:${pct(passedExercises.length, relatedExercises.length)}%"></i></div>
        </div>
        <div class="modal-actions">
          <a class="button button-primary" href="#/labs?function=${encodeURIComponent(item.id)}" data-action="close-modal">练这个函数 ${icon('arrow', 15)}</a>
          ${relatedLab ? `<a class="button button-ghost" href="#/lab/${relatedLab.id}" data-action="close-modal">第一题：${escapeHtml(truncate(relatedLab.title, 18))}</a>` : '<span class="soft-label">该函数尚未单独出题，可用作综合题辅助接口</span>'}
        </div>
        <div class="modal-source">语义依据：ISO C11 / cppreference · 原型与边界以标准库文档为准</div>
      </section>
    </div>
  `;
  document.body.classList.add('modal-open');
  modal.querySelector('.modal-close')?.focus();
}

function renderPracticeCard(exercise, index) {
  const record = state.labs[exercise.id] || {};
  return `<a class="lab-card ${record.passed ? 'is-passed' : ''}" href="#/lab/${exercise.id}">
    <div class="lab-card-top">
      <span class="lab-number">${escapeHtml(exercise.levelName)} · #${String(index + 1).padStart(2, '0')}</span>
      <span class="lab-status">${record.passed ? `${icon('check', 13)} 已通过` : record.attempts ? `${record.bestPassed || 0}/${exercise.tests.length} 已通过` : '动手写'}</span>
    </div>
    <div class="lab-tier">${escapeHtml(exercise.track)} · ${exercise.minutes} min ${exercise.ruleCodes?.length ? `· PTA ${exercise.ruleCodes.join(',')}` : ''}</div>
    <h2>${escapeHtml(exercise.title)}</h2>
    <p>${escapeHtml(exercise.summary)}</p>
    <div class="lab-function-list">${exercise.functions.slice(0, 6).map((name) => `<code>${escapeHtml(name)}</code>`).join('')}</div>
    <div class="lab-card-footer">
      <span>${icon('file', 14)} ${exercise.tests.length} tests</span>
      <span>${icon('code', 14)} ${exercise.origin?.includes('pta-c-checker') ? 'PTA 借鉴题' : '原创题'}</span>
      <strong>${record.passed ? '复习代码' : '开始写代码'} ${icon('arrow', 14)}</strong>
    </div>
  </a>`;
}

function renderLabs(route) {
  const requestedModule = route.query.get('module');
  const requestedLevel = Number(route.query.get('level'));
  const requestedFunction = route.query.get('function');
  const selectedModule = requestedModule && moduleById.has(requestedModule) ? requestedModule : 'all';
  const selectedLevel = [1, 2, 3, 4, 5].includes(requestedLevel) ? requestedLevel : 0;
  const selectedFunction = requestedFunction ? functionById.get(requestedFunction) : null;
  let items = exercises.slice();
  if (selectedModule !== 'all') items = items.filter((exercise) => exercise.moduleId === selectedModule);
  if (selectedLevel) items = items.filter((exercise) => exercise.level === selectedLevel);
  if (selectedFunction) items = items.filter((exercise) => exercise.functions.includes(selectedFunction.name));
  const passed = passedLabCount();
  const totalTests = exercises.reduce((sum, exercise) => sum + exercise.tests.length, 0);
  const levels = [1, 2, 3, 4, 5];
  return `
    <section class="page-intro labs-intro">
      <div>
        <span class="eyebrow">WRITE C · COMPILE · PASS TESTS</span>
        <h1>编码刷题</h1>
        <p>这里没有选择题。每道关卡都要求你打开编辑器、自己写 C 代码，再由 gcc 编译并通过真实 stdin/stdout 测试。题目从 L1 逐步增加到 L5，并按函数类别组织。</p>
        <div class="lab-capabilities">
          <span>${icon('code', 15)} ${exercises.length} 道编码题</span>
          <span>${icon('check', 15)} ${totalTests} 个公共测试</span>
          <span>${icon('spark', 15)} 25 条 PTA 错因检查</span>
        </div>
      </div>
      <div class="lab-score-card">
        <div class="lab-score-ring" style="--ring:${pct(passed, exercises.length)}%"><span>${passed}<small>/${exercises.length}</small></span></div>
        <div><strong>编码题已通过</strong><p>${totalTests} 个测试用例在本地编译运行</p></div>
      </div>
    </section>

    ${selectedFunction ? `<div class="focus-banner">${icon('target', 17)} 正在查看 <code>${escapeHtml(selectedFunction.name)}</code> 相关的 ${items.length} 道题<a href="#/labs">清除函数筛选</a></div>` : ''}

    <div class="filter-row drill-filters">
      <a class="filter-chip ${selectedModule === 'all' ? 'is-active' : ''}" href="#/labs${selectedFunction ? `?function=${selectedFunction.id}` : ''}">全部函数域 <span>${exercises.length}</span></a>
      ${modules.map((module) => {
        const count = exercises.filter((exercise) => exercise.moduleId === module.id).length;
        const query = new URLSearchParams();
        query.set('module', module.id);
        if (selectedFunction) query.set('function', selectedFunction.id);
        return `<a class="filter-chip ${selectedModule === module.id ? 'is-active' : ''}" href="#/labs?${query.toString()}">${module.shortName} <span>${count}</span></a>`;
      }).join('')}
    </div>
    <div class="filter-row level-filters">
      <a class="filter-chip ${selectedLevel === 0 ? 'is-active' : ''}" href="#/labs">全部难度</a>
      ${levels.map((level) => `<a class="filter-chip ${selectedLevel === level ? 'is-active' : ''}" href="#/labs?level=${level}">${levelNames[level]} <span>${exercises.filter((exercise) => exercise.level === level).length}</span></a>`).join('')}
    </div>

    ${items.length ? levels.filter((level) => items.some((exercise) => exercise.level === level)).map((level) => {
      const levelItems = items.filter((exercise) => exercise.level === level);
      return `<section class="practice-level-section">
        <div class="level-heading">
          <div><span class="level-dot level-${level}"></span><h2>${levelNames[level]}</h2><p>${level === 1 ? '先熟悉输入输出与单个函数。' : level === 2 ? '开始组合函数并修复常见错误。' : level === 3 ? '处理 EOF、边界、格式和多个函数协作。' : level === 4 ? '进入动态内存、排序和真实数据处理。' : '完成多阶段程序，接受综合检验。'}</p></div>
          <span class="soft-label">${levelItems.filter((exercise) => state.labs[exercise.id]?.passed).length}/${levelItems.length} 已通过</span>
        </div>
        <section class="lab-grid">${levelItems.map((exercise) => renderPracticeCard(exercise, exercises.indexOf(exercise))).join('')}</section>
      </section>`;
    }).join('') : `<div class="empty-state panel">${icon('search', 24)}<h2>当前筛选没有题目</h2><p>换一个函数分类或难度级别试试。</p><a class="button button-ghost" href="#/labs">查看全部编码题</a></div>`}

    <section class="lab-note panel">
      <span class="authority-icon">${icon('terminal', 20)}</span>
      <div><strong>判分与署名</strong><p>公共测试通过 gcc 编译执行并逐字符比较输出；本地代码体检模块改编自 zyl0723 的 pta-c-checker，来源与规则署名见项目根目录 ATTRIBUTIONS.md。</p></div>
    </section>
  `;
}
function renderLabTestCases(exercise) {
  return exercise.tests.map((test, index) => `<details class="test-case" ${index === 0 ? 'open' : ''}>
    <summary><span>${icon('terminal', 14)} ${escapeHtml(test.name)}</span><small>public test</small></summary>
    <div class="test-io"><div><span>stdin</span><pre>${escapeHtml(JSON.stringify(test.input))}</pre></div><div><span>expected stdout</span><pre>${escapeHtml(JSON.stringify(test.expected))}</pre></div></div>
  </details>`).join('');
}


function renderFunctionGuides(exercise) {
  return exercise.functions.map((name, index) => {
    const meta = allFunctions.find((item) => item.name === name);
    const guide = functionGuides[name] || {
      use: `在本题中使用 ${name} 完成对应步骤；先确认参数、返回值和边界条件，再运行测试。`,
      example: `/* 在本题的参考实现中查找 ${name} 的用法 */`,
      result: '结合题目输入观察输出。'
    };
    const signature = meta?.signature || (name === 'errno' ? 'extern int errno;' : `${name}(...)`);
    const header = meta?.header || (name === 'errno' ? '<errno.h>' : '');
    const purpose = meta?.summary || guide.use;
    const pitfall = meta?.pitfall || '注意参数类型、返回值与失败状态，不要只凭编译通过判断正确。';
    const task = meta?.task || exercise.summary;
    return `<details class="function-guide" ${index === 0 ? 'open' : ''}>
      <summary>
        <span class="guide-index">${String(index + 1).padStart(2, '0')}</span>
        <div><code>${escapeHtml(name)}</code><small>${escapeHtml(purpose)}</small></div>
        <span class="guide-toggle">用法 + 例子</span>
      </summary>
      <div class="guide-body">
        <div class="guide-meta"><span>${escapeHtml(header)}</span>${meta ? `<button type="button" class="guide-link" data-action="open-function" data-function="${meta.id}">函数图鉴 #${meta.rank}</button>` : '<span>宏 / 辅助对象</span>'}</div>
        <div class="guide-block"><span>它干什么用</span><p>${escapeHtml(purpose)}</p></div>
        <div class="guide-block"><span>在本题里怎么用</span><p>${escapeHtml(guide.use)}</p><p class="guide-task">本题步骤：${escapeHtml(task)}</p></div>
        <div class="guide-example"><div><span>小例子</span><code>${escapeHtml(signature)}</code></div><pre><code>${escapeHtml(guide.example)}</code></pre><p><strong>结果：</strong>${escapeHtml(guide.result)}</p></div>
        <div class="guide-pitfall"><span>常见坑</span><p>${escapeHtml(pitfall)}</p></div>
      </div>
    </details>`;
  }).join('');
}

function renderLab(id) {
  const exercise = exerciseById.get(id);
  if (!exercise) {
    return `<div class="empty-state panel">${icon('search', 26)}<h2>题目不存在</h2><p>这个链接可能已经失效。</p><a class="button button-primary" href="#/labs">返回实验室</a></div>`;
  }
  const record = state.labs[id] || {};
  const code = record.code || exercise.starter;
  const module = moduleById.get(exercise.moduleId);
  const review = record.review;
  return `
    <div class="lab-breadcrumb"><a href="#/labs">编码刷题</a>${icon('chevron', 13)}<span>${escapeHtml(exercise.tier)}</span>${icon('chevron', 13)}<span>${escapeHtml(module?.name || exercise.track)}</span></div>
    <section class="lab-workbench">
      <aside class="problem-pane">
        <div class="problem-top">
          <span class="eyebrow">${escapeHtml(exercise.levelName)} · ${escapeHtml(exercise.track)}</span>
          <div class="problem-title-row">
            <h1>${escapeHtml(exercise.title)}</h1>
            <span class="status-badge ${record.passed ? 'passed' : ''}">${record.passed ? `${icon('check', 13)} 已通过` : '未通过'}</span>
          </div>
          <p>${escapeHtml(exercise.prompt)}</p>
          <div class="problem-meta">
            <span>${icon('timer', 14)} ${exercise.minutes} min</span>
            <span>${icon('file', 14)} ${exercise.tests.length} tests</span>
            <span>${icon('layers', 14)} ${escapeHtml(exercise.levelName)}</span>
          </div>
          <div class="problem-origin"><span>题目来源</span><p>${escapeHtml(exercise.origin || '原创题')}${exercise.ruleCodes?.length ? ` · 参考规则 ${exercise.ruleCodes.map(escapeHtml).join(' / ')}` : ''}</p></div>
        </div>
        <div class="problem-section">
          <h3>验收要求</h3>
          <ol class="requirements-list">${exercise.requirements.map((requirement) => `<li>${escapeHtml(requirement)}</li>`).join('')}</ol>
        </div>
        <div class="problem-section">
          <h3>涉及接口</h3>
          <div class="problem-functions">${exercise.functions.map((name) => {
            const item = allFunctions.find((entry) => entry.name === name);
            return item ? `<button type="button" class="function-chip" data-action="open-function" data-function="${item.id}"><code>${name}</code><small>#${item.rank}</small></button>` : `<span class="function-chip"><code>${name}</code></span>`;
          }).join('')}</div>
        </div>
        <div class="problem-section function-guide-section">
          <div class="guide-section-head">
            <div><h3>本题函数精讲</h3><p>逐个看用途、怎么用、完整小例子和常见坑。</p></div>
            <span class="soft-label">${exercise.functions.length} 个接口</span>
          </div>
          <div class="function-guide-list">${renderFunctionGuides(exercise)}</div>
        </div>
        <div class="problem-section">
          <h3>公共测试</h3>
          <div class="test-case-list">${renderLabTestCases(exercise)}</div>
        </div>
        <details class="problem-details hint-panel">
          <summary>${icon('bulb', 16)} 查看提示</summary>
          <ul>${exercise.hints.map((hint) => `<li>${escapeHtml(hint)}</li>`).join('')}</ul>
        </details>
        <details class="problem-details solution-panel">
          <summary>${icon('code', 16)} 参考实现（先自己试）</summary>
          <pre><code>${escapeHtml(exercise.solution)}</code></pre>
        </details>
      </aside>

      <section class="editor-pane">
        <div class="editor-toolbar">
          <div class="editor-file"><span class="file-dot"></span><code>main.c</code><span>stdin → stdout</span></div>
          <div class="editor-actions">
            <button class="icon-text-button" type="button" data-action="save-lab" title="保存草稿">${icon('save', 15)} <span>保存</span></button>
            <button class="icon-text-button" type="button" data-action="reset-lab" title="恢复初始代码">${icon('refresh', 15)} <span>重置</span></button>
          </div>
        </div>
        <div class="editor-shell">
          <div class="editor-gutter" id="editor-gutter">${code.split('\n').map((_, index) => index + 1).join('\n')}</div>
          <textarea id="code-editor" class="code-editor" spellcheck="false" aria-label="C 代码编辑器">${escapeHtml(code)}</textarea>
        </div>
        <div class="editor-statusbar">
          <span id="editor-position">C11 · UTF-8</span>
          <span id="editor-chars">${code.length} chars</span>
          <span class="autosave-state">${icon('check', 12)} 自动保存</span>
        </div>
        <div class="editor-actionbar">
          <div>
            <button class="button button-primary" type="button" data-action="run-lab">${icon('play', 16)} 编译并运行测试 <kbd>Ctrl ↵</kbd></button>
            <button class="button button-soft ${health.ai.configured ? '' : 'is-muted'}" type="button" data-action="review-lab">${icon('ai', 16)} ${health.ai.configured ? 'AI 审查' : 'AI 未配置'}</button>
          </div>
          <span class="compiler-indicator ${health.compiler.available ? '' : 'is-warn'}">${icon('terminal', 14)} ${compilerLabel()}</span>
        </div>
        <div id="lab-output" class="lab-output">
          <div class="output-empty">${icon('terminal', 22)}<strong>运行测试后，这里会显示编译输出、PTA 错因检查与逐例结果。</strong><span>测试在本地临时目录中编译执行，代码不会上传。</span></div>
        </div>
        <div id="ai-output" class="ai-output" ${review ? '' : 'hidden'}>${review ? renderAiReview(review, record) : ''}</div>
        <div class="local-review-note">${icon('bulb', 14)} PTA 规则检查常见错误；gcc 与公共测试验证真实行为；AI 审查可继续检查未覆盖的语义风险。</div>
      </section>
    </section>
  `;
}

function renderAiReview(review, record = {}) {
  if (!review) return '';
  const score = review.score == null ? null : Number(review.score);
  const issues = Array.isArray(review.issues) ? review.issues : [];
  return `<div class="ai-review-card">
    <div class="ai-review-head">
      <div class="ai-review-title">${icon('ai', 19)}<div><span>AI CODE REVIEW</span><strong>${escapeHtml(review.verdict || '代码审查')}</strong></div></div>
      ${score == null ? '' : `<div class="ai-score">${Math.max(0, Math.min(100, score))}<small>/100</small></div>`}
    </div>
    <p class="ai-summary">${escapeHtml(review.summary || '')}</p>
    ${Array.isArray(review.strengths) && review.strengths.length ? `<div class="ai-strengths">${review.strengths.map((item) => `<span>${icon('check', 13)} ${escapeHtml(item)}</span>`).join('')}</div>` : ''}
    ${issues.length ? `<div class="ai-issues">${issues.map((issue) => `<article class="ai-issue severity-${escapeHtml(issue.severity || 'low')}">
      <div><span>${escapeHtml(issue.severity || 'low')}</span><strong>${escapeHtml(issue.title || '发现一个问题')}</strong>${issue.line ? `<small>line ${escapeHtml(issue.line)}</small>` : ''}</div>
      <p>${escapeHtml(issue.detail || '')}</p>
    </article>`).join('')}</div>` : ''}
    ${Array.isArray(review.nextSteps) && review.nextSteps.length ? `<div class="ai-next"><span>下一步</span><ul>${review.nextSteps.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>` : ''}
    ${review.safety ? `<div class="ai-safety">${icon('lock', 14)} ${escapeHtml(review.safety)}</div>` : ''}
    ${record.reviewedAt ? `<small class="ai-timestamp">审查于 ${escapeHtml(new Date(record.reviewedAt).toLocaleString('zh-CN'))}</small>` : ''}
  </div>`;
}

function localChecks(code, problemText = '') {
  if (!window.PTAAnalyzer) {
    return '<div class="local-review"><div class="local-review-head">' + icon('spark', 16) + '<strong>PTA 代码体检未加载</strong><span>请刷新页面</span></div></div>';
  }
  let result;
  try {
    result = window.PTAAnalyzer.analyze(code, { problemText });
  } catch (error) {
    return `<div class="local-review"><div class="local-review-head">${icon('close', 16)}<strong>代码体检执行失败</strong><span>${escapeHtml(error.message)}</span></div></div>`;
  }
  const findings = result.findings || [];
  const severityOf = (confidence) => confidence === 'certain' || confidence === 'high' ? 'high' : confidence === 'medium' ? 'medium' : 'low';
  return `<div class="local-review"><div class="local-review-head">${icon('spark', 16)}<strong>PTA 代码体检</strong><span>${findings.length ? `${findings.length} 条提示` : '未发现已知错因'} · v${escapeHtml(window.PTAAnalyzer.version)}</span></div>
    ${findings.length ? findings.map((finding) => `<div class="local-check check-${severityOf(finding.confidence)}">
      <span>${escapeHtml(finding.rule)}</span><div><strong>L${finding.line}:C${finding.col} ${escapeHtml(finding.title)}</strong><p>${escapeHtml(finding.message)}${finding.tip ? ` ${escapeHtml(finding.tip)}` : ''}</p></div>
    </div>`).join('') : `<div class="local-check check-ok"><span>${icon('check', 13)}</span><div><strong>没有命中已收录的 PTA 常见错因</strong><p>这不代表算法正确；仍需以编译和公共测试结果为准。</p></div></div>`}
    <div class="pta-credit">体检规则改编自 zyl0723 / pta-c-checker · 仅作学习辅助</div>
  </div>`;
}
function renderRunResult(result, exercise = null) {
  if (result.status === 'compile_error') {
    return `<div class="run-result run-failed">
      <div class="run-result-head"><div><span class="run-light error"></span><strong>编译失败</strong></div><span>0 tests run</span></div>
      <p class="run-message">${escapeHtml(result.message || '修正编译错误后重试。')}</p>
      <pre class="compile-output">${escapeHtml(result.compileOutput || '编译器没有返回详细输出。')}</pre>
    </div>`;
  }
  if (result.status !== 'ok') {
    return `<div class="run-result run-failed"><div class="run-result-head"><div><span class="run-light error"></span><strong>运行失败</strong></div></div><p class="run-message">${escapeHtml(result.message || '发生未知错误。')}</p></div>`;
  }
  return `<div class="run-result ${result.allPassed ? 'run-passed' : 'run-failed'}">
    <div class="run-result-head">
      <div><span class="run-light ${result.allPassed ? 'success' : 'error'}"></span><strong>${result.allPassed ? '全部测试通过' : '测试未全部通过'}</strong></div>
      <span>${result.passed}/${result.total} tests · ${escapeHtml(result.compiler || 'gcc')}</span>
    </div>
    <div class="test-results">
      ${result.tests.map((test) => {
        let diff = null;
        if (!test.passed && window.PTADiff) {
          try { diff = window.PTADiff.compare(test.actual || '', test.expected || ''); } catch {}
        }
        return `<details class="test-result ${test.passed ? 'passed' : 'failed'}" ${test.passed ? '' : 'open'}>
        <summary><span>${test.passed ? icon('check', 14) : icon('close', 14)} ${escapeHtml(test.name)}</span><small>${test.durationMs} ms</small></summary>
        <div class="result-io">
          <div><span>expected</span><pre>${escapeHtml(test.expected)}</pre></div>
          <div><span>actual</span><pre>${escapeHtml(test.actual || '(empty output)')}</pre></div>
          ${test.stderr ? `<div class="stderr-block"><span>stderr</span><pre>${escapeHtml(test.stderr)}</pre></div>` : ''}
          ${diff ? `<div class="pta-diff"><span>PTA 逐字符比对</span><p>${escapeHtml(diff.summary)}</p></div>` : ''}
        </div>
      </details>`;
      }).join('')}
    </div>
    ${result.compileOutput ? `<details class="compile-warnings"><summary>编译器输出 (${result.compileOutput.split(/\r?\n/).length} lines)</summary><pre>${escapeHtml(result.compileOutput)}</pre></details>` : ''}
  </div>`;
}

function setButtonBusy(button, label) {
  if (!button) return () => {};
  const original = button.innerHTML;
  button.disabled = true;
  button.dataset.busy = 'true';
  button.innerHTML = `<span class="spinner"></span> ${escapeHtml(label)}`;
  return () => {
    button.disabled = false;
    button.dataset.busy = '';
    button.innerHTML = original;
  };
}

async function fetchJson(url, options) {
  let response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new Error('无法连接本地服务。请确认已运行 npm start。');
  }
  let payload = {};
  try { payload = await response.json(); } catch {}
  if (!response.ok) {
    const error = new Error(payload.message || `请求失败 (HTTP ${response.status})`);
    error.payload = payload;
    error.status = response.status;
    throw error;
  }
  return payload;
}

function editorCode() {
  return document.getElementById('code-editor')?.value || '';
}

function saveCurrentLabCode(showToast = false) {
  const route = parseRoute();
  if (route.name !== 'lab') return;
  const exercise = exerciseById.get(route.id);
  if (!exercise) return;
  const code = editorCode();
  const previous = state.labs[exercise.id] || {};
  state.labs[exercise.id] = { ...previous, code, codeUpdatedAt: new Date().toISOString() };
  saveState();
  if (showToast) toast('草稿已保存');
}

async function runCurrentLab() {
  const route = parseRoute();
  const exercise = exerciseById.get(route.id);
  if (!exercise) return;
  const code = editorCode();
  const button = document.querySelector('[data-action="run-lab"]');
  const output = document.getElementById('lab-output');
  if (!code.trim()) {
    toast('请先写一些 C 代码', 'error');
    return;
  }
  const restore = setButtonBusy(button, '正在编译…');
  output.innerHTML = `<div class="running-state"><span class="spinner dark"></span><strong>gcc 正在编译并执行 ${exercise.tests.length} 个测试…</strong><span>通常需要 1–3 秒</span></div>`;
  try {
    const result = await fetchJson('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, tests: exercise.tests })
    });
    lastLabResults.set(exercise.id, result);
    output.innerHTML = renderRunResult(result, exercise) + localChecks(code, exercise.prompt);
    const previous = state.labs[exercise.id] || {};
    const firstPass = Boolean(result.allPassed) && !previous.passed;
    const record = {
      ...previous,
      code,
      codeUpdatedAt: new Date().toISOString(),
      attempts: (previous.attempts || 0) + 1,
      passed: previous.passed || Boolean(result.allPassed),
      bestPassed: Math.max(previous.bestPassed || 0, result.passed || 0),
      lastStatus: result.status,
      lastRunAt: new Date().toISOString()
    };
    if (result.allPassed) {
      delete state.mistakes[`lab:${exercise.id}`];
      touchActivity(firstPass ? 80 : 8);
    } else {
      state.mistakes[`lab:${exercise.id}`] = {
        type: 'lab',
        title: exercise.title,
        exerciseId: exercise.id,
        detail: result.status === 'compile_error' ? '编译失败' : `${result.passed || 0}/${result.total || exercise.tests.length} 个测试通过`,
        at: new Date().toISOString()
      };
      touchActivity(3);
    }
    state.labs[exercise.id] = record;
    saveState();
    const status = document.querySelector('.status-badge');
    if (status && record.passed) {
      status.className = 'status-badge passed';
      status.innerHTML = `${icon('check', 13)} 已通过`;
    }
    if (result.allPassed) toast(firstPass ? '编码题通过，获得 80 XP' : '全部测试通过');
    else toast('测试还没有全部通过，查看失败用例', 'error');
  } catch (error) {
    output.innerHTML = `<div class="run-result run-failed"><div class="run-result-head"><div><span class="run-light error"></span><strong>无法运行测试</strong></div></div><p class="run-message">${escapeHtml(error.message)}</p></div>${localChecks(code, exercise.prompt)}`;
    toast(error.message, 'error');
  } finally {
    restore();
  }
}

async function reviewCurrentLab() {
  const route = parseRoute();
  const exercise = exerciseById.get(route.id);
  if (!exercise) return;
  const code = editorCode();
  const aiOutput = document.getElementById('ai-output');
  const button = document.querySelector('[data-action="review-lab"]');
  if (!health.ai.configured) {
    aiOutput.hidden = false;
    aiOutput.innerHTML = `<div class="ai-review-card ai-not-configured">
      <div class="ai-review-head"><div class="ai-review-title">${icon('ai', 19)}<div><span>AI CODE REVIEW</span><strong>尚未配置 API</strong></div></div></div>
      <p class="ai-summary">在网站根目录创建 <code>.env.local</code>，填写 <code>AI_BASE_URL</code>、<code>AI_API_KEY</code> 和 <code>AI_MODEL</code>，重启服务后即可审查。密钥只在 Node 服务端读取。</p>
      <a class="text-link" href="#/about">查看配置步骤 ${icon('arrow', 13)}</a>
      ${localChecks(code, exercise.prompt)}
    </div>`;
    aiOutput.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  const restore = setButtonBusy(button, '正在审查…');
  aiOutput.hidden = false;
  aiOutput.innerHTML = `<div class="running-state ai-running"><span class="spinner dark"></span><strong>AI 正在检查标准语义、边界条件和代码质量…</strong><span>通常需要 5–20 秒</span></div>`;
  try {
    const previousResult = lastLabResults.get(exercise.id);
    const testSummary = previousResult ? {
      status: previousResult.status,
      passed: previousResult.passed,
      total: previousResult.total,
      allPassed: previousResult.allPassed,
      compileOutput: previousResult.compileOutput || ''
    } : null;
    const payload = await fetchJson('/api/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: exercise.title,
        prompt: exercise.prompt,
        requirements: exercise.requirements,
        code,
        testSummary
      })
    });
    const previous = state.labs[exercise.id] || {};
    state.labs[exercise.id] = {
      ...previous,
      code,
      review: payload.review,
      reviewedAt: new Date().toISOString()
    };
    saveState();
    aiOutput.innerHTML = renderAiReview(payload.review, state.labs[exercise.id]);
  } catch (error) {
    aiOutput.innerHTML = `<div class="ai-review-card ai-error">
      <div class="ai-review-head"><div class="ai-review-title">${icon('ai', 19)}<div><span>AI CODE REVIEW</span><strong>审查未完成</strong></div></div></div>
      <p class="ai-summary">${escapeHtml(error.message)}</p>
      <p class="ai-help">可以检查 .env.local 配置与服务端日志，或先使用下面的本地启发式检查。</p>
      ${localChecks(code, exercise.prompt)}
    </div>`;
    toast('AI 审查失败', 'error');
  } finally {
    restore();
  }
}

function renderReport() {
  const passed = passedLabCount();
  const practicePercent = pct(passed, exercises.length);
  const practiced = practicedFunctions().size;
  const testsPassed = Object.values(state.labs).reduce((sum, record) => sum + (record.bestPassed || 0), 0);
  const totalTests = exercises.reduce((sum, item) => sum + item.tests.length, 0);
  const labMistakes = Object.values(state.mistakes)
    .filter((mistake) => mistake.type === 'lab')
    .sort((a, b) => String(b.at).localeCompare(String(a.at)));
  const nextLab = nextPracticeExercise();
  const nextFunction = allFunctions.find((item) => item.name === nextLab.functions[0]) || allFunctions[0];
  const days = Array.from({ length: 7 }, (_, index) => dayOffset(todayKey(), index - 6));
  const maxActivity = Math.max(1, ...days.map((day) => state.activity[day] || 0));
  const levelStats = [1, 2, 3, 4, 5].map((level) => {
    const items = exercises.filter((exercise) => exercise.level === level);
    const done = items.filter((exercise) => state.labs[exercise.id]?.passed).length;
    return { level, total: items.length, done, percent: pct(done, items.length) };
  });

  return `
    <section class="page-intro report-intro">
      <div>
        <span class="eyebrow">EVIDENCE OF PRACTICE</span>
        <h1>学习报告</h1>
        <p>这里只记录可验证的行为：你真正运行并通过了哪些编码题、通过了多少测试、哪些题仍需重做。没有“看完即掌握”的自动判定。</p>
      </div>
      <div class="report-avatar">${icon('chart', 26)}<strong>${state.xp}</strong><span>累计 XP</span></div>
    </section>

    <section class="report-stats">
      <article class="report-stat primary"><div class="report-ring" style="--ring:${practicePercent}%"><span>${practicePercent}<small>%</small></span></div><div><strong>编码题完成度</strong><p>${passed} / ${exercises.length} 道通过</p></div></article>
      <article class="report-stat"><span class="stat-icon clay">${icon('check', 18)}</span><div><strong>${testsPassed}<small> / ${totalTests}</small></strong><p>公共测试通过</p></div></article>
      <article class="report-stat"><span class="stat-icon mauve">${icon('book', 18)}</span><div><strong>${practiced}<small> / ${allFunctions.length}</small></strong><p>函数已在代码中练过</p></div></article>
      <article class="report-stat"><span class="stat-icon sand">${icon('flame', 18)}</span><div><strong>${state.streak.days || 0}</strong><p>连续学习天数</p></div></article>
    </section>

    <div class="content-grid report-grid">
      <section class="panel mastery-panel">
        <div class="section-heading compact"><div><span class="eyebrow">LEVEL PROGRESSION</span><h2>难度进度</h2></div><span class="soft-label">${passed}/${exercises.length}</span></div>
        <div class="module-mastery-list">
          ${levelStats.map((item) => `<div class="module-mastery-row">
            <div class="mastery-module-name"><span class="module-mark tiny level-${item.level}">L${item.level}</span><div><strong>${levelNames[item.level]}</strong><small>${item.done}/${item.total} 道通过</small></div></div>
            <div class="mastery-bar-wrap"><div class="progress-track"><i style="width:${item.percent}%"></i></div><span>${item.percent}%</span></div>
          </div>`).join('')}
        </div>
      </section>

      <aside class="panel activity-panel">
        <div class="section-heading compact"><div><span class="eyebrow">LAST 7 DAYS</span><h2>编码活动</h2></div><span class="soft-label">${state.streak.days || 0} 天连续</span></div>
        <div class="activity-bars" aria-label="最近七天活动">
          ${days.map((day) => {
            const count = state.activity[day] || 0;
            return `<div class="activity-day"><span class="activity-bar-wrap"><i style="height:${Math.max(5, Math.round((count / maxActivity) * 100))}%" class="${count ? 'has-activity' : ''}"></i></span><strong>${count || ''}</strong><small>${formatShortDate(day)}</small></div>`;
          }).join('')}
        </div>
        <div class="report-goal"><span>${icon('target', 15)} 今日 ${dailyQuizCount()}/${state.dailyGoal} 道编码题</span><div class="progress-track"><i style="width:${pct(dailyQuizCount(), state.dailyGoal)}%"></i></div></div>
      </aside>
    </div>

    <div class="content-grid report-lower">
      <section class="panel mistakes-panel">
        <div class="section-heading compact"><div><span class="eyebrow">RETRY QUEUE</span><h2>待重做题目</h2></div><span class="soft-label">${labMistakes.length} 项</span></div>
        ${labMistakes.length ? `<div class="mistake-list">${labMistakes.slice(0, 8).map((mistake) => `<div class="mistake-row">
          <span class="mistake-type">编码题</span>
          <div><strong>${escapeHtml(mistake.title)}</strong><p>${escapeHtml(truncate(mistake.detail, 86))}</p></div>
          <a class="text-link" href="#/lab/${encodeURIComponent(mistake.exerciseId || '')}">重做 ${icon('arrow', 13)}</a>
        </div>`).join('')}</div>` : `<div class="empty-state small">${icon('check', 22)}<h3>暂无待重做题目</h3><p>未全部通过测试的编码题会自动出现在这里。</p></div>`}
      </section>

      <aside class="panel next-action-panel">
        <span class="eyebrow">NEXT BEST ACTION</span>
        <h2>下一题，别跳太难。</h2>
        <div class="next-action-card"><span class="next-index">01</span><div><strong>${escapeHtml(nextLab.levelName)} · ${escapeHtml(nextLab.title)}</strong><p>${escapeHtml(nextLab.summary)}</p><a href="#/lab/${nextLab.id}">打开编辑器 ${icon('arrow', 13)}</a></div></div>
        <div class="next-action-card"><span class="next-index">02</span><div><strong>补全 <code>${escapeHtml(nextFunction.name)}</code> 相关练习</strong><p>只做与这个函数相关的编码题。</p><a href="#/labs?function=${nextFunction.id}">筛选相关题 ${icon('arrow', 13)}</a></div></div>
        <div class="next-action-card"><span class="next-index">03</span><div><strong>回看图鉴边界</strong><p>测试全过后，再检查容易忘的 API 陷阱。</p><a href="#/atlas">打开函数图鉴 ${icon('arrow', 13)}</a></div></div>
      </aside>
    </div>
  `;
}
function renderAbout() {
  return `
    <section class="page-intro about-intro">
      <div>
        <span class="eyebrow">AUTHORITY, NOT MARKETING</span>
        <h1>依据、边界与 API 配置</h1>
        <p>这个网站不做“官方认证”的虚假承诺。题目语义以 ISO C 标准和 cppreference 为依据，以公开开源题库和真实编译测试做工程校验，并明确标出教学排序的局限。</p>
      </div>
      <div class="authority-seal">${icon('book', 30)}<strong>ISO C11</strong><span>semantic baseline</span></div>
    </section>

    <section class="about-grid">
      <article class="panel about-card">
        <span class="eyebrow">METHOD</span><h2>我们如何选题</h2>
        <ol class="method-list">
          <li><span>01</span><div><strong>语义先行</strong><p>函数签名、返回值、约束与未定义行为以标准库文档为准。</p></div></li>
          <li><span>02</span><div><strong>频率排序</strong><p>把工程常见程度转换成 0–100 的教学权重，用于决定先后，不代表官方使用统计。</p></div></li>
          <li><span>03</span><div><strong>动手编码</strong><p>不是选择题。每道题都提供 starter code、测试契约和参考实现，必须自己写代码跑通。</p></div></li>
          <li><span>04</span><div><strong>真实执行</strong><p>${exercises.length} 道题由 gcc 编译，比较 stdin/stdout；参考解已通过全部 ${exercises.reduce((sum, item) => sum + item.tests.length, 0)} 个公共测试。</p></div></li>
        </ol>
      </article>
      <article class="panel about-card">
        <span class="eyebrow">SCOPE</span><h2>覆盖了什么，没有覆盖什么</h2>
        <div class="scope-list">
          <div><span class="scope-yes">${icon('check', 14)}</span><p><strong>覆盖</strong> 113 个常用接口分类，以及 ${exercises.length} 道逐步加难的动手编码题。</p></div>
          <div><span class="scope-no">${icon('close', 14)}</span><p><strong>不声称覆盖全部 C 标准</strong>。宽字符、locale、signal、setjmp、threads、原子操作等未纳入本版主线。</p></div>
          <div><span class="scope-no">${icon('close', 14)}</span><p><strong>不替代安全审查</strong>。本地编译器运行、启发式规则与 AI 审查都有边界。</p></div>
          <div><span class="scope-yes">${icon('check', 14)}</span><p><strong>持续可扩展</strong>。题库数据与 UI 分离，可以继续添加函数、测试和模块。</p></div>
        </div>
      </article>
    </section>

    <section class="panel source-panel">
      <div class="section-heading"><div><span class="eyebrow">PRIMARY REFERENCES</span><h2>权威依据与开源参考</h2><p>原创题用于训练函数语义；PTA 错因题与代码体检模块来自你本机的 pta-c-checker，并已明确署名。</p></div></div>
      <div class="source-grid">
        <a href="https://github.com/zyl0723/pta" target="_blank" rel="noreferrer"><span>${icon('code', 18)}</span><div><strong>zyl0723 / pta-c-checker</strong><p>PTA 常见错因规则与逐字符输出比对，已随项目移植并署名。</p></div>${icon('external', 15)}</a>
        ${sources.map((source) => `<a href="${source.url}" target="_blank" rel="noreferrer"><span>${icon(source.url.includes('github') ? 'git' : 'external', 18)}</span><div><strong>${escapeHtml(source.label)}</strong><p>${escapeHtml(source.note)}</p></div>${icon('external', 15)}</a>`).join('')}
      </div>
    </section>

    <section class="panel api-panel">
      <div class="api-copy">
        <span class="eyebrow">OPTIONAL AI REVIEW</span>
        <h2>配置 AI 批改</h2>
        <p>网站不会把 API Key 放到浏览器。服务端读取环境变量，把代码、题目要求和最近一次编译结果发送给 OpenAI-compatible <code>/chat/completions</code> 接口。</p>
        <div class="api-status-line"><span class="status-dot ${health.ai.configured ? 'is-online' : ''}"></span><strong>${health.ai.configured ? `已连接 · ${escapeHtml(health.ai.model)}` : '当前未配置'}</strong><span>${health.ai.configured ? 'AI 审查可用' : '本地编译判分仍可使用'}</span></div>
      </div>
      <div class="code-config">
        <div class="code-config-head"><span>终端 · 项目根目录</span><button type="button" data-action="copy-text" data-copy="Copy-Item .env.example .env.local">${icon('copy', 14)} 复制命令</button></div>
        <pre><code>Copy-Item .env.example .env.local
# 编辑 .env.local
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=sk-...
AI_MODEL=gpt-4.1-mini
# 然后重启
npm start</code></pre>
      </div>
    </section>

    <section class="about-footnote">
      <span>${icon('lock', 16)}</span>
      <p><strong>本地安全边界：</strong>代码运行服务默认只监听 <code>127.0.0.1</code>。它会在本机编译并执行你输入的代码，请只运行自己信任的练习代码；不要把该服务直接暴露到公网。</p>
    </section>
  `;
}

function bindLabEditor(exercise) {
  const editor = document.getElementById('code-editor');
  const gutter = document.getElementById('editor-gutter');
  const chars = document.getElementById('editor-chars');
  if (!editor || !gutter) return;

  const update = () => {
    const lines = editor.value.split('\n').length;
    gutter.textContent = Array.from({ length: lines }, (_, index) => index + 1).join('\n');
    if (chars) chars.textContent = `${editor.value.length} chars`;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const previous = state.labs[exercise.id] || {};
      state.labs[exercise.id] = { ...previous, code: editor.value, codeUpdatedAt: new Date().toISOString() };
      saveState();
    }, 450);
  };

  editor.addEventListener('input', update);
  editor.addEventListener('scroll', () => { gutter.scrollTop = editor.scrollTop; });
  editor.addEventListener('blur', () => {
    const previous = state.labs[exercise.id] || {};
    state.labs[exercise.id] = { ...previous, code: editor.value, codeUpdatedAt: new Date().toISOString() };
    saveState();
  });
  editor.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      editor.setRangeText('    ', start, end, 'end');
      update();
    }
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      runCurrentLab();
    }
  });
  update();
}

function closeModal() {
  document.getElementById('modal-root').innerHTML = '';
  document.body.classList.remove('modal-open');
}

function render() {
  const route = parseRoute();
  if (route.name === 'drill') {
    const query = route.query.toString();
    window.location.replace(`#/labs${query ? `?${query}` : ''}`);
    return;
  }
  renderSidebar(route);
  renderTopbar(route);
  const main = document.getElementById('main-content');
  let html = '';
  if (route.name === 'home') html = renderHome();
  else if (route.name === 'path') html = renderPath();
  else if (route.name === 'atlas') html = renderAtlas(route);
  else if (route.name === 'labs') html = renderLabs(route);
  else if (route.name === 'lab') html = renderLab(route.id);
  else if (route.name === 'report') html = renderReport();
  else if (route.name === 'about') html = renderAbout();
  else html = `<div class="empty-state panel">${icon('search', 26)}<h2>页面不存在</h2><p>返回训练首页继续学习。</p><a class="button button-primary" href="#/">返回首页</a></div>`;
  main.innerHTML = html;
  document.title = `${routeMeta[route.name]?.title || '函数训练'} · f(x) 函数训练场`;
  if (route.name === 'lab') {
    const exercise = exerciseById.get(route.id);
    if (exercise) bindLabEditor(exercise);
  }
  if (route.name === 'atlas') {
    const input = document.getElementById('atlas-search');
    if (input && atlasQuery) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }
}

function handleCopy(text) {
  if (!text) return;
  const done = () => toast('已复制到剪贴板');
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => toast('复制失败，请手动选择文本', 'error'));
  } else {
    const area = document.createElement('textarea');
    area.value = text;
    document.body.appendChild(area);
    area.select();
    try { document.execCommand('copy'); done(); } catch { toast('复制失败', 'error'); }
    area.remove();
  }
}

document.addEventListener('click', (event) => {
  const actionElement = event.target.closest('[data-action]');
  if (!actionElement) return;
  const action = actionElement.dataset.action;

  if (action === 'focus-search') {
    event.preventDefault();
    if (parseRoute().name !== 'atlas') window.location.hash = '#/atlas';
    else document.getElementById('atlas-search')?.focus();
    return;
  }

  if (action === 'close-modal') {
    if (actionElement.classList.contains('modal-backdrop') && event.target !== actionElement) return;
    closeModal();
    return;
  }

  if (action === 'open-function') {
    event.preventDefault();
    openFunctionDetail(actionElement.dataset.function);
    return;
  }

  if (action === 'atlas-sort') {
    atlasSort = actionElement.dataset.sort || 'frequency';
    render();
    return;
  }

  if (action === 'atlas-module') {
    const moduleId = actionElement.dataset.module;
    window.location.hash = moduleId === 'all' ? '#/atlas?reset=1' : `#/atlas?module=${moduleId}`;
    return;
  }

  if (action === 'clear-atlas') {
    atlasQuery = '';
    atlasModule = 'all';
    window.location.hash = '#/atlas?reset=1';
    return;
  }

  if (action === 'run-lab') {
    runCurrentLab();
    return;
  }

  if (action === 'review-lab') {
    reviewCurrentLab();
    return;
  }

  if (action === 'save-lab') {
    saveCurrentLabCode(true);
    return;
  }

  if (action === 'reset-lab') {
    const route = parseRoute();
    const exercise = exerciseById.get(route.id);
    if (exercise && window.confirm('恢复初始代码？当前草稿会被替换。')) {
      state.labs[exercise.id] = { ...(state.labs[exercise.id] || {}), code: exercise.starter, codeUpdatedAt: new Date().toISOString() };
      saveState();
      render();
      toast('已恢复初始代码');
    }
    return;
  }

  if (action === 'copy-text') {
    handleCopy(actionElement.dataset.copy || '');
  }
});

document.addEventListener('input', (event) => {
  if (event.target.id === 'atlas-search') {
    atlasQuery = event.target.value;
    const items = filteredFunctions();
    const results = document.getElementById('atlas-results');
    const count = document.getElementById('atlas-count');
    if (results) results.innerHTML = renderAtlasRows(items);
    if (count) count.textContent = String(items.length);
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeModal();
  if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
    event.preventDefault();
    if (parseRoute().name !== 'atlas') window.location.hash = '#/atlas';
    else document.getElementById('atlas-search')?.focus();
  }
});

window.addEventListener('hashchange', () => {
  if (parseRoute().name !== 'lab' && saveTimer) clearTimeout(saveTimer);
  render();
  closeModal();
  window.scrollTo({ top: 0, behavior: 'instant' });
});

function compilerLabel() {
  const version = String(health.compiler.version || '');
  const match = version.match(/(\d+\.\d+(?:\.\d+)?)/);
  return health.compiler.available ? `gcc${match ? ` ${match[1]}` : ''}` : 'gcc 离线';
}
async function loadHealth() {
  try {
    const response = await fetch('/api/health', { cache: 'no-store' });
    if (!response.ok) throw new Error('health failed');
    health = await response.json();
  } catch {
    health = { compiler: { available: false, version: '' }, ai: { configured: false, model: null } };
  }
}

async function init() {
  await loadHealth();
  render();
}

init();

































