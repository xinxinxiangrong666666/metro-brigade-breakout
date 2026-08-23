const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d", { alpha: false });
canvas.style.cursor = "crosshair";

const W = 1280;
const H = 720;
const WALL_L = 70;
const WALL_R = 1210;
const CEILING = 102;
const FLOOR = 590;
const LAUNCH = { x: 640, y: 586 };

const ui = {
  hearts: document.querySelector("#hearts"),
  stage: document.querySelector("#stageName"),
  event: document.querySelector("#eventName"),
  compass: document.querySelector("#compassCount"),
  combo: document.querySelector("#combo"),
  toast: document.querySelector("#toast"),
  party: [...document.querySelectorAll(".traveler")],
  start: document.querySelector("#startModal"),
  route: document.querySelector("#routeModal"),
  routeCount: document.querySelector("#routeCount"),
  routeTask: document.querySelector("#routeTask"),
  routeNodes: [...document.querySelectorAll(".route-node-status")],
  upgrade: document.querySelector("#upgradeModal"),
  skill: document.querySelector("#skillModal"),
  departure: document.querySelector("#departureModal"),
  departureScene: document.querySelector(".departure-scene"),
  departureKicker: document.querySelector("#departureKicker"),
  departureTitle: document.querySelector("#departureTitle"),
  departureQuote: document.querySelector("#departureQuote"),
  departureContinue: document.querySelector("#departureContinue"),
  pause: document.querySelector("#pauseModal"),
  end: document.querySelector("#endModal"),
  upgradeGrid: document.querySelector("#upgradeGrid"),
  skillGrid: document.querySelector("#skillLearnGrid"),
  skillSlots: document.querySelector("#skillSlots"),
  skillDetail: document.querySelector("#skillDetail"),
  skillDetailIcon: document.querySelector("#skillDetailIcon"),
  skillDetailType: document.querySelector("#skillDetailType"),
  skillDetailName: document.querySelector("#skillDetailName"),
  skillDetailEffect: document.querySelector("#skillDetailEffect"),
  skillDetailRule: document.querySelector("#skillDetailRule"),
  skillDetailCurrent: document.querySelector("#skillDetailCurrent"),
  skillDetailAfter: document.querySelector("#skillDetailAfter"),
  endTitle: document.querySelector("#endTitle"),
  endKicker: document.querySelector("#endKicker"),
  endSummary: document.querySelector("#endSummary"),
  endSoul: document.querySelector("#endSoul"),
  endNote: document.querySelector("#endNote"),
};

const COLORS = {
  ink: "#07142e",
  paper: "#fff7e8",
  raised: "#fffaf1",
  cobalt: "#123bee",
  coral: "#ff6b57",
  mint: "#a8e6cf",
  gold: "#ffd166",
  muted: "#627087",
};

const STAGES = [
  ["高新园 1-1", "集合教学"],
  ["南头古城 1-2", "窄巷反弹"],
  ["前海湾 1-3", "换乘通道"],
  ["前海石公园 1-4", "海风助推"],
  ["深中通道 1-5", "长桥穿越"],
];

const DEPARTURE_BEATS = [
  {
    kicker: "高新园始发 · 集合教学",
    title: "不是准备好了，才配出发。",
    quote: "很多路，只有迈出去以后，答案才会出现。",
    action: "前往南头古城",
  },
  {
    kicker: "南头古城 · 窄巷突围",
    title: "有人同行，远方才有了形状。",
    quote: "旅行最珍贵的不是抵达，是有人记得你一路上成为了谁。",
    action: "前往前海湾",
  },
  {
    kicker: "前海湾换乘 · 转线",
    title: "你扫清的，从来不只是障碍。",
    quote: "十年前这里还是滩涂，现在是最年轻的一块地。",
    action: "前往前海石公园",
  },
  {
    kicker: "前海石公园 · 海风助力",
    title: "你扫清的，从来不只是障碍。",
    quote: "那些不敢出发、害怕改变、总说下次的自己，也被留在了身后。",
    action: "前往深中通道",
  },
  {
    kicker: "全线突围 · 抵达终局",
    title: "你扫清的，从来不只是障碍。",
    quote: "二十四公里，一头深圳一头中山——这座城市修路的方式。",
    action: "抵达终局",
  },
];

const EVENTS = [
  { name: "早高峰顺风", message: "早高峰顺风助推：弹射速度 +8%", speed: 1.08 },
  { name: "古城回响", message: "古城回响：首次撞击伤害 +1", firstHit: 1 },
  { name: "海风放行", message: "海风放行：罗盘掉落增加", compass: 1.35 },
  { name: "旅团共鸣", message: "旅团共鸣：每位成员暴击率 +6%", crit: 0.06 },
];

const UPGRADES = [
  { id: "damage", icon: "✦", title: "伤害徽章", text: "全体伤害 +10%", apply: s => s.damageMultiplier += .1 },
  { id: "extra", icon: "+", title: "加印车票", text: "每回合弹射 +1 次", apply: s => s.volley++ },
  { id: "crit", icon: "!", title: "暴击胶卷", text: "暴击率 +8%", apply: s => s.crit += 0.08 },
  { id: "blast", icon: "◎", title: "广角闪光灯", text: "阿杰范围伤害 +1", apply: s => s.blast++ },
  { id: "shield", icon: "◇", title: "轻便帐篷", text: "抵挡 1 次越线伤害", apply: s => s.shield++ },
  { id: "speed", icon: "»", title: "顺风贴纸", text: "弹珠速度 +10%", apply: s => s.speed *= 1.1 },
  { id: "map", icon: "⌁", title: "寻路地图", text: "击破方块时罗盘 +1", apply: s => s.mapBonus++ },
];

const SKILLS = [
  {
    id: "power", category: "伤害技能", title: "伤害强化", short: "全体伤害 +15%", text: "三名角色的每一次命中伤害都提高 15%。",
    current: () => `当前总加成 +${Math.round((stats.damageMultiplier - 1) * 100)}%`,
    after: () => `选择后 +${Math.round((stats.damageMultiplier - 1 + .15) * 100)}%`,
    apply: s => { s.damageMultiplier += .15; },
  },
  {
    id: "volley", category: "弹射技能", title: "弹射强化", short: "每回合弹射 +1 次", text: "本回合三人发射结束后，再额外发射一枚角色弹珠。",
    current: () => `当前每回合 ${stats.volley} 次`,
    after: () => `选择后 ${stats.volley + 1} 次`,
    max: 2, apply: s => { s.volley++; },
  },
  {
    id: "crit", category: "暴击技能", title: "暴击强化", short: "暴击率 +10%", text: "所有角色更容易暴击；暴击固定造成 2 倍伤害。",
    current: () => `当前暴击率 ${Math.round(stats.crit * 100)}%`,
    after: () => `选择后 ${Math.round((stats.crit + .1) * 100)}%`,
    apply: s => { s.crit += .1; },
  },
  {
    id: "split", category: "弹珠技能", title: "分裂弹珠", short: "额外弹珠 +1 枚", text: "每回合追加一枚分裂弹珠；分裂弹珠造成原伤害的 50%。",
    current: () => `当前额外 ${stats.split} 枚`,
    after: () => `选择后 ${stats.split + 1} 枚`,
    max: 2, apply: s => { s.split++; },
  },
  {
    id: "pierce", category: "穿透技能", title: "穿透弹珠", short: "每次穿透 +1 块", text: "每枚弹珠可直接穿过一个方块，穿透时仍造成完整伤害。",
    current: () => `当前穿透 ${stats.pierce} 块`,
    after: () => `选择后 ${stats.pierce + 1} 块`,
    apply: s => { s.pierce++; },
  },
  {
    id: "heal", category: "生命道具", title: "急救包", short: "立即恢复 1 颗心", text: "选择后立即恢复一颗生命；生命最多为三颗。",
    current: () => `当前生命 ${lives}/3`,
    after: () => `选择后 ${Math.min(3, lives + 1)}/3`,
    noLevel: true, apply: () => { lives = Math.min(3, lives + 1); updateHud(); },
  },
];

function skillIcon(id) {
  const paths = {
    power: '<path d="m16 3 3 9 9 4-9 4-3 9-3-9-9-4 9-4 3-9Z"/><path d="M16 11v10M11 16h10"/>',
    volley: '<path d="M5 24 15 14M13 14h2v2M10 27 22 15M20 15h2v2M16 27l10-10M24 17h2v2"/>',
    crit: '<circle cx="16" cy="16" r="10"/><circle cx="16" cy="16" r="4"/><path d="M16 2v6M16 24v6M2 16h6M24 16h6"/>',
    split: '<circle cx="9" cy="17" r="5"/><circle cx="23" cy="10" r="4"/><circle cx="23" cy="24" r="4"/><path d="M14 16l5-4M14 19l5 3"/>',
    pierce: '<path d="M4 16h20M18 9l7 7-7 7"/><rect x="8" y="7" width="5" height="18"/><rect x="15" y="7" width="5" height="18"/>',
    heal: '<path d="M16 28S5 21 5 12a6 6 0 0 1 11-3 6 6 0 0 1 11 3c0 9-11 16-11 16Z"/><path d="M16 11v10M11 16h10"/>',
  };
  return `<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" stroke-linejoin="miter">${paths[id]}</svg>`;
}

const background = new Image();
background.src = "assets/battle-background.png";
const gaoxinBg = new Image();
gaoxinBg.src = "assets/stage-gaoxin.png";
const qianhaiwanBg = new Image();
qianhaiwanBg.src = "assets/stage-qianhaiwan.png";
const nantouBg = new Image();
nantouBg.src = "assets/stage-nantou.png";
const qianhaiBg = new Image();
qianhaiBg.src = "assets/stage-qianhaishi.png";
const shenzhongBg = new Image();
shenzhongBg.src = "assets/stage-shenzhong.png";

const nantouIntroImg = new Image();
nantouIntroImg.src = "assets/stage-nantou666.png";

const metroMapImg = new Image();
metroMapImg.src = "assets/6666688888.png";

const spriteImage = new Image();
spriteImage.src = "assets/traveler-sprites.png";
let cleanedSprites = null;
const blockAtlasImage = new Image();
blockAtlasImage.src = "assets/block-atlas-v1.png";
let cleanedBlockAtlas = null;

const ICON_FILES = ["word","excel","powerpoint","photoshop","illustrator","aftereffects"];
const pixelIcons = [];
for (const name of ICON_FILES) {
  const img = new Image();
  img.src = "assets/pixel_icons/" + name + "_256.png";
  pixelIcons.push(img);
}

spriteImage.addEventListener("load", () => {
  const sheet = document.createElement("canvas");
  sheet.width = spriteImage.naturalWidth;
  sheet.height = spriteImage.naturalHeight;
  const sctx = sheet.getContext("2d", { willReadFrequently: true });
  sctx.drawImage(spriteImage, 0, 0);
  try {
    const data = sctx.getImageData(0, 0, sheet.width, sheet.height);
    const px = data.data;
    for (let i = 0; i < px.length; i += 4) {
      const max = Math.max(px[i], px[i + 1], px[i + 2]);
      const min = Math.min(px[i], px[i + 1], px[i + 2]);
      if (max - min < 14 && min > 215) px[i + 3] = 0;
    }
    sctx.putImageData(data, 0, 0);
    cleanedSprites = sheet;
  } catch {
    cleanedSprites = spriteImage;
  }
});

blockAtlasImage.addEventListener("load", () => {
  cleanedBlockAtlas = removeConnectedLightBackground(blockAtlasImage);
});

function removeConnectedLightBackground(image) {
  const sheet = document.createElement("canvas");
  sheet.width = image.naturalWidth;
  sheet.height = image.naturalHeight;
  const sheetContext = sheet.getContext("2d", { willReadFrequently: true });
  sheetContext.drawImage(image, 0, 0);
  try {
    const imageData = sheetContext.getImageData(0, 0, sheet.width, sheet.height);
    const pixels = imageData.data;
    const seen = new Uint8Array(sheet.width * sheet.height);
    const queue = [];
    const isBackground = index => {
      const offset = index * 4;
      const r = pixels[offset];
      const g = pixels[offset + 1];
      const b = pixels[offset + 2];
      return Math.max(r, g, b) - Math.min(r, g, b) < 26 && Math.min(r, g, b) > 168;
    };
    const enqueue = index => {
      if (index < 0 || index >= seen.length || seen[index] || !isBackground(index)) return;
      seen[index] = 1;
      queue.push(index);
    };
    for (let x = 0; x < sheet.width; x++) {
      enqueue(x);
      enqueue((sheet.height - 1) * sheet.width + x);
    }
    for (let y = 0; y < sheet.height; y++) {
      enqueue(y * sheet.width);
      enqueue(y * sheet.width + sheet.width - 1);
    }
    for (let cursor = 0; cursor < queue.length; cursor++) {
      const index = queue[cursor];
      const x = index % sheet.width;
      if (x > 0) enqueue(index - 1);
      if (x < sheet.width - 1) enqueue(index + 1);
      enqueue(index - sheet.width);
      enqueue(index + sheet.width);
    }
    for (let index = 0; index < seen.length; index++) {
      if (seen[index]) pixels[index * 4 + 3] = 0;
    }
    sheetContext.putImageData(imageData, 0, 0);
    return sheet;
  } catch {
    return image;
  }
}

let mode = "menu";
let routeProgress = 1;
let journeyStarted = false;
let lastRunWon = false;
let level = 1;
let lives = 3;
let compass = 0;
let totalHits = 0;
let blocks = [];
let projectiles = [];
let particles = [];
let floaters = [];
let shockwaves = [];
let pickups = [];
let gates = [];
let courier = null;
let launchQueue = [];
let dragging = false;
let aim = { x: 0.22, y: -0.975 };
let pointer = { x: LAUNCH.x + 90, y: LAUNCH.y - 320, visible: false };
let combo = 0;
let shake = 0;
let screenFlash = 0;
let pendingLoot = 0;
let learnedSkills = { power: 0, volley: 0, crit: 0, split: 0, pierce: 0, heal: 0 };
let selectedSkillId = null;
let event = EVENTS[0];
let toastTimer = 0;
let lastTime = performance.now();
let fpsWindowStart = lastTime;
let fpsFrames = 0;
let rng = Math.random;
let introShown = false;
let metroMapShown = false;
  document.querySelector("#game-shell").classList.remove("cinematic");
let audio = null;

const stats = {
  damage: 1,
  damageMultiplier: 1,
  volley: 3,
  crit: 0.08,
  blast: 0,
  shield: 0,
  speed: 690,
  mapBonus: 0,
  heavyBonus: 1,
  flashEvery: 4,
  split: 0,
  pierce: 0,
};

function seededRandom(seed) {
  return function rand() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}


const ROUTE_STOPS = [
  { name: "高新园", task: "高新园集合" },
  { name: "南头古城", task: "南头古城突围" },
  { name: "前海湾", task: "前海湾换乘" },
  { name: "前海石公园", task: "前海石公园突围" },
  { name: "深中通道", task: "深中通道终局" },
];

function routeActiveIndex() {
  const idx = routeProgress - 1;
  if (idx >= ROUTE_STOPS.length) return -1;
  if (idx < 0) return 0;
  return idx;
}

function updateRoutePage() {
  const active = routeActiveIndex();
  const allDone = routeProgress > ROUTE_STOPS.length;
  const collected = Math.min(routeProgress - 1, ROUTE_STOPS.length);
  ui.routeCount.textContent = `明信片 ${collected}/${ROUTE_STOPS.length}`;
  ui.routeTask.textContent = allDone ? "五站完成 · 查看全线结算" : ROUTE_STOPS[active].task;
  const btn = document.querySelector("#routeStartBtn");
  if (btn) btn.textContent = allDone ? "查看全线结算  »" : "前往当前站  »";
  ui.routeNodes.forEach((node, index) => {
    if (!node) return;
    const completed = index < routeProgress - 1;
    const isActive = index === routeProgress - 1;
    node.className = "route-node-status " + (completed ? "completed" : isActive ? "active" : "locked");
    node.textContent = completed ? "✓" : isActive ? "●" : "·";
    node.setAttribute("aria-label", ROUTE_STOPS[index]?.name + (completed ? "已完成" : isActive ? "当前站" : "未解锁") || "未知站点");
  });
}

function showRoutePage() {
  mode = "route";
  updateRoutePage();
  draw();
  ui.route.classList.add("open");
}

function startCurrentRoute() {
  document.querySelector("#game-shell").style.visibility = "visible";
  if (routeProgress > 5) {
    ui.route.classList.remove("open");
    finish(true);
    return;
  }
  if (!journeyStarted) {
    journeyStarted = true;
    routeProgress = 1;
    newRun();
  } else if (routeProgress === 2 && !introShown) {
    showNantouIntro();
    draw();
    ui.route.classList.remove("open");
    return;
  } else {
    setupLevel();
    updateHud();
  }
  draw();
  ui.route.classList.remove("open");
  showToast("拖拽规划路线，松手开始弹射");
}

function resetStats() {
  Object.assign(stats, { damage: 1, damageMultiplier: 1, volley: 3, crit: 0.08, blast: 0, shield: 0, speed: 690, mapBonus: 0, heavyBonus: 1, flashEvery: 4, split: 0, pierce: 0 });
  learnedSkills = { power: 0, volley: 0, crit: 0, split: 0, pierce: 0, heal: 0 };
  renderSkillRack();
}

function newRun() {
  level = 1;
  lives = 3;
  compass = 0;
  totalHits = 0;
  combo = 0;
  pendingLoot = 0;
  introShown = false;
  resetStats();
  setupLevel();
  updateHud();
}

function showMetroMap() {
  const shell = document.querySelector("#game-shell");
  shell.classList.add("cinematic");
  shell.style.visibility = "visible";
  mode = "metromap";
  draw();
}

function dismissMetroMap() {
  metroMapShown = true;
  mode = "route";
  draw();
  document.querySelector("#game-shell").classList.remove("cinematic");
  showRoutePage();
}

function showNantouIntro() {
  document.querySelector("#game-shell").classList.add("cinematic");
  mode = "intro";
  draw();
}

function dismissIntro() {
  introShown = true;
  mode = "aim";
  setupLevel();
  updateHud();
  draw();
  document.querySelector("#game-shell").classList.remove("cinematic");
  showToast("南头古城 · 窄巷突围，拖拽规划路线");
}

function setupLevel() {
  projectiles = [];
  particles = [];
  floaters = [];
  shockwaves = [];
  pickups = [];
  gates = [];
  launchQueue = [];
  dragging = false;
  rng = seededRandom(Date.now() + level * 911);
  event = level === 1 ? EVENTS[0] : EVENTS[Math.floor(rng() * EVENTS.length)];
  blocks = [];

  const columns = 8;
  const rows = Math.min(1 + level, 4);
  const bw = 108;
  const bh = 62;
  const gap = 8;
  const startX = (W - (columns * bw + (columns - 1) * gap)) / 2;
  const chance = level === 1 ? 0.58 : Math.min(0.56 + level * 0.045, 0.8);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      if (rng() > chance) continue;
      const roll = rng();
      const kind = roll < 0.11
        ? "loot"
        : roll < 0.21
          ? "boost"
          : roll < 0.31
            ? "armor"
            : roll < 0.68
              ? "creature"
              : roll < 0.84
                ? "stone"
                : "crate";
      let hp = Math.max(1, level - 1 + row + Math.ceil(rng() * 2));
      if (level === 1) hp = row === 0 ? 1 : 2;
      if (kind === "stone") hp += 1;
      if (kind === "armor") hp += 2;
      blocks.push({
        id: `${level}-${row}-${col}-${Math.floor(rng() * 9999)}`,
        x: startX + col * (bw + gap),
        y: 128 + row * (bh + gap),
        w: bw,
        h: bh,
        hp,
        maxHp: hp,
        kind,
        variant: kind === "creature" ? Math.floor(rng() * 3) : 0,
        iconIndex: kind === "creature" ? -1 : Math.floor(rng() * 6),
        pulse: rng() * Math.PI * 2,
      });
    }
  }

  if (blocks.length < 5) {
    for (let col = 2; col < 6; col++) {
      blocks.push({ id: `safe-${col}`, x: startX + col * (bw + gap), y: 128, w: bw, h: bh, hp: 1, maxHp: 1, kind: "crate", variant: 0, iconIndex: -1, pulse: 0 });
    }
  }

  if (!blocks.some(block => block.kind === "loot")) {
    const lootBlock = blocks.reduce((best, block) => Math.abs(block.x + block.w / 2 - W / 2) < Math.abs(best.x + best.w / 2 - W / 2) ? block : best, blocks[0]);
    lootBlock.kind = "loot";
    lootBlock.hp = 1;
    lootBlock.maxHp = 1;
  }

  const pickupCount = 2 + Math.floor(level / 2);
  for (let i = 0; i < pickupCount; i++) {
    pickups.push({
      x: 260 + rng() * 760,
      y: 315 + rng() * 150,
      r: 15,
      phase: rng() * Math.PI * 2,
      alive: true,
    });
  }

  if (level >= 2) {
    const gateY = 365 + rng() * 85;
    gates = [
      { x: 255, y: gateY, color: COLORS.mint, phase: 0 },
      { x: 1025, y: gateY - 40 + rng() * 80, color: COLORS.coral, phase: Math.PI },
    ];
  }

  const courierFromLeft = rng() > .5;
  courier = {
    x: courierFromLeft ? -70 : W + 70,
    y: 310 + rng() * 155,
    vx: (95 + level * 14) * (courierFromLeft ? 1 : -1),
    active: true,
  };

  ui.stage.textContent = STAGES[level - 1][0];
  ui.event.textContent = event.name;
  mode = "aim";
    setActiveCharacter(0);
    canvas.style.cursor = "crosshair";
    window.setTimeout(() => showToast(event.message), 220);
  }

function initAudio() {
  if (audio) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (AudioContext) audio = new AudioContext();
}

function beep(frequency = 280, duration = 0.045, type = "square", volume = 0.025) {
  if (!audio || audio.state !== "running") return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, audio.currentTime);
  gain.gain.setValueAtTime(volume, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
  osc.connect(gain).connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + duration);
}

function updateHud() {
  ui.hearts.textContent = "♥ ".repeat(Math.max(0, lives)).trim() || "—";
  ui.compass.textContent = compass;
}

function renderSkillRack() {
  if (!ui.skillSlots) return;
  ui.skillSlots.replaceChildren(...SKILLS.map(skill => {
    const levelValue = learnedSkills[skill.id] || 0;
    const slot = document.createElement("button");
    slot.type = "button";
    slot.className = `skill-slot skill-${skill.id}${levelValue ? " learned" : ""}`;
    slot.setAttribute("aria-label", `${skill.title}，${skill.short}，${levelValue ? skill.noLevel ? `已使用 ${levelValue} 次` : `${levelValue}级` : "未学习"}`);
    slot.setAttribute("aria-expanded", selectedSkillId === skill.id ? "true" : "false");
    slot.innerHTML = `<span class="skill-slot-icon">${skillIcon(skill.id)}</span><span class="skill-copy"><b>${skill.title}</b><small>${skill.short}</small></span><span class="skill-state">${levelValue ? skill.noLevel ? `使用×${levelValue}` : `LV.${levelValue}` : "未学"}</span>`;
    slot.addEventListener("click", () => openSkillDetail(skill));
    return slot;
  }));

  if (selectedSkillId && !ui.skillDetail.hidden) {
    const selectedSkill = SKILLS.find(skill => skill.id === selectedSkillId);
    if (selectedSkill) updateSkillDetail(selectedSkill);
  }
}

function updateSkillDetail(skill) {
  const levelValue = learnedSkills[skill.id] || 0;
  ui.skillDetail.dataset.skill = skill.id;
  ui.skillDetailIcon.innerHTML = skillIcon(skill.id);
  ui.skillDetailType.textContent = `${skill.category} · ${levelValue ? skill.noLevel ? `使用 ${levelValue} 次` : `LV.${levelValue}` : "尚未学习"}`;
  ui.skillDetailName.textContent = skill.title;
  ui.skillDetailEffect.textContent = skill.short;
  ui.skillDetailRule.textContent = skill.text;
  ui.skillDetailCurrent.textContent = skill.current();
  ui.skillDetailAfter.textContent = skill.after();
}

function openSkillDetail(skill) {
  selectedSkillId = skill.id;
  updateSkillDetail(skill);
  ui.skillDetail.hidden = false;
  renderSkillRack();
}

function closeSkillDetail() {
  selectedSkillId = null;
  ui.skillDetail.hidden = true;
  renderSkillRack();
}

function setActiveCharacter(index) {
  ui.party.forEach((card, i) => card.classList.toggle("active", i === index));
}

function showToast(text) {
  ui.toast.textContent = text;
  ui.toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => ui.toast.classList.remove("show"), 1450);
}

function showCombo() {
  if (combo < 2) {
    ui.combo.classList.remove("show", "hot", "fire");
    return;
  }
  ui.combo.querySelector("b").textContent = combo;
  ui.combo.classList.remove("show", "hot", "fire");
  void ui.combo.offsetWidth;
  ui.combo.classList.add("show");
  if (combo >= 6) ui.combo.classList.add("hot");
  if (combo >= 12) ui.combo.classList.add("fire");
}

function pointerPosition(eventLike) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (eventLike.clientX - rect.left) * (W / rect.width),
    y: (eventLike.clientY - rect.top) * (H / rect.height),
  };
}

function updateAim(point) {
  pointer.x = Math.max(WALL_L, Math.min(WALL_R, point.x));
  pointer.y = Math.max(CEILING, Math.min(FLOOR, point.y));
  pointer.visible = true;
  let dx = point.x - LAUNCH.x;
  let dy = point.y - LAUNCH.y;
  if (dy > -45) dy = -45;
  const length = Math.hypot(dx, dy) || 1;
  dx /= length;
  dy /= length;
  if (dy > -0.28) {
    const sign = Math.sign(dx) || 1;
    dy = -0.28;
    dx = sign * Math.sqrt(1 - dy * dy);
  }
  aim = { x: dx, y: dy };
}

canvas.addEventListener("pointerdown", eventLike => {
  if (mode !== "aim") return;
  dragging = true;
  canvas.setPointerCapture?.(eventLike.pointerId);
  updateAim(pointerPosition(eventLike));
  beep(180, 0.035, "square", 0.018);
});

canvas.addEventListener("pointermove", eventLike => {
  if (mode !== "aim") return;
  updateAim(pointerPosition(eventLike));
});

canvas.addEventListener("pointerenter", eventLike => {
  if (mode === "aim") updateAim(pointerPosition(eventLike));
});

canvas.addEventListener("pointerleave", () => {
  if (!dragging) pointer.visible = false;
});

canvas.addEventListener("pointerup", eventLike => {
  if (mode === "metromap") { dismissMetroMap(); return; }
  if (mode === "intro") { dismissIntro(); return; }
  if (!dragging || mode !== "aim") return;
  dragging = false;
  updateAim(pointerPosition(eventLike));
  startVolley();
});

canvas.addEventListener("pointercancel", () => { dragging = false; });

function startVolley() {
  if (mode !== "aim") return;
  closeSkillDetail();
  mode = "firing";
  pointer.visible = false;
  combo = 0;
  showCombo();
  const now = performance.now() / 1000;
  launchQueue = Array.from({ length: stats.volley }, (_, index) => ({
    at: now + index * 0.16,
    character: index % 3,
    damageScale: 1,
  }));
  for (let index = 0; index < stats.split; index++) {
    launchQueue.push({ at: now + (stats.volley + index) * .12, character: index % 3, damageScale: .5 });
  }
  beep(240, 0.08, "sawtooth", 0.025);
  navigator.vibrate?.(18);
}

function spawnProjectile(character, damageScale = 1) {
  const speed = stats.speed * (event.speed || 1);
  projectiles.push({
    x: LAUNCH.x + (character - 1) * 18,
    y: LAUNCH.y,
    px: LAUNCH.x,
    py: LAUNCH.y,
    vx: aim.x * speed,
    vy: aim.y * speed,
    r: character === 1 ? 16 : 14,
    character,
    damageScale,
    alive: true,
    age: 0,
    bounces: 0,
    hitCount: 0,
    lastBlock: null,
    firstHit: true,
    trail: [],
    gateCooldown: 0,
    pierceLeft: stats.pierce,
  });
  setActiveCharacter(character);
  const launchColor = character === 0 ? COLORS.cobalt : character === 1 ? COLORS.coral : COLORS.mint;
  createBurst(LAUNCH.x, LAUNCH.y, launchColor, 14);
  addShockwave(LAUNCH.x, LAUNCH.y, launchColor, 13, 62, .36);
  screenFlash = Math.max(screenFlash, .06);
}

function update(dt, nowSeconds) {
  if (mode === "paused" || mode === "menu" || mode === "upgrade" || mode === "skill" || mode === "departure" || mode === "ended" || mode === "intro" || mode === "metromap") return;

  if (mode === "firing") {
    while (launchQueue.length && launchQueue[0].at <= nowSeconds) {
      const queued = launchQueue.shift();
      spawnProjectile(queued.character, queued.damageScale);
    }
  }

  if (courier?.active) {
    courier.x += courier.vx * dt;
    if (courier.vx > 0 && courier.x > W + 90) courier.x = -90;
    if (courier.vx < 0 && courier.x < -90) courier.x = W + 90;
  }

  for (const p of projectiles) {
    if (!p.alive) continue;
    p.age += dt;
    p.gateCooldown = Math.max(0, p.gateCooldown - dt);
    p.trail.unshift({ x: p.x, y: p.y });
    if (p.trail.length > 18) p.trail.length = 18;
    p.px = p.x;
    p.py = p.y;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    if (p.x - p.r < WALL_L) {
      p.x = WALL_L + p.r;
      p.vx = Math.abs(p.vx);
      wallBounce(p);
    } else if (p.x + p.r > WALL_R) {
      p.x = WALL_R - p.r;
      p.vx = -Math.abs(p.vx);
      wallBounce(p);
    }
    if (p.y - p.r < CEILING) {
      p.y = CEILING + p.r;
      p.vy = Math.abs(p.vy);
      wallBounce(p);
    }

    let touching = null;
    for (const block of blocks) {
      if (circleRect(p, block)) {
        touching = block.id;
        if (p.lastBlock !== block.id) {
          if (p.pierceLeft > 0) {
            p.pierceLeft--;
            hitBlock(block, p);
            floaters.push({ x: p.x, y: p.y - 18, text: "穿透", color: "#d9e1ff", life: .55 });
            addShockwave(p.x, p.y, "#b8c5ff", 8, 42, .24);
          } else {
            reflectFromBlock(p, block);
            hitBlock(block, p);
          }
        }
        break;
      }
    }
    p.lastBlock = touching;
    handleFunElements(p);

    if (p.y - p.r > H || p.age > 11.5 || p.bounces > 28) p.alive = false;
  }

  projectiles = projectiles.filter(p => p.alive);
  updateParticles(dt);
  updateFloaters(dt);
  updateShockwaves(dt);
  shake = Math.max(0, shake - dt * 28);
  screenFlash = Math.max(0, screenFlash - dt * 2.8);

  if (mode === "firing" && blocks.length === 0) {
    resolveVolley();
    return;
  }

  if (mode === "firing" && launchQueue.length === 0 && projectiles.length === 0) resolveVolley();
}

function wallBounce(p) {
  p.bounces++;
  beep(150 + p.character * 60, 0.024, "square", 0.012);
  createBurst(p.x, p.y, "rgba(255,255,255,.95)", 7);
  addShockwave(p.x, p.y, "#ffffff", 4, 30, .18);
}

function handleFunElements(p) {
  for (const pickup of pickups) {
    if (!pickup.alive || Math.hypot(p.x - pickup.x, p.y - pickup.y) > p.r + pickup.r + 4) continue;
    pickup.alive = false;
    addCompass(1);
    createBurst(pickup.x, pickup.y, COLORS.gold, 18);
    addShockwave(pickup.x, pickup.y, COLORS.gold, 8, 54, .32);
    floaters.push({ x: pickup.x, y: pickup.y - 12, text: "航标 +1", color: COLORS.gold, life: .85 });
    beep(740, .08, "square", .03);
  }

  if (courier?.active && Math.abs(p.x - courier.x) < 42 && Math.abs(p.y - courier.y) < 29) {
    courier.active = false;
    addCompass(5);
    createBurst(courier.x, courier.y, COLORS.gold, 28);
    addShockwave(courier.x, courier.y, COLORS.coral, 12, 88, .5);
    floaters.push({ x: courier.x, y: courier.y - 18, text: "风邮明信片 +5", color: COLORS.gold, life: 1.2 });
    showToast("截获风邮明信片：罗盘 +5");
    screenFlash = Math.max(screenFlash, .18);
    navigator.vibrate?.([20, 20, 45]);
    beep(880, .14, "triangle", .045);
  }

  if (p.gateCooldown > 0 || gates.length !== 2) return;
  for (let i = 0; i < gates.length; i++) {
    const gate = gates[i];
    if (Math.hypot(p.x - gate.x, p.y - gate.y) > p.r + 27) continue;
    const exit = gates[1 - i];
    addShockwave(gate.x, gate.y, gate.color, 15, 75, .4);
    addShockwave(exit.x, exit.y, exit.color, 15, 75, .4);
    p.x = exit.x + Math.sign(p.vx || 1) * 48;
    p.y = exit.y;
    p.px = p.x;
    p.py = p.y;
    p.gateCooldown = .45;
    p.trail.length = 0;
    createBurst(exit.x, exit.y, exit.color, 20);
    screenFlash = Math.max(screenFlash, .1);
    beep(620, .1, "sine", .035);
    break;
  }
}

function circleRect(circle, rect) {
  const nearestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
  const nearestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
  const dx = circle.x - nearestX;
  const dy = circle.y - nearestY;
  return dx * dx + dy * dy < circle.r * circle.r;
}

function reflectFromBlock(p, b) {
  const cameFromTop = p.py + p.r <= b.y;
  const cameFromBottom = p.py - p.r >= b.y + b.h;
  if (cameFromTop) {
    p.y = b.y - p.r;
    p.vy = -Math.abs(p.vy);
  } else if (cameFromBottom) {
    p.y = b.y + b.h + p.r;
    p.vy = Math.abs(p.vy);
  } else {
    if (p.px < b.x) {
      p.x = b.x - p.r;
      p.vx = -Math.abs(p.vx);
    } else {
      p.x = b.x + b.w + p.r;
      p.vx = Math.abs(p.vx);
    }
  }
  p.bounces++;
}

function hitBlock(block, p) {
  p.hitCount++;
  combo++;
  totalHits++;
  let damage = (stats.damage + (p.character === 1 ? stats.heavyBonus : 0)) * stats.damageMultiplier;
  if (p.firstHit) damage *= p.character === 0 ? 1.3 : 1;
  if (p.firstHit) damage += event.firstHit || 0;
  if (p.character === 1) damage *= 1 + Math.min(.25, p.bounces * .05);
  damage *= p.damageScale || 1;
  p.firstHit = false;
  const critChance = stats.crit + (event.crit || 0);
  const critical = rng() < critChance;
  if (critical) damage *= 2;
  damage = Math.max(.5, Math.round(damage * 10) / 10);
  block.hp -= damage;

  if (block.kind === "boost") {
    const boost = 1.035;
    p.vx *= boost;
    p.vy *= boost;
  }

  if (p.character === 0 && p.hitCount % stats.flashEvery === 0) photoFlash(block, 1 + stats.blast);
  if (p.character === 2 && rng() < 0.24) addCompass(1);

  const damageText = Number.isInteger(damage) ? String(damage) : damage.toFixed(1);
  floaters.push({ x: p.x, y: p.y, text: critical ? `暴击 -${damageText}` : `-${damageText}`, color: critical ? COLORS.gold : COLORS.paper, life: 0.7 });
  createBurst(p.x, p.y, p.character === 0 ? COLORS.cobalt : p.character === 1 ? COLORS.coral : COLORS.mint, critical ? 13 : 8);
  addShockwave(p.x, p.y, critical ? COLORS.gold : COLORS.paper, critical ? 12 : 5, critical ? 76 : 34, critical ? .38 : .2);
  shake = Math.min(8, shake + (critical ? 4 : 1.4));
  screenFlash = Math.max(screenFlash, critical ? .22 : .045);
  showCombo();
  beep(260 + Math.min(combo, 12) * 24, critical ? 0.08 : 0.04, critical ? "sawtooth" : "square", critical ? 0.04 : 0.023);
  if (critical) navigator.vibrate?.(24);

  if (block.hp <= 0) destroyBlock(block, p);
}

function photoFlash(origin, radius) {
  const maxDistance = 125 + radius * 25;
  for (const target of blocks) {
    if (target === origin) continue;
    const dx = (target.x + target.w / 2) - (origin.x + origin.w / 2);
    const dy = (target.y + target.h / 2) - (origin.y + origin.h / 2);
    if (Math.hypot(dx, dy) < maxDistance) {
      target.hp -= 1;
      floaters.push({ x: target.x + target.w / 2, y: target.y, text: "闪光 -1", color: "#d9e1ff", life: 0.65 });
      if (target.hp <= 0) destroyBlock(target, { character: 0 });
    }
  }
  createBurst(origin.x + origin.w / 2, origin.y + origin.h / 2, "#ffffff", 20);
  addShockwave(origin.x + origin.w / 2, origin.y + origin.h / 2, COLORS.cobalt, 15, maxDistance, .42);
  screenFlash = Math.max(screenFlash, .16);
}

function destroyBlock(block, projectile) {
  const index = blocks.indexOf(block);
  if (index < 0) return;
  blocks.splice(index, 1);
  const gain = 1 + (projectile.character === 2 ? stats.mapBonus : 0);
  addCompass(gain);
  createBurst(block.x + block.w / 2, block.y + block.h / 2, COLORS.gold, 28);
  addShockwave(block.x + block.w / 2, block.y + block.h / 2, COLORS.gold, 10, 84, .42);
  addShockwave(block.x + block.w / 2, block.y + block.h / 2, COLORS.paper, 18, 46, .2);
  shake = Math.min(10, shake + 4);
  screenFlash = Math.max(screenFlash, .12);
  floaters.push({ x: block.x + block.w / 2, y: block.y + 8, text: `罗盘 +${gain}`, color: COLORS.gold, life: 0.9 });
  if (block.kind === "loot") {
    pendingLoot++;
    screenFlash = Math.max(screenFlash, .2);
    addShockwave(block.x + block.w / 2, block.y + block.h / 2, COLORS.coral, 15, 92, .48);
    floaters.push({ x: block.x + block.w / 2, y: block.y - 12, text: "发现技能行李箱", color: COLORS.paper, life: 1.25 });
    showToast("行李箱已打开：本轮结束学习技能");
  }
  beep(520, 0.07, "square", 0.035);
}

function addCompass(amount) {
  compass += Math.max(1, Math.round(amount * (event.compass || 1)));
  updateHud();
}

function createBurst(x, y, color, count) {
  for (let i = 0; i < count && particles.length < 180; i++) {
    const angle = rng() * Math.PI * 2;
    const speed = 55 + rng() * 145;
    particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, size: 3 + rng() * 6, color, life: 0.25 + rng() * 0.38 });
  }
}

function addShockwave(x, y, color, from = 8, to = 64, life = .35) {
  shockwaves.push({ x, y, color, radius: from, from, to, life, maxLife: life });
  if (shockwaves.length > 40) shockwaves.shift();
}

function updateParticles(dt) {
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 210 * dt;
    p.life -= dt;
  }
  particles = particles.filter(p => p.life > 0);
}

function updateFloaters(dt) {
  for (const f of floaters) {
    f.y -= 42 * dt;
    f.life -= dt;
  }
  floaters = floaters.filter(f => f.life > 0);
}

function updateShockwaves(dt) {
  for (const wave of shockwaves) {
    wave.life -= dt;
    const progress = 1 - Math.max(0, wave.life) / wave.maxLife;
    wave.radius = wave.from + (wave.to - wave.from) * progress;
  }
  shockwaves = shockwaves.filter(wave => wave.life > 0);
}

function resolveVolley() {
  ui.combo.classList.remove("show", "hot", "fire");
  if (blocks.length === 0) {
    projectiles = [];
    launchQueue = [];
  }
  if (pendingLoot > 0) {
    openSkillLearn();
    return;
  }
  finishVolleyResolution();
}

function finishVolleyResolution() {
  if (blocks.length === 0) {
    levelCleared();
    return;
  }

  blocks.forEach(block => { block.y += 39; });
  const danger = blocks.filter(block => block.y + block.h > 548);
  if (danger.length) {
    if (stats.shield > 0) {
      stats.shield--;
      blocks = blocks.filter(block => !danger.includes(block));
      showToast("帐篷挡住了越线路障！");
      beep(180, 0.15, "triangle", 0.04);
    } else {
      lives--;
      blocks = blocks.filter(block => !danger.includes(block));
      updateHud();
      showToast("路障越线，体力 -1");
      navigator.vibrate?.([35, 35, 35]);
      if (lives <= 0) {
        finish(false);
        return;
      }
    }
  }
  combo = 0;
  mode = "aim";
  setActiveCharacter(0);
}

function openSkillLearn() {
  mode = "skill";
  closeSkillDetail();
  const choices = pickSkills(3);
  ui.skillGrid.replaceChildren(...choices.map(skill => {
    const currentLevel = learnedSkills[skill.id] || 0;
    const button = document.createElement("button");
    button.className = `skill-learn-card skill-card-${skill.id}`;
    const levelLabel = skill.noLevel ? "立即使用" : currentLevel ? `LV.${currentLevel} → ${currentLevel + 1}` : "NEW";
    button.innerHTML = `<span class="skill-card-top"><span class="skill-learn-icon">${skillIcon(skill.id)}</span><span><span class="skill-card-type">${skill.category}</span><b>${skill.title}</b></span></span><em>${levelLabel}</em><strong class="skill-main-effect">${skill.short}</strong><small>${skill.text}</small><span class="skill-value-change"><span>${skill.current()}</span><b>→</b><span>${skill.after()}</span></span><span class="skill-select-label">选择这个技能</span>`;
    button.addEventListener("click", () => learnSkill(skill), { once: true });
    return button;
  }));
  ui.skill.classList.add("open");
  beep(680, .12, "triangle", .035);
}

function pickSkills(count) {
  const pool = SKILLS.filter(skill => (skill.id !== "heal" || lives < 3) && (skill.noLevel || !skill.max || (learnedSkills[skill.id] || 0) < skill.max));
  const choices = [];
  while (choices.length < count && pool.length) choices.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  return choices;
}

function learnSkill(skill) {
  learnedSkills[skill.id] = (learnedSkills[skill.id] || 0) + 1;
  skill.apply(stats);
  pendingLoot = Math.max(0, pendingLoot - 1);
  renderSkillRack();
  ui.skill.classList.remove("open");
  showToast(skill.noLevel ? `${skill.title}：${skill.short}` : `${skill.title} LV.${learnedSkills[skill.id]}：${skill.short}`);
  beep(860, .15, "square", .045);
  navigator.vibrate?.([20, 25, 45]);
  if (pendingLoot > 0) window.setTimeout(openSkillLearn, 220);
  else window.setTimeout(finishVolleyResolution, 220);
}

function levelCleared() {
  mode = "departure";
  projectiles = [];
  launchQueue = [];
  compass += level * 3;
  updateHud();
  navigator.vibrate?.([30, 30, 55]);
  beep(440, 0.12, "square", 0.035);
  window.setTimeout(() => beep(660, 0.16, "square", 0.035), 110);

  window.setTimeout(openDeparture, 320);
}

function openDeparture() {
  const beat = DEPARTURE_BEATS[routeProgress - 1];
  const finalFlight = routeProgress >= STAGES.length;
  ui.departureKicker.textContent = beat.kicker;
  ui.departureTitle.textContent = beat.title;
  ui.departureQuote.textContent = beat.quote;
  ui.departureContinue.innerHTML = `${beat.action} <span>→</span>`;
  ui.departureScene.classList.remove("flying");
  void ui.departureScene.offsetWidth;
  ui.departureScene.classList.add("flying");
  ui.departure.classList.add("open");
  ui.departureContinue.onclick = () => {
    if (finalFlight) {
      routeProgress = STAGES.length + 1;
      mode = "route";
      draw();
      ui.departure.classList.remove("open");
      showRoutePage();
      return;
    }
    openUpgradeChoices();
    ui.departure.classList.remove("open");
  };
}

function openUpgradeChoices() {
  mode = "upgrade";
  const choices = pickUpgrades(3);
  ui.upgradeGrid.replaceChildren(...choices.map(upgrade => {
    const button = document.createElement("button");
    button.className = "upgrade-card";
    button.innerHTML = `<span class="upgrade-icon">${upgrade.icon}</span><b>${upgrade.title}</b><small>${upgrade.text}</small>`;
    button.addEventListener("click", () => chooseUpgrade(upgrade), { once: true });
    return button;
  }));
  ui.upgrade.classList.add("open");
}

function pickUpgrades(count) {
  const pool = [...UPGRADES];
  const result = [];
  while (result.length < count && pool.length) result.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  return result;
}

function chooseUpgrade(upgrade) {
  upgrade.apply(stats);
  level++;
  routeProgress = level;
  updateHud();
  mode = "route";
  draw();
  ui.upgrade.classList.remove("open");
  showToast(`${upgrade.title}：已装进行囊`);
  beep(720, 0.11, "square", 0.035);
  showRoutePage();
}

function finish(won) {
  mode = "ended";
  lastRunWon = won;
  ui.upgrade.classList.remove("open");
  ui.skill.classList.remove("open");
  ui.pause.classList.remove("open");
  ui.departure.classList.remove("open");
  ui.endKicker.textContent = won ? "全程通关 · 深圳出发" : "航道仍在等待";
  ui.endTitle.textContent = won ? "你不是去了更远的地方。" : "这一次停下，不等于永远错过。";
  ui.endSoul.textContent = won
    ? "你只是终于，没有辜负那个想出发的自己。"
    : "真正的出发，是愿意在停下以后，再试一次。";
  ui.endSummary.textContent = won
    ? `从深圳出发 · 五站清空 · ${totalHits} 次撞击 · 收集 ${compass} 枚罗盘`
    : `抵达第 ${level} 站 · ${totalHits} 次撞击 · 收集 ${compass} 枚罗盘`;
  ui.endNote.textContent = won
    ? "游戏会结束，旅行也会结束。但真正被带回来的，是一个更敢开始、更愿意同行、也更能告别的人。"
    : "飞机还在窗外，同行的人也还在。休息一下，然后把“下次”变成这一次。";
  document.querySelector("#againBtn").textContent = won ? "带着现在的自己，再出发" : "回线路图 · 重挑本站";
  ui.end.classList.add("open");
}


function pixelCloud(x, y, color, scale = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 96 * scale, 18 * scale);
  ctx.fillRect(x + 18 * scale, y - 16 * scale, 58 * scale, 18 * scale);
  ctx.fillRect(x + 40 * scale, y - 28 * scale, 30 * scale, 14 * scale);
}

function drawCityBackground() {
  if (level === 1) drawGaoxinBackground();
  else if (level === 2) drawNantouBackground();
  else if (level === 3) drawQianhaiwanBackground();
  else if (level === 4) drawQianhaiBackground();
  else drawShenzhongBackground();
}

function drawGaoxinBackground() {
  if (gaoxinBg.complete && gaoxinBg.naturalWidth) {
    ctx.drawImage(gaoxinBg, 0, 0, W, H);
  } else {
    ctx.fillStyle = "#4f7fb8";
    ctx.fillRect(0, 0, W, H);
  }
}

function drawQianhaiwanBackground() {
  if (qianhaiwanBg.complete && qianhaiwanBg.naturalWidth) {
    ctx.drawImage(qianhaiwanBg, 0, 0, W, H);
  } else {
    ctx.fillStyle = "#2f6f86";
    ctx.fillRect(0, 0, W, H);
  }
}

function drawNantouBackground() {
  if (nantouBg.complete && nantouBg.naturalWidth) {
    ctx.drawImage(nantouBg, 0, 0, W, H);
  } else {
    ctx.fillStyle = "#e7a452";
    ctx.fillRect(0, 0, W, H);
  }
}

function drawQianhaiBackground() {
  if (qianhaiBg.complete && qianhaiBg.naturalWidth) {
    ctx.drawImage(qianhaiBg, 0, 0, W, H);
  } else {
    ctx.fillStyle = "#81d6e5";
    ctx.fillRect(0, 0, W, H);
  }
}

function drawShenzhongBackground() {
  if (shenzhongBg.complete && shenzhongBg.naturalWidth) {
    ctx.drawImage(shenzhongBg, 0, 0, W, H);
  } else {
    ctx.fillStyle = "#553366";
    ctx.fillRect(0, 0, W, H);
  }
}

function draw() {
  canvas.dataset.state = mode;
  if (mode === "metromap") {
    if (metroMapImg.complete && metroMapImg.naturalWidth) {
      ctx.drawImage(metroMapImg, 0, 0, W, H);
    } else {
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#fff";
      ctx.font = "24px monospace";
      ctx.textAlign = "center";
      ctx.fillText("加载深圳地铁图...", W / 2, H / 2);
    }
    return;
  }
  if (mode === "intro") {
    if (nantouIntroImg.complete && nantouIntroImg.naturalWidth) {
      ctx.drawImage(nantouIntroImg, 0, 0, W, H);
    } else {
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#fff";
      ctx.font = "24px monospace";
      ctx.textAlign = "center";
      ctx.fillText("加载南头古城...", W / 2, H / 2);
    }
    return;
  }
  ctx.save();
  const sx = shake ? (rng() - .5) * shake : 0;
  const sy = shake ? (rng() - .5) * shake : 0;
  ctx.translate(sx, sy);

  drawCityBackground();

  drawPlayfieldFrame();
  drawFunElements();
  for (const block of blocks) drawBlock(block);
  if (mode === "aim" || dragging) drawAim();
  for (const p of projectiles) drawProjectile(p);
  drawLauncher();
  drawEffects();
  ctx.restore();
}

function drawPlayfieldFrame() {
  ctx.save();
  ctx.strokeStyle = "rgba(7,20,46,.72)";
  ctx.lineWidth = 3;
  ctx.setLineDash([13, 11]);
  ctx.beginPath();
  ctx.moveTo(WALL_L, 550);
  ctx.lineTo(WALL_R, 550);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "rgba(255,247,232,.87)";
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 2;
  ctx.fillRect(82, 109, 145, 31);
  ctx.strokeRect(82, 109, 145, 31);
  ctx.fillStyle = COLORS.coral;
  ctx.font = "900 14px 'Courier New', monospace";
  ctx.fillText("航道封锁线 ↓", 105, 130);
  ctx.restore();
}

function drawFunElements() {
  const pulse = lastTime / 220;
  for (const pickup of pickups) {
    if (!pickup.alive) continue;
    ctx.save();
    ctx.translate(pickup.x, pickup.y + Math.sin(pulse + pickup.phase) * 5);
    ctx.rotate(pulse * .16 + pickup.phase);
    ctx.fillStyle = "rgba(255,209,102,.25)";
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, pickup.r + 9 + Math.sin(pulse + pickup.phase) * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = COLORS.paper;
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -pickup.r);
    ctx.lineTo(5, -5);
    ctx.lineTo(pickup.r, 0);
    ctx.lineTo(5, 5);
    ctx.lineTo(0, pickup.r);
    ctx.lineTo(-5, 5);
    ctx.lineTo(-pickup.r, 0);
    ctx.lineTo(-5, -5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = COLORS.cobalt;
    ctx.fillRect(-4, -4, 8, 8);
    ctx.restore();
  }

  for (const gate of gates) {
    ctx.save();
    ctx.translate(gate.x, gate.y);
    ctx.rotate(pulse * .12 + gate.phase);
    ctx.fillStyle = "rgba(255,250,241,.7)";
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 4;
    ctx.fillRect(-25, -25, 50, 50);
    ctx.strokeRect(-25, -25, 50, 50);
    ctx.fillStyle = gate.color;
    ctx.fillRect(-17, -17, 34, 34);
    ctx.strokeRect(-17, -17, 34, 34);
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(-6, -6, 12, 12);
    ctx.restore();
  }

  if (courier?.active) drawCourier();
}

function drawCourier() {
  const bob = Math.sin(lastTime / 120) * 4;
  ctx.save();
  ctx.translate(courier.x, courier.y + bob);
  if (courier.vx < 0) ctx.scale(-1, 1);
  ctx.fillStyle = COLORS.paper;
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 3;
  ctx.fillRect(-27, -16, 54, 32);
  ctx.strokeRect(-27, -16, 54, 32);
  ctx.beginPath();
  ctx.moveTo(-27, -15);
  ctx.lineTo(0, 5);
  ctx.lineTo(27, -15);
  ctx.stroke();
  ctx.fillStyle = COLORS.coral;
  ctx.fillRect(9, 3, 10, 10);
  ctx.fillStyle = COLORS.paper;
  ctx.strokeStyle = COLORS.cobalt;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-30, -7);
  ctx.lineTo(-46, -17 - bob);
  ctx.lineTo(-39, 1);
  ctx.moveTo(30, -7);
  ctx.lineTo(46, -17 + bob);
  ctx.lineTo(39, 1);
  ctx.stroke();
  ctx.restore();
}

function drawMetroBlock(b) {
  const oldTown = ["PS", "AI", "DOC", "XLS", "PPT", "AE"];
  const drinks = ["VOLT", "WAVE", "BOOST", "POP", "MAX", "GO"];
  const index = Math.abs((b.id.length + (b.variant || 0) * 3)) % oldTown.length;
  const label = level === 1 ? oldTown[index] : level === 2 ? drinks[index] : (index % 2 ? drinks[index] : oldTown[index]);
  const palettes = level === 1
    ? ["#df4d43", "#f08a35", "#8d61bd", "#328ac3", "#49a86c", "#ca405b"]
    : level === 2
      ? ["#37bed0", "#ffcc4c", "#f76b52", "#8ad85d", "#4e8ee8", "#ef7fb0"]
      : ["#9b78ee", "#ff7a45", "#4fc0cf", "#e95a78", "#668ee8", "#f1bd4e"];
  let fill = palettes[index];
  if (b.kind === "armor") fill = "#aab7c9";
  if (b.kind === "stone") fill = "#746f86";
  if (b.kind === "boost") fill = COLORS.cobalt;
  if (b.kind === "loot") fill = COLORS.gold;
  ctx.fillStyle = COLORS.ink; ctx.fillRect(-5, -6, b.w + 10, b.h + 12);
  ctx.fillStyle = fill; ctx.fillRect(0, 0, b.w, b.h);
  ctx.fillStyle = "rgba(255,255,255,.45)"; ctx.fillRect(8, 7, b.w - 16, 7);
  ctx.fillStyle = "rgba(7,20,46,.28)"; ctx.fillRect(8, b.h - 14, b.w - 16, 7);
  ctx.fillStyle = COLORS.ink; ctx.fillRect(8, 8, 5, 5); ctx.fillRect(b.w - 13, 8, 5, 5);
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = b.kind === "boost" ? "#fff" : COLORS.ink;
  ctx.font = "950 15px 'Courier New', monospace";
  ctx.fillText(b.kind === "loot" ? "SKILL" : b.kind === "armor" ? "ARM" : label, b.w / 2, b.h / 2 - 2);
  const damageRatio = 1 - Math.max(0, b.hp) / b.maxHp;
  if (damageRatio > .28) {
    ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 3; ctx.beginPath();
    ctx.moveTo(b.w * .48, 9); ctx.lineTo(b.w * .42, b.h * .42); ctx.lineTo(b.w * .56, b.h * .58); ctx.lineTo(b.w * .47, b.h - 7);
    if (damageRatio > .62) { ctx.moveTo(b.w * .42, b.h * .42); ctx.lineTo(b.w * .22, b.h * .58); ctx.moveTo(b.w * .56, b.h * .58); ctx.lineTo(b.w * .78, b.h * .38); }
    ctx.stroke();
  }
}

function drawBlock(b) {
  ctx.save();
  const isLoot = b.kind === "loot";
  const pulse = isLoot ? 1 + Math.sin(lastTime / 105 + b.pulse) * .035 : 1;
  ctx.translate(b.x + b.w / 2, b.y + b.h / 2);
  ctx.scale(pulse, pulse);
  ctx.translate(-b.w / 2, -b.h / 2);

  if (isLoot) {
    ctx.globalAlpha = .55 + Math.sin(lastTime / 120 + b.pulse) * .15;
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 4;
    ctx.strokeRect(-6, -7, b.w + 12, b.h + 14);
    ctx.globalAlpha = .2;
    ctx.lineWidth = 3;
    ctx.strokeRect(-11, -12, b.w + 22, b.h + 24);
    ctx.globalAlpha = 1;
  }

  const atlas = cleanedBlockAtlas || (blockAtlasImage.complete ? blockAtlasImage : null);
  if (atlas) {
    const kindIndex = b.kind === "creature"
      ? Math.max(0, Math.min(2, b.variant || 0))
      : ({ stone: 3, crate: 4, boost: 5, loot: 6, armor: 7 }[b.kind] ?? 4);
    const cellWidth = atlas.width / 4;
    const cellHeight = atlas.height / 2;
    const sourceX = (kindIndex % 4) * cellWidth;
    const sourceY = Math.floor(kindIndex / 4) * cellHeight;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(atlas, sourceX, sourceY, cellWidth, cellHeight, -6, -15, b.w + 12, b.h + 22);
  } else {
    ctx.fillStyle = b.kind === "loot" ? COLORS.gold : b.kind === "boost" ? COLORS.cobalt : COLORS.coral;
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 3;
    ctx.fillRect(0, 0, b.w, b.h);
    ctx.strokeRect(0, 0, b.w, b.h);
  }

  const hp = Math.max(0, Math.ceil(b.hp));
  ctx.textAlign = "center";
  ctx.font = "950 23px 'Courier New', monospace";
  ctx.lineWidth = 6;
  ctx.strokeStyle = COLORS.ink;
  ctx.strokeText(String(hp), b.w / 2, b.h - 4);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(String(hp), b.w / 2, b.h - 4);

  if (isLoot) {
    ctx.fillStyle = COLORS.coral;
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2;
    ctx.fillRect(5, -8, 44, 18);
    ctx.strokeRect(5, -8, 44, 18);
    ctx.fillStyle = "#ffffff";
    ctx.font = "950 10px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.fillText("技能箱", 27, 5);
  }

  if (b.hp / b.maxHp < .5) {
    // 残血裂纹：深色斜线代替亮红整框描边，避免与背景红元素混淆
    ctx.strokeStyle = "rgba(7,20,46,.65)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(b.w * .18, 3);
    ctx.lineTo(b.w * .38, b.h * .45);
    ctx.lineTo(b.w * .3, b.h - 4);
    ctx.moveTo(b.w * .68, 5);
    ctx.lineTo(b.w * .55, b.h * .5);
    ctx.lineTo(b.w * .72, b.h - 6);
    ctx.moveTo(b.w * .45, b.h * .25);
    ctx.lineTo(b.w * .58, b.h * .55);
    ctx.stroke();
  }
  // 绘制随机办公图标（像素化处理：缩小 + 上移避开底部HP数字 + 降透明度融入方块）
  if (b.iconIndex >= 0 && b.iconIndex < pixelIcons.length && pixelIcons[b.iconIndex].complete && pixelIcons[b.iconIndex].naturalWidth > 0) {
    const icon = pixelIcons[b.iconIndex];
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    // 图标尺寸取方块高度的 42%，避免压到底部 HP 数字（数字基线在 b.h - 4）
    const iconSize = Math.round(b.h * 0.42);
    const ix = Math.round((b.w - iconSize) / 2);
    const iy = Math.round(b.h * 0.16);
    // 先画深色底衬，让图标在任何方块底色上都有像素边框感
    ctx.globalAlpha = 0.32;
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(ix - 2, iy - 2, iconSize + 4, iconSize + 4);
    // 图标本体降透明度，弱化现代矢量风格与像素方块的冲突
    ctx.globalAlpha = 0.72;
    ctx.drawImage(icon, ix, iy, iconSize, iconSize);
    ctx.restore();
  }
  ctx.restore();
}

function drawAim() {
  ctx.save();
  const segments = traceAimPath(900);
  ctx.lineCap = "square";
  ctx.setLineDash([13, 13]);
  ctx.lineDashOffset = -(lastTime / 18) % 26;
  for (const segment of segments) {
    ctx.beginPath();
    ctx.moveTo(segment.x1, segment.y1);
    ctx.lineTo(segment.x2, segment.y2);
    ctx.strokeStyle = "rgba(18,59,238,.26)";
    ctx.lineWidth = 15;
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.98)";
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.strokeStyle = "rgba(105,199,255,.95)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.setLineDash([]);
  for (let i = 0; i < segments.length - 1; i++) {
    const point = segments[i];
    ctx.fillStyle = "rgba(255,255,255,.9)";
    ctx.strokeStyle = COLORS.cobalt;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(point.x2, point.y2, 10 + Math.sin(lastTime / 110 + i) * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    drawAimArrow(point.x2, point.y2, point.dx, point.dy, COLORS.cobalt, 11);
  }
  const final = segments.at(-1);
  drawAimArrow(final.x2, final.y2, final.dx, final.dy, COLORS.coral, 15);

  if (pointer.visible) {
    ctx.translate(pointer.x, pointer.y);
    ctx.rotate(lastTime / 450);
    ctx.fillStyle = "rgba(255,250,241,.94)";
    ctx.strokeStyle = COLORS.cobalt;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.rotate(-lastTime / 450);
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(-2, -19, 4, 10);
    ctx.fillRect(-2, 9, 4, 10);
    ctx.fillRect(-19, -2, 10, 4);
    ctx.fillRect(9, -2, 10, 4);
    ctx.fillStyle = COLORS.coral;
    ctx.fillRect(-5, -5, 10, 10);
  }
  ctx.restore();
}

function traceAimPath(maxDistance) {
  const segments = [];
  let x = LAUNCH.x;
  let y = LAUNCH.y;
  let dx = aim.x;
  let dy = aim.y;
  let remaining = maxDistance;
  for (let bounce = 0; bounce < 4 && remaining > 1; bounce++) {
    const tx = dx > 0 ? (WALL_R - x) / dx : dx < 0 ? (WALL_L - x) / dx : Infinity;
    const ty = dy > 0 ? (FLOOR - y) / dy : dy < 0 ? (CEILING - y) / dy : Infinity;
    const travel = Math.min(remaining, tx > 0 ? tx : Infinity, ty > 0 ? ty : Infinity);
    const endX = x + dx * travel;
    const endY = y + dy * travel;
    segments.push({ x1: x, y1: y, x2: endX, y2: endY, dx, dy });
    remaining -= travel;
    if (travel >= Math.min(tx, ty) - .01 && remaining > 1) {
      if (tx < ty) dx *= -1;
      else dy *= -1;
      x = endX + dx * .5;
      y = endY + dy * .5;
    } else break;
  }
  return segments;
}

function drawAimArrow(x, y, dx, dy, color, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.atan2(dy, dx) + Math.PI / 2);
  ctx.fillStyle = color;
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * .8, size * .55);
  ctx.lineTo(0, 3);
  ctx.lineTo(-size * .8, size * .55);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawProjectile(p) {
  const color = p.character === 0 ? COLORS.cobalt : p.character === 1 ? COLORS.coral : COLORS.mint;
  ctx.save();
  if (p.trail.length > 1) {
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    for (const point of p.trail) ctx.lineTo(point.x, point.y);
    ctx.globalAlpha = .24;
    ctx.strokeStyle = COLORS.cobalt;
    ctx.lineWidth = p.r * 2.5;
    ctx.stroke();
    ctx.globalAlpha = .76;
    ctx.strokeStyle = color;
    ctx.lineWidth = 10;
    ctx.stroke();
    ctx.globalAlpha = .94;
    ctx.strokeStyle = "#dff5ff";
    ctx.lineWidth = 3;
    ctx.stroke();
    for (const index of [5, 10, 15]) {
      const ghost = p.trail[index];
      if (!ghost) continue;
      ctx.globalAlpha = Math.max(.08, .34 - index * .015);
      drawCharacterSprite(p.character, 1, ghost.x - 18, ghost.y - 18, 36, 36);
    }
  }

  ctx.globalAlpha = .24;
  ctx.strokeStyle = color;
  ctx.lineWidth = p.r * 2.5;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r + 6 + Math.sin(p.age * 18) * 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(255,250,241,.86)";
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r + 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  const spriteSize = p.character === 1 ? 50 : 46;
  drawCharacterSprite(p.character, 1, p.x - spriteSize / 2, p.y - spriteSize / 2, spriteSize, spriteSize);
  ctx.fillStyle = COLORS.paper;
  for (let i = 0; i < 3; i++) {
    const phase = p.age * 12 + i * 2.1;
    const sparkle = 3 + (i % 2) * 2;
    ctx.globalAlpha = .45 + .3 * Math.sin(phase);
    ctx.fillRect(p.x + Math.cos(phase) * 25 - sparkle / 2, p.y + Math.sin(phase) * 25 - sparkle / 2, sparkle, sparkle);
  }
  ctx.restore();
}

function drawCharacterSprite(row, col, x, y, w, h) {
  const source = cleanedSprites || (spriteImage.complete ? spriteImage : null);
  if (!source) {
    ctx.fillStyle = row === 0 ? COLORS.cobalt : row === 1 ? COLORS.coral : COLORS.mint;
    ctx.fillRect(x, y, w, h);
    return;
  }
  const sw = source.width / 4;
  const sh = source.height / 3;
  ctx.drawImage(source, col * sw, row * sh, sw, sh, x - w * .18, y - h * .2, w * 1.36, h * 1.36);
}

function drawLauncher() {
  ctx.save();
  ctx.translate(LAUNCH.x, LAUNCH.y);
  ctx.fillStyle = "rgba(255,247,232,.94)";
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-128, 12);
  ctx.lineTo(-112, -18);
  ctx.lineTo(108, -18);
  ctx.lineTo(128, 12);
  ctx.lineTo(108, 25);
  ctx.lineTo(-112, 25);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "rgba(7,20,46,.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-76, -4);
  ctx.lineTo(70, -4);
  ctx.moveTo(-38, 12);
  ctx.lineTo(90, 12);
  ctx.stroke();

  if (mode === "aim" || mode === "paused" || mode === "menu" || dragging) {
    const bob = Math.sin(lastTime / 260) * 2;
    drawCharacterSprite(0, 0, -92, -90 + bob, 70, 84);
    drawCharacterSprite(1, 0, -35, -94 - bob, 74, 88);
    drawCharacterSprite(2, 0, 30, -90 + bob, 70, 84);
    ctx.fillStyle = COLORS.cobalt;
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -112 + bob);
    ctx.lineTo(10, -98 + bob);
    ctx.lineTo(-10, -98 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = COLORS.cobalt;
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 2;
  ctx.fillRect(-9, -25, 18, 24);
  ctx.strokeRect(-9, -25, 18, 24);
  ctx.restore();
}

function drawEffects() {
  for (const wave of shockwaves) {
    ctx.globalAlpha = Math.max(0, wave.life / wave.maxLife);
    ctx.strokeStyle = wave.color;
    ctx.lineWidth = 3 + (wave.life / wave.maxLife) * 4;
    ctx.beginPath();
    ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const p of particles) {
    ctx.globalAlpha = Math.min(1, p.life * 3);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = "center";
  ctx.font = "950 16px 'Courier New', monospace";
  for (const f of floaters) {
    ctx.globalAlpha = Math.min(1, f.life * 2.5);
    ctx.lineWidth = 4;
    ctx.strokeStyle = COLORS.ink;
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
  if (screenFlash > 0) {
    ctx.fillStyle = `rgba(255,250,241,${screenFlash})`;
    ctx.fillRect(0, 0, W, H);
  }
}

function loop(time) {
  const dt = Math.min(0.033, (time - lastTime) / 1000 || 0);
  lastTime = time;
  fpsFrames++;
  if (time - fpsWindowStart >= 1000) {
    canvas.dataset.fps = String(Math.round(fpsFrames * 1000 / (time - fpsWindowStart)));
    fpsFrames = 0;
    fpsWindowStart = time;
  }
  canvas.dataset.state = mode;
  canvas.dataset.level = String(level);
  canvas.dataset.blocks = String(blocks.length);
  canvas.dataset.aim = `${aim.x.toFixed(3)},${aim.y.toFixed(3)}`;
  canvas.dataset.pickups = String(pickups.filter(item => item.alive).length);
  canvas.dataset.gates = String(gates.length);
  canvas.dataset.pendingLoot = String(pendingLoot);
  canvas.dataset.learnedSkills = String(Object.values(learnedSkills).filter(value => value > 0).length);
  update(dt, time / 1000);
  draw();
  requestAnimationFrame(loop);
}

document.querySelector("#startBtn").addEventListener("click", async () => {
  initAudio();
  await audio?.resume?.();
  ui.start.classList.remove("open");
  if (!metroMapShown) {
    showMetroMap();
    return;
  }
  showRoutePage();
});

document.querySelector("#routeStartBtn").addEventListener("click", () => {
  startCurrentRoute();
});

document.querySelector("#pauseBtn").addEventListener("click", () => {
  if (mode === "menu" || mode === "upgrade" || mode === "skill" || mode === "departure" || mode === "ended") return;
  mode = "paused";
  ui.pause.classList.add("open");
});

document.querySelector("#resumeBtn").addEventListener("click", () => {
  mode = projectiles.length || launchQueue.length ? "firing" : "aim";
  ui.pause.classList.remove("open");
});

document.querySelector("#restartBtn").addEventListener("click", () => {
  ui.pause.classList.remove("open");
  routeProgress = 1;
  journeyStarted = false;
  metroMapShown = false;
  document.querySelector("#game-shell").classList.remove("cinematic");
  document.querySelector("#game-shell").style.visibility = "hidden";
  showRoutePage();
});

document.querySelector("#againBtn").addEventListener("click", () => {
  ui.end.classList.remove("open");
  document.querySelector("#game-shell").style.visibility = "hidden";
  if (lastRunWon) {
    routeProgress = 1;
    journeyStarted = false;
  } else {
    lives = 3;
    combo = 0;
    pendingLoot = 0;
    projectiles = [];
    launchQueue = [];
    blocks = [];
    updateHud();
    showToast(`体力已恢复 · 从${ROUTE_STOPS[Math.min(routeProgress, ROUTE_STOPS.length) - 1].name}重新挑战`);
  }
  showRoutePage();
});

document.querySelector("#skillDetailClose").addEventListener("click", closeSkillDetail);

const skillRackElement = document.querySelector(".skill-rack");
const skillRackToggle = document.querySelector("#skillRackToggle");
skillRackToggle.addEventListener("click", () => {
  const collapsed = skillRackElement.classList.toggle("collapsed");
  skillRackToggle.setAttribute("aria-expanded", String(!collapsed));
  skillRackToggle.setAttribute("aria-label", collapsed ? "展开技能面板" : "收起技能面板");
  if (collapsed) closeSkillDetail();
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && (mode === "aim" || mode === "firing")) {
    mode = "paused";
    ui.pause.classList.add("open");
  }
});

window.addEventListener("keydown", eventLike => {
  if (eventLike.key === "Escape" && !ui.skillDetail.hidden) {
    closeSkillDetail();
    return;
  }
  if (eventLike.key === "Escape" && mode === "paused") document.querySelector("#resumeBtn").click();
  if ((eventLike.key === " " || eventLike.key === "Enter") && mode === "aim") startVolley();
});

window.__PIXEL_VOYAGE__ = {
  snapshot: () => ({ mode, level, lives, compass, routeProgress, blocks: blocks.length, projectiles: projectiles.length, stats: { ...stats } }),
  aimAt: (x, y) => { if (mode === "aim") { updateAim({ x, y }); startVolley(); } },
  completeLevel: () => { if (mode === "aim") { blocks.length = 0; levelCleared(); } },
};

const qaCompleteButton = document.querySelector("#qaCompleteBtn");
if (new URLSearchParams(window.location.search).has("qa")) { document.body.classList.add("qa-mode"); qaCompleteButton.hidden = false; }
qaCompleteButton.addEventListener("click", () => { if (mode === "aim") { blocks.length = 0; levelCleared(); } });


let loadingProgressValue = 0;
function setLoadingProgress(value) {
  loadingProgressValue = Math.max(0, Math.min(100, Math.round(value)));
  document.querySelector("#loadingProgress").style.width = loadingProgressValue + "%";
  document.querySelector("#loadingPercent").textContent = loadingProgressValue + "%";
  if (loadingProgressValue < 100) return;
  document.querySelector("#loadingState").hidden = true;
  document.querySelector("#loadingReady").hidden = false;
  document.querySelector("#startBtn").hidden = false;
}

const loadingTimer = window.setInterval(() => {
  const step = loadingProgressValue < 62 ? 9 : loadingProgressValue < 90 ? 4 : 2;
  setLoadingProgress(loadingProgressValue + step);
  if (loadingProgressValue >= 100) window.clearInterval(loadingTimer);
}, 45);

renderSkillRack();
updateHud();
requestAnimationFrame(loop);
