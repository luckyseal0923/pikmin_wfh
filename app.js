const WANFANG = { lat: 24.99915, lng: 121.55878 };
const DEFAULT_GOOGLE_MAPS_API_KEY = "AIzaSyA9-_B7kw9s8q547i35TSaYR9ygDPTOWgk";
const MAP_LOAD_TIMEOUT_MS = 9000;

const quests = [
  {
    id: "hospital-gate",
    title: "萬芳醫院健康入口",
    type: "醫院任務",
    kind: "hospital",
    icon: "+",
    lat: 24.99915,
    lng: 121.55878,
    radius: 60,
    reward: "醫療芽苗",
    description: "抵達醫院周邊後，查看今日門診、交通與樓層導引。"
  },
  {
    id: "metro-start",
    title: "捷運萬芳醫院站起點",
    type: "交通任務",
    kind: "metro",
    icon: "M",
    lat: 24.99815,
    lng: 121.55803,
    radius: 50,
    reward: "通勤小隊員",
    description: "從捷運站出發，完成前往醫院入口的健康步行路線。"
  },
  {
    id: "xinglong-walk",
    title: "興隆公園飯後散步",
    type: "步行任務",
    kind: "park",
    icon: "P",
    lat: 25.00112,
    lng: 121.55618,
    radius: 80,
    reward: "綠葉能量",
    description: "在公園周邊累積 800 步，完成飯後散步提醒。"
  },
  {
    id: "pharmacy-supply",
    title: "社區藥局補給點",
    type: "照護任務",
    kind: "pharmacy",
    icon: "Rx",
    lat: 24.99763,
    lng: 121.5604,
    radius: 45,
    reward: "用藥徽章",
    description: "閱讀 30 秒用藥安全小卡，確認回家後的用藥提醒。"
  },
  {
    id: "community-care",
    title: "里民健康小站",
    type: "社區任務",
    kind: "community",
    icon: "C",
    lat: 25.00072,
    lng: 121.56116,
    radius: 70,
    reward: "社區連結",
    description: "解鎖附近健康講座、篩檢活動與長照資源。"
  },
  {
    id: "blood-pressure",
    title: "血壓紀錄提醒",
    type: "慢病任務",
    kind: "hospital",
    icon: "BP",
    lat: 24.99884,
    lng: 121.55742,
    radius: 55,
    reward: "穩定之星",
    description: "完成一次血壓紀錄，回診前累積自己的健康趨勢。"
  },
  {
    id: "nutrition-card",
    title: "健康餐盤小卡",
    type: "衛教任務",
    kind: "community",
    icon: "N",
    lat: 25.00003,
    lng: 121.55503,
    radius: 60,
    reward: "均衡徽章",
    description: "看完一張糖尿病與高血壓友善飲食小卡。"
  },
  {
    id: "return-visit",
    title: "回診前準備",
    type: "提醒任務",
    kind: "hospital",
    icon: "R",
    lat: 24.99972,
    lng: 121.55938,
    radius: 50,
    reward: "準備完成",
    description: "確認健保卡、藥袋、量測紀錄與檢查注意事項。"
  },
  {
    id: "tmu-campus-sprout",
    title: "北醫校園芽芽",
    type: "北醫測試任務",
    kind: "park",
    icon: "芽",
    lat: 25.02662,
    lng: 121.56271,
    radius: 90,
    reward: "校園芽怪",
    description: "走近臺北醫學大學校園中心，測試即時定位與怪物收服。"
  },
  {
    id: "tmu-hospital-helper",
    title: "附醫守護怪",
    type: "北醫測試任務",
    kind: "hospital",
    icon: "護",
    lat: 25.02686,
    lng: 121.56234,
    radius: 90,
    reward: "守護夥伴",
    description: "靠近北醫附設醫院一側，完成測試後收服守護怪。"
  },
  {
    id: "tmu-wuxing-runner",
    title: "吳興疾走怪",
    type: "北醫測試任務",
    kind: "metro",
    icon: "走",
    lat: 25.02627,
    lng: 121.56225,
    radius: 90,
    reward: "疾走夥伴",
    description: "沿吳興街方向走動，觀察人物與怪物隊伍是否平滑跟隨。"
  },
  {
    id: "tmu-nutrition-buddy",
    title: "北醫餐盤怪",
    type: "北醫測試任務",
    kind: "community",
    icon: "餐",
    lat: 25.02632,
    lng: 121.56312,
    radius: 90,
    reward: "營養夥伴",
    description: "走到校園東側附近，完成健康餐盤測試並收服餐盤怪。"
  },
  {
    id: "tmu-teaching-building-scout",
    title: "教學大樓探路怪",
    type: "北醫測試任務",
    kind: "pharmacy",
    icon: "探",
    lat: 25.02535,
    lng: 121.56172,
    radius: 100,
    reward: "探路夥伴",
    description: "在教學大樓與醫技系大樓附近出現，測試截圖位置的靠近、收服與跟隨功能。"
  }
];

const storedCompleted = new Set(JSON.parse(localStorage.getItem("completedQuests") || "[]"));
const storedCollected = new Set(JSON.parse(localStorage.getItem("collectedMonsters") || "[]"));
storedCompleted.forEach((id) => storedCollected.add(id));
const storedTeam = JSON.parse(localStorage.getItem("activeMonsterTeam") || "[]")
  .filter((id) => storedCollected.has(id))
  .slice(0, 3);
if (!storedTeam.length) storedTeam.push(...[...storedCollected].slice(0, 3));

const state = {
  selectedId: quests[0].id,
  completed: storedCompleted,
  collected: storedCollected,
  activeTeam: storedTeam,
  walkedMeters: Number(localStorage.getItem("walkedMeters") || "0"),
  map: null,
  mapLoaded: false,
  mapLoadTimer: null,
  mapsScriptLoading: false,
  supabaseClient: null,
  supabaseUserId: null,
  syncReady: false,
  supportsCollectionSync: true,
  syncStatus: "本機保存",
  syncTimer: null,
  captureTimer: null,
  markers: new Map(),
  userMarker: null,
  user3DCharacter: null,
  user3DLoading: false,
  followerMarkers: new Map(),
  displayedPosition: null,
  markerAnimationFrame: null,
  lastPositionTimestamp: null,
  visualTrail: [],
  lastVisualTrailAt: 0,
  heading: 0,
  cameraHeading: 0,
  lastCameraUpdateAt: 0,
  speedMetersPerSecond: 0,
  followMode: true,
  wakeLock: null,
  accuracyCircle: null,
  userPath: null,
  userTrail: [],
  lastPosition: null,
  lastAccuracy: null,
  simulationIndex: 0,
  watchId: null
};

const FOLLOW_CAMERA = {
  zoom: 18.5,
  tilt: 55,
  lookAheadMeters: 55,
  updateIntervalMs: 80
};

const els = {
  apiKey: document.querySelector("#apiKey"),
  completeButton: document.querySelector("#completeButton"),
  completedCount: document.querySelector("#completedCount"),
  keyForm: document.querySelector("#keyForm"),
  keyStatus: document.querySelector("#keyStatus"),
  mapError: document.querySelector("#mapError"),
  cardToggle: document.querySelector("#cardToggle"),
  cardToggleText: document.querySelector("#cardToggleText"),
  followButton: document.querySelector("#followButton"),
  locateButton: document.querySelector("#locateButton"),
  locationStatus: document.querySelector("#locationStatus"),
  map: document.querySelector("#map"),
  mockMap: document.querySelector("#mockMap"),
  nearestQuest: document.querySelector("#nearestQuest"),
  navigationStatus: document.querySelector("#navigationStatus"),
  progressMeter: document.querySelector("#progressMeter"),
  questDescription: document.querySelector("#questDescription"),
  questBody: document.querySelector("#questBody"),
  questCard: document.querySelector("#questCard"),
  questDistance: document.querySelector("#questDistance"),
  questList: document.querySelector("#questList"),
  questRadius: document.querySelector("#questRadius"),
  questReward: document.querySelector("#questReward"),
  questTitle: document.querySelector("#questTitle"),
  questType: document.querySelector("#questType"),
  simulateButton: document.querySelector("#simulateButton"),
  stepCount: document.querySelector("#stepCount"),
  distanceCount: document.querySelector("#distanceCount"),
  syncStatus: document.querySelector("#syncStatus"),
  totalQuestCount: document.querySelector("#totalQuestCount"),
  trackButton: document.querySelector("#trackButton"),
  teamButton: document.querySelector("#teamButton"),
  teamPanel: document.querySelector("#teamPanel"),
  teamCount: document.querySelector("#teamCount"),
  closeTeamButton: document.querySelector("#closeTeamButton"),
  collectionHint: document.querySelector("#collectionHint"),
  collectionList: document.querySelector("#collectionList"),
  captureToast: document.querySelector("#captureToast"),
  captureToastImage: document.querySelector("#captureToastImage"),
  captureToastTitle: document.querySelector("#captureToastTitle"),
  captureToastText: document.querySelector("#captureToastText")
};

function setCardCollapsed(collapsed) {
  els.questCard.classList.toggle("is-collapsed", collapsed);
  els.cardToggle.setAttribute("aria-expanded", String(!collapsed));
  els.cardToggleText.textContent = collapsed ? "展開任務卡" : "收合任務卡";
}

function setTeamPanel(open) {
  els.teamPanel.hidden = !open;
  els.teamButton.setAttribute("aria-expanded", String(open));
  els.teamButton.classList.toggle("is-active", open);
}

function saveMonsterProgress() {
  localStorage.setItem("collectedMonsters", JSON.stringify([...state.collected]));
  localStorage.setItem("activeMonsterTeam", JSON.stringify(state.activeTeam));
  queueCloudSync();
}

function showCaptureToast(quest, joinedTeam) {
  window.clearTimeout(state.captureTimer);
  els.captureToastImage.src = monsterDataUrl(quest);
  els.captureToastImage.alt = quest.title;
  els.captureToastTitle.textContent = `收服 ${quest.title}！`;
  els.captureToastText.textContent = joinedTeam ? "已自動加入探索隊伍" : "已加入怪物圖鑑";
  els.captureToast.hidden = false;
  requestAnimationFrame(() => els.captureToast.classList.add("is-visible"));
  state.captureTimer = window.setTimeout(() => {
    els.captureToast.classList.remove("is-visible");
    window.setTimeout(() => { els.captureToast.hidden = true; }, 180);
  }, 3200);
}

function toggleTeamMember(id) {
  const index = state.activeTeam.indexOf(id);
  if (index >= 0) {
    state.activeTeam.splice(index, 1);
  } else if (state.activeTeam.length < 3) {
    state.activeTeam.push(id);
  } else {
    els.collectionHint.textContent = "隊伍最多 3 隻，先讓一隻休息再加入。";
    return;
  }
  saveMonsterProgress();
  renderCollection();
  syncFollowerMarkers();
}

function renderCollection() {
  els.teamCount.textContent = `${state.activeTeam.length} / 3`;
  els.collectionList.innerHTML = "";
  const collectedQuests = quests.filter((quest) => state.collected.has(quest.id));
  els.collectionHint.textContent = collectedQuests.length
    ? "點一下怪物即可加入或退出隊伍，隊伍最多 3 隻。"
    : "完成任務後，就能收服該地點的怪物。";

  if (!collectedQuests.length) {
    const empty = document.createElement("p");
    empty.className = "collection-empty";
    empty.textContent = "還沒有夥伴，先去完成第一個任務吧。";
    els.collectionList.appendChild(empty);
    return;
  }

  collectedQuests.forEach((quest) => {
    const active = state.activeTeam.includes(quest.id);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "collection-item";
    button.classList.toggle("is-active", active);
    button.innerHTML = `
      <img src="${monsterDataUrl(quest)}" alt="">
      <span><strong>${quest.title}</strong><small>${active ? "隊伍中" : "點擊加入"}</small></span>
      <b aria-hidden="true">${active ? "✓" : "+"}</b>
    `;
    button.addEventListener("click", () => toggleTeamMember(quest.id));
    els.collectionList.appendChild(button);
  });
}

function renderQuestList() {
  els.questList.innerHTML = "";
  quests.forEach((quest) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "quest-item";
    item.classList.toggle("is-active", quest.id === state.selectedId);
    item.classList.toggle("is-done", state.completed.has(quest.id));
    item.innerHTML = `
      <span class="quest-icon">${quest.icon}</span>
      <span>
        <h3>${state.completed.has(quest.id) ? "已完成｜" : ""}${quest.title}</h3>
        <p>${quest.type} · ${quest.radius}m · ${quest.reward}</p>
      </span>
    `;
    item.addEventListener("click", () => selectQuest(quest.id, true));
    els.questList.appendChild(item);
  });
}

function renderQuestCard() {
  const quest = quests.find((item) => item.id === state.selectedId) || quests[0];
  const distance = state.lastPosition ? distanceMeters(state.lastPosition, quest) : null;
  const isNear = distance !== null && distance <= quest.radius;
  els.questType.textContent = quest.type;
  els.questTitle.textContent = quest.title;
  els.questDescription.textContent = quest.description;
  els.questRadius.textContent = `觸發 ${quest.radius}m`;
  els.questReward.textContent = `獎勵 ${quest.reward}`;
  els.questDistance.textContent = distance === null ? "距離未知" : `距離 ${Math.round(distance)}m`;
  els.completeButton.textContent = state.completed.has(quest.id) ? "取消完成" : "完成任務";
  els.completeButton.disabled = !state.completed.has(quest.id) && !isNear;
}

function renderProgress() {
  els.completedCount.textContent = state.completed.size;
  els.totalQuestCount.textContent = `/ ${quests.length} 完成`;
  els.progressMeter.max = quests.length;
  els.progressMeter.value = state.completed.size;
  els.stepCount.textContent = `${Math.round(state.walkedMeters / 0.75)} 步`;
  els.distanceCount.textContent = `${Math.round(state.walkedMeters)} m`;
  const nearest = nearestQuest();
  els.nearestQuest.textContent = nearest ? `最近：${nearest.quest.title} ${Math.round(nearest.distance)}m` : "尚未定位";
  els.syncStatus.textContent = state.syncStatus;
  if (state.watchId === null) {
    els.navigationStatus.textContent = "尚未導航";
  } else {
    const speedKmh = Math.max(0, state.speedMetersPerSecond * 3.6);
    els.navigationStatus.textContent = `${state.followMode ? "跟隨中" : "自由查看"} · ${speedKmh.toFixed(1)} km/h`;
  }
}

function renderAll() {
  renderQuestCard();
  renderQuestList();
  renderProgress();
}

function renderMockMarkers() {
  quests.forEach((quest, index) => {
    const marker = document.createElement("button");
    marker.type = "button";
    marker.className = "mock-marker";
    marker.dataset.kind = quest.kind;
    marker.title = quest.title;
    marker.style.left = `${28 + (index % 4) * 16}%`;
    marker.style.top = `${32 + Math.floor(index / 4) * 22 + (index % 2) * 8}%`;
    const img = document.createElement("img");
    img.alt = quest.title;
    img.src = monsterDataUrl(quest);
    marker.appendChild(img);
    marker.addEventListener("click", () => selectQuest(quest.id, false));
    els.mockMap.appendChild(marker);
  });
}

function selectQuest(id, shouldPan) {
  state.selectedId = id;
  const quest = quests.find((item) => item.id === id);
  renderAll();
  if (state.map && quest && shouldPan) {
    state.map.panTo({ lat: quest.lat, lng: quest.lng });
    state.map.setZoom(Math.max(state.map.getZoom(), 17));
  }
}

function saveCompleted() {
  localStorage.setItem("completedQuests", JSON.stringify([...state.completed]));
  queueCloudSync();
}

function saveWalkedMeters() {
  localStorage.setItem("walkedMeters", String(state.walkedMeters));
  queueCloudSync();
}

function setSyncStatus(message) {
  state.syncStatus = message;
  if (els.syncStatus) els.syncStatus.textContent = message;
}

function statePayload() {
  const payload = {
    user_id: state.supabaseUserId,
    completed_quest_ids: [...state.completed],
    walked_meters: state.walkedMeters,
    updated_at: new Date().toISOString()
  };
  if (state.supportsCollectionSync) {
    payload.collected_monster_ids = [...state.collected];
    payload.active_team_ids = state.activeTeam;
  }
  return payload;
}

function applyRemoteState(row) {
  if (!row) return;
  state.completed = new Set(row.completed_quest_ids || []);
  const remoteCollected = row.collected_monster_ids || row.completed_quest_ids || [];
  state.collected = new Set(remoteCollected);
  state.completed.forEach((id) => state.collected.add(id));
  state.activeTeam = (row.active_team_ids || state.activeTeam)
    .filter((id) => state.collected.has(id))
    .slice(0, 3);
  state.walkedMeters = Number(row.walked_meters || 0);
  localStorage.setItem("completedQuests", JSON.stringify([...state.completed]));
  localStorage.setItem("walkedMeters", String(state.walkedMeters));
  localStorage.setItem("collectedMonsters", JSON.stringify([...state.collected]));
  localStorage.setItem("activeMonsterTeam", JSON.stringify(state.activeTeam));
  renderAll();
  renderCollection();
  syncFollowerMarkers();
}

async function initSupabaseSync() {
  const config = window.WANFANG_SUPABASE;
  if (!config?.enabled || !config.url || !config.anonKey) {
    setSyncStatus("本機保存");
    return;
  }
  if (!window.supabase?.createClient) {
    setSyncStatus("雲端未載入");
    return;
  }

  try {
    setSyncStatus("連線中");
    state.supabaseClient = window.supabase.createClient(config.url, config.anonKey);

    let { data: sessionData } = await state.supabaseClient.auth.getSession();
    if (!sessionData.session) {
      const { data, error } = await state.supabaseClient.auth.signInAnonymously();
      if (error) throw error;
      sessionData = { session: data.session };
    }

    state.supabaseUserId = sessionData.session?.user?.id;
    if (!state.supabaseUserId) throw new Error("Supabase anonymous user missing.");

    let { data: remoteState, error: loadError } = await state.supabaseClient
      .from("player_states")
      .select("completed_quest_ids, collected_monster_ids, active_team_ids, walked_meters, updated_at")
      .eq("user_id", state.supabaseUserId)
      .maybeSingle();
    if (loadError && (loadError.code === "42703" || loadError.code === "PGRST204")) {
      state.supportsCollectionSync = false;
      ({ data: remoteState, error: loadError } = await state.supabaseClient
        .from("player_states")
        .select("completed_quest_ids, walked_meters, updated_at")
        .eq("user_id", state.supabaseUserId)
        .maybeSingle());
    }
    if (loadError) throw loadError;

    if (remoteState) {
      applyRemoteState(remoteState);
    } else {
      await syncCloudState();
    }

    state.syncReady = true;
    setSyncStatus(state.supportsCollectionSync ? "雲端同步" : "雲端待升級");
  } catch (error) {
    console.warn("Supabase sync disabled:", error);
    state.syncReady = false;
    setSyncStatus(error?.message?.includes("Anonymous sign-ins are disabled")
      ? "請開啟匿名登入"
      : "本機保存");
  }
}

function queueCloudSync() {
  if (!state.syncReady || !state.supabaseClient || !state.supabaseUserId) return;
  window.clearTimeout(state.syncTimer);
  state.syncTimer = window.setTimeout(syncCloudState, 500);
}

async function syncCloudState() {
  if (!state.supabaseClient || !state.supabaseUserId) return;
  try {
    setSyncStatus("同步中");
    let { error } = await state.supabaseClient
      .from("player_states")
      .upsert(statePayload(), { onConflict: "user_id" });
    if (error && state.supportsCollectionSync && (error.code === "42703" || error.code === "PGRST204")) {
      state.supportsCollectionSync = false;
      ({ error } = await state.supabaseClient
        .from("player_states")
        .upsert(statePayload(), { onConflict: "user_id" }));
    }
    if (error) throw error;
    state.syncReady = true;
    setSyncStatus(state.supportsCollectionSync ? "雲端同步" : "雲端待升級");
  } catch (error) {
    console.warn("Supabase sync failed:", error);
    setSyncStatus("同步失敗");
  }
}

function monsterSvg(quest, size = 68) {
  const colorByKind = {
    hospital: "#d96f64",
    metro: "#4e8fc7",
    park: "#3f8f66",
    pharmacy: "#f4b84f",
    community: "#6b7ec8"
  };
  const fill = colorByKind[quest.kind] || "#3f8f66";
  const labelColor = quest.kind === "pharmacy" ? "#4b3305" : "#ffffff";
  const accessory = quest.kind === "hospital"
    ? '<path d="M34 17h6v6h6v6h-6v6h-6v-6h-6v-6h6z" fill="#fff" opacity=".92"/>'
    : quest.kind === "park"
      ? '<path d="M35 7c8 0 13 3 15 9-7 2-14 0-19-5 1-3 2-4 4-4z" fill="#86d39a"/>'
      : quest.kind === "metro"
        ? '<path d="M24 18h28v14H24z" rx="4" fill="#fff" opacity=".88"/>'
        : "";
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 68 68">
      <ellipse cx="34" cy="61" rx="16" ry="4" fill="#26312b" opacity=".18"/>
      <path d="M34 10c-6 0-11 4-12 10" fill="none" stroke="#2f4b42" stroke-width="4" stroke-linecap="round"/>
      <circle cx="22" cy="19" r="4" fill="#f6cf57" stroke="#fff" stroke-width="2"/>
      <path d="M14 34c0-15 11-24 24-22 10 1 20 10 20 24 0 16-11 25-28 25-12 0-16-9-16-27z" fill="${fill}" stroke="#fff" stroke-width="4"/>
      <path d="M18 39c4 8 12 13 24 13 7 0 12-2 16-6-4 10-14 15-28 15-10 0-15-6-16-20z" fill="#26312b" opacity=".1"/>
      <circle cx="29" cy="34" r="5" fill="#fff"/>
      <circle cx="46" cy="34" r="5" fill="#fff"/>
      <circle cx="31" cy="35" r="2" fill="#26312b"/>
      <circle cx="44" cy="35" r="2" fill="#26312b"/>
      <path d="M34 45c3 2 7 2 10-1" fill="none" stroke="#26312b" stroke-width="3" stroke-linecap="round"/>
      ${accessory}
      <circle cx="52" cy="52" r="12" fill="#fff" opacity=".95"/>
      <text x="52" y="57" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="${labelColor}">${quest.icon}</text>
    </svg>
  `;
}

function monsterDataUrl(quest) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(monsterSvg(quest))}`;
}

function markerIcon(quest) {
  const svg = monsterSvg(quest);
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(54, 54),
    anchor: new google.maps.Point(27, 48)
  };
}

function followerMarkerIcon(quest) {
  const svg = monsterSvg(quest, 52);
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(40, 40),
    anchor: new google.maps.Point(20, 34)
  };
}

function syncFollowerMarkers() {
  if (!state.map || !window.google?.maps) return;
  for (const [id, marker] of state.followerMarkers) {
    if (!state.activeTeam.includes(id)) {
      marker.setMap(null);
      state.followerMarkers.delete(id);
    }
  }
  const currentPosition = state.displayedPosition || state.lastPosition;
  if (!currentPosition) return;
  state.activeTeam.forEach((id) => {
    if (state.followerMarkers.has(id)) return;
    const quest = quests.find((item) => item.id === id);
    if (!quest) return;
    state.followerMarkers.set(id, new google.maps.Marker({
      map: state.map,
      position: currentPosition,
      icon: followerMarkerIcon(quest),
      title: `${quest.title}・隊伍夥伴`,
      clickable: false,
      zIndex: 20
    }));
  });
  updateFollowerPositions(state.displayedPosition || state.lastPosition);
}

function updateFollowerPositions(fallbackPosition) {
  if (!fallbackPosition) return;
  state.activeTeam.forEach((id, index) => {
    const marker = state.followerMarkers.get(id);
    if (!marker) return;
    const trailIndex = Math.max(0, state.visualTrail.length - 1 - ((index + 1) * 12));
    marker.setPosition(state.visualTrail[trailIndex] || fallbackPosition);
  });
}

function userMarkerIcon(heading = 0) {
  return {
    url: new URL("assets/character/nurse-walk-cycle.webp", window.location.href).href,
    scaledSize: new google.maps.Size(76, 76),
    anchor: new google.maps.Point(38, 70)
  };
}

function initGoogleMap() {
  state.mapLoaded = true;
  state.mapsScriptLoading = false;
  if (state.mapLoadTimer) window.clearTimeout(state.mapLoadTimer);
  els.keyForm.classList.remove("is-error");
  els.keyForm.classList.add("is-loaded");
  els.mapError.hidden = true;
  els.mockMap.style.display = "none";
  state.map = new google.maps.Map(els.map, {
    center: WANFANG,
    zoom: 16.5,
    tilt: 0,
    heading: 0,
    renderingType: google.maps.RenderingType.VECTOR,
    isFractionalZoomEnabled: true,
    tiltInteractionEnabled: true,
    headingInteractionEnabled: true,
    disableDefaultUI: true,
    clickableIcons: false
  });

  state.map.addListener("dragstart", () => setFollowMode(false));

  quests.forEach((quest) => {
    const marker = new google.maps.Marker({
      map: state.map,
      position: { lat: quest.lat, lng: quest.lng },
      icon: markerIcon(quest),
      title: quest.title
    });
    marker.addListener("click", () => selectQuest(quest.id, false));
    state.markers.set(quest.id, marker);

    new google.maps.Circle({
      map: state.map,
      center: { lat: quest.lat, lng: quest.lng },
      radius: quest.radius,
      strokeColor: "#3f8f66",
      strokeOpacity: 0.45,
      strokeWeight: 1,
      fillColor: "#3f8f66",
      fillOpacity: 0.08
    });
  });
  syncFollowerMarkers();
  if (state.lastPosition) {
    updateUserPosition(
      state.lastPosition,
      state.lastAccuracy,
      state.lastPositionTimestamp || Date.now()
    );
  }
}

function destinationPoint(origin, heading, distanceMeters) {
  const earthRadius = 6371000;
  const angularDistance = distanceMeters / earthRadius;
  const bearing = heading * Math.PI / 180;
  const latitude = origin.lat * Math.PI / 180;
  const longitude = origin.lng * Math.PI / 180;
  const destinationLatitude = Math.asin(
    Math.sin(latitude) * Math.cos(angularDistance) +
    Math.cos(latitude) * Math.sin(angularDistance) * Math.cos(bearing)
  );
  const destinationLongitude = longitude + Math.atan2(
    Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latitude),
    Math.cos(angularDistance) - Math.sin(latitude) * Math.sin(destinationLatitude)
  );
  return {
    lat: destinationLatitude * 180 / Math.PI,
    lng: destinationLongitude * 180 / Math.PI
  };
}

function shortestHeadingDelta(from, to) {
  return ((to - from + 540) % 360) - 180;
}

function updateFollowCamera(position, heading, force = false) {
  if (!state.map || !state.followMode || !position) return;
  const now = performance.now();
  if (!force && now - state.lastCameraUpdateAt < FOLLOW_CAMERA.updateIntervalMs) return;
  state.lastCameraUpdateAt = now;

  const targetHeading = Number.isFinite(heading) ? heading : state.cameraHeading;
  const headingDelta = shortestHeadingDelta(state.cameraHeading, targetHeading);
  state.cameraHeading = (state.cameraHeading + headingDelta * (force ? 1 : 0.16) + 360) % 360;
  const center = destinationPoint(position, state.cameraHeading, FOLLOW_CAMERA.lookAheadMeters);
  state.map.moveCamera({
    center,
    zoom: FOLLOW_CAMERA.zoom,
    tilt: FOLLOW_CAMERA.tilt,
    heading: state.cameraHeading
  });
  els.map.dataset.cameraTilt = String(FOLLOW_CAMERA.tilt);
  els.map.dataset.cameraHeading = state.cameraHeading.toFixed(1);
  els.map.dataset.cameraZoom = String(FOLLOW_CAMERA.zoom);
  els.map.dataset.actualTilt = String(state.map.getTilt?.() ?? "");
  els.map.dataset.actualHeading = String(state.map.getHeading?.() ?? "");
  els.map.dataset.actualZoom = String(state.map.getZoom?.() ?? "");
}

function characterScreenHeading(heading) {
  const mapHeading = state.map?.getHeading?.() || 0;
  return state.followMode ? 0 : shortestHeadingDelta(mapHeading, heading);
}

function setFollowMode(enabled) {
  state.followMode = enabled;
  els.followButton.classList.toggle("is-active", enabled);
  els.followButton.setAttribute("aria-pressed", String(enabled));
  els.followButton.title = enabled ? "正在鎖定跟隨位置" : "點擊恢復跟隨位置";
  if (enabled && state.lastPosition && state.map) {
    updateFollowCamera(state.lastPosition, state.heading, true);
  }
  renderProgress();
}

function animateUserMarker(target, heading, duration = 1200) {
  if (!state.userMarker && !state.user3DCharacter) return;
  const start = state.displayedPosition || target;
  const startedAt = performance.now();
  if (state.markerAnimationFrame) cancelAnimationFrame(state.markerAnimationFrame);

  const frame = (now) => {
    const rawProgress = Math.min(1, (now - startedAt) / duration);
    const progress = 1 - Math.pow(1 - rawProgress, 3);
    const current = {
      lat: start.lat + (target.lat - start.lat) * progress,
      lng: start.lng + (target.lng - start.lng) * progress
    };
    state.displayedPosition = current;
    if (state.userMarker) state.userMarker.setPosition(current);
    if (state.user3DCharacter) state.user3DCharacter.setPosition(current);
    if (now - state.lastVisualTrailAt >= 100) {
      state.visualTrail.push(current);
      if (state.visualTrail.length > 180) state.visualTrail.shift();
      state.lastVisualTrailAt = now;
    }
    updateFollowerPositions(current);
    updateFollowCamera(current, heading);
    if (rawProgress < 1) state.markerAnimationFrame = requestAnimationFrame(frame);
  };

  if (state.userMarker) state.userMarker.setIcon(userMarkerIcon(heading));
  if (state.user3DCharacter) state.user3DCharacter.setHeading(characterScreenHeading(heading));
  state.markerAnimationFrame = requestAnimationFrame(frame);
}

async function ensure3DCharacter(position) {
  if (state.user3DCharacter || state.user3DLoading || !state.map) return;
  state.user3DLoading = true;
  try {
    const characterApi = await window.WANFANG_3D_READY;
    const character = characterApi.create(state.map, position);
    await character.ready;
    character.setPosition(state.displayedPosition || state.lastPosition || position);
    character.setHeading(characterScreenHeading(state.heading));
    state.user3DCharacter = character;
    if (state.userMarker) state.userMarker.setVisible(false);
  } catch (error) {
    console.warn("3D walking character unavailable; using image fallback.", error);
  } finally {
    state.user3DLoading = false;
  }
}

async function requestWakeLock() {
  if (!("wakeLock" in navigator)) return;
  try {
    state.wakeLock = await navigator.wakeLock.request("screen");
  } catch (_) {
    state.wakeLock = null;
  }
}

async function releaseWakeLock() {
  if (!state.wakeLock) return;
  await state.wakeLock.release().catch(() => {});
  state.wakeLock = null;
}

function showMapStatus(message, isError = false) {
  els.keyStatus.textContent = message;
  els.keyForm.classList.toggle("is-error", isError);
  if (isError) {
    els.keyForm.classList.remove("is-loaded");
    els.mapError.hidden = false;
    els.mapError.querySelector("span").textContent = message;
  }
}

function accuracyText(accuracy) {
  if (!Number.isFinite(accuracy)) return "定位精準度未知";
  if (accuracy <= 30) return `定位精準度約 ${Math.round(accuracy)}m，很適合觸發任務。`;
  if (accuracy <= 100) return `定位精準度約 ${Math.round(accuracy)}m，可用但任務觸發要放寬。`;
  return `定位精準度約 ${Math.round(accuracy)}m，這多半是 Wi-Fi/IP 估算，位置可能偏很多。`;
}

function bearingBetween(a, b) {
  const toRad = (degrees) => degrees * Math.PI / 180;
  const toDeg = (radians) => radians * 180 / Math.PI;
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function updateUserPosition(coords, accuracy, timestamp = Date.now()) {
  const previous = state.lastPosition;
  const previousTimestamp = state.lastPositionTimestamp;
  const elapsedSeconds = previousTimestamp ? Math.max(0.1, (timestamp - previousTimestamp) / 1000) : 0;
  const delta = previous ? distanceBetween(previous, coords) : 0;

  const poorFix = Number.isFinite(accuracy) && accuracy > 120;
  const implausibleJump = previous && elapsedSeconds > 0 && delta > Math.max(120, elapsedSeconds * 15);
  if (previous && ((poorFix && state.lastAccuracy <= 80) || implausibleJump)) {
    els.locationStatus.textContent = `略過一筆飄移定位（精準度約 ${Math.round(accuracy || 0)}m），繼續追蹤中。`;
    return;
  }

  state.lastPosition = coords;
  state.lastPositionTimestamp = timestamp;
  state.lastAccuracy = accuracy;

  const selectedQuest = quests.find((quest) => quest.id === state.selectedId);
  const closestQuest = nearestQuest();
  if (selectedQuest && closestQuest && closestQuest.distance <= 250 &&
      distanceMeters(coords, selectedQuest) > 1000) {
    state.selectedId = closestQuest.quest.id;
  }

  if (previous && Number.isFinite(accuracy) && accuracy <= 80) {
    if (delta >= 2 && delta <= 80) {
      state.walkedMeters += delta;
      saveWalkedMeters();
    }
  }

  if (previous && delta >= 2) {
    state.heading = bearingBetween(previous, coords);
    if (!state.speedMetersPerSecond && elapsedSeconds > 0) {
      state.speedMetersPerSecond = delta / elapsedSeconds;
    }
  }

  if (!state.map) {
    els.locationStatus.textContent = `${accuracyText(accuracy)} 填入 Google Maps API key 後可顯示在真實地圖上。`;
    renderAll();
    return;
  }

  if (state.followMode) updateFollowCamera(coords, state.heading, !state.userMarker);
  if (!state.userMarker) {
    state.userMarker = new google.maps.Marker({
      map: state.map,
      position: coords,
      icon: userMarkerIcon(state.heading),
      title: "目前位置",
      optimized: false,
      zIndex: 30
    });
    state.displayedPosition = coords;
    state.visualTrail.push(coords);
  }
  ensure3DCharacter(coords);
  const animationDuration = elapsedSeconds
    ? Math.min(10000, Math.max(900, elapsedSeconds * 980))
    : 900;
  animateUserMarker(coords, state.heading, animationDuration);
  syncFollowerMarkers();

  state.userTrail.push(coords);
  if (state.userTrail.length > 120) state.userTrail.shift();
  if (!state.userPath) {
    state.userPath = new google.maps.Polyline({
      map: state.map,
      path: state.userTrail,
      strokeColor: "#2f7bb2",
      strokeOpacity: 0.75,
      strokeWeight: 4
    });
  } else {
    state.userPath.setPath(state.userTrail);
  }

  if (!state.accuracyCircle) {
    state.accuracyCircle = new google.maps.Circle({
      map: state.map,
      center: coords,
      radius: accuracy || 50,
      strokeColor: "#4e8fc7",
      strokeOpacity: 0.45,
      strokeWeight: 2,
      fillColor: "#4e8fc7",
      fillOpacity: 0.12
    });
  } else {
    state.accuracyCircle.setCenter(coords);
    state.accuracyCircle.setRadius(accuracy || 50);
  }

  els.locationStatus.textContent = accuracyText(accuracy);
  renderAll();
}

function distanceBetween(a, b) {
  const earthRadius = 6371000;
  const toRad = (degrees) => degrees * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const hav =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(hav), Math.sqrt(1 - hav));
}

function distanceMeters(position, quest) {
  return distanceBetween(position, { lat: quest.lat, lng: quest.lng });
}

function nearestQuest() {
  if (!state.lastPosition) return null;
  return quests
    .map((quest) => ({ quest, distance: distanceMeters(state.lastPosition, quest) }))
    .sort((a, b) => a.distance - b.distance)[0];
}

function loadGoogleMaps(apiKey) {
  if (!apiKey) return;
  localStorage.setItem("googleMapsApiKey", apiKey);
  if (window.google?.maps) {
    initGoogleMap();
    return;
  }
  if (state.mapsScriptLoading) return;

  window.initWanfangMap = initGoogleMap;
  window.gm_authFailure = () => {
    state.mapsScriptLoading = false;
    if (state.mapLoadTimer) window.clearTimeout(state.mapLoadTimer);
    showMapStatus("Google Maps 拒絕這把 key。請確認 Billing 已啟用、Maps JavaScript API 已啟用，且 HTTP referrers 包含 https://luckyseal0923.github.io/pikmin_wfh/*。", true);
    els.mockMap.style.display = "block";
  };
  state.mapsScriptLoading = true;
  showMapStatus("正在載入 Google Maps 真實地圖...");
  state.mapLoadTimer = window.setTimeout(() => {
    if (!state.mapLoaded) {
      state.mapsScriptLoading = false;
      showMapStatus("地圖載入逾時。請用 Safari 開啟，或確認 API key 的網域限制包含 GitHub Pages。", true);
      els.mockMap.style.display = "block";
    }
  }, MAP_LOAD_TIMEOUT_MS);

  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&callback=initWanfangMap&loading=async&v=weekly`;
  script.async = true;
  script.defer = true;
  script.onerror = () => {
    state.mapsScriptLoading = false;
    if (state.mapLoadTimer) window.clearTimeout(state.mapLoadTimer);
    els.mockMap.style.display = "block";
    showMapStatus("Google Maps 載入失敗。請確認網路、API key、或改用 Safari 開啟。", true);
  };
  document.head.appendChild(script);
}

function locateUser() {
  if (!navigator.geolocation) {
    alert("這個瀏覽器不支援定位。");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      updateUserPosition(coords, position.coords.accuracy, position.timestamp);
      setFollowMode(true);
    },
    () => alert("無法取得定位，請確認瀏覽器定位權限。"),
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

function stopTracking() {
  if (state.watchId !== null) navigator.geolocation.clearWatch(state.watchId);
  state.watchId = null;
  els.trackButton.textContent = "開始即時導航";
  releaseWakeLock();
  renderProgress();
}

function startTracking(automatic = false) {
  if (!navigator.geolocation) {
    els.locationStatus.textContent = "這個瀏覽器不支援定位。";
    if (!automatic) alert("這個瀏覽器不支援定位。");
    return;
  }
  if (state.watchId !== null) return;
  els.locationStatus.textContent = automatic
    ? "正在自動取得目前位置，首次使用請允許精確定位。"
    : "正在取得目前位置。";
  state.watchId = navigator.geolocation.watchPosition(
    (position) => {
      if (Number.isFinite(position.coords.heading) && position.coords.heading >= 0) {
        state.heading = position.coords.heading;
      }
      state.speedMetersPerSecond = Number.isFinite(position.coords.speed) && position.coords.speed > 0
        ? position.coords.speed
        : 0;
      updateUserPosition(
        { lat: position.coords.latitude, lng: position.coords.longitude },
        position.coords.accuracy,
        position.timestamp
      );
    },
    (error) => {
      stopTracking();
      const message = error.code === 1
        ? "定位權限未開啟，請到 Safari 網站設定允許精確定位。"
        : "暫時無法取得 GPS，請確認網路與定位服務後再試。";
      els.locationStatus.textContent = message;
      if (!automatic) alert(message);
    },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
  );
  setFollowMode(true);
  requestWakeLock();
  els.trackButton.textContent = "停止即時導航";
  renderProgress();
}

function toggleTracking() {
  if (state.watchId !== null) {
    stopTracking();
  } else {
    startTracking(false);
  }
}

function simulateAtWanfang() {
  const route = [
    WANFANG,
    { lat: WANFANG.lat + 0.00003, lng: WANFANG.lng + 0.00002 },
    { lat: WANFANG.lat + 0.00006, lng: WANFANG.lng + 0.00004 },
    { lat: WANFANG.lat + 0.00009, lng: WANFANG.lng + 0.00003 },
    { lat: WANFANG.lat + 0.00012, lng: WANFANG.lng + 0.00001 }
  ];
  const point = route[state.simulationIndex % route.length];
  state.simulationIndex += 1;
  updateUserPosition(point, 8, Date.now());
  setFollowMode(true);
}

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

els.keyForm.addEventListener("submit", (event) => {
  event.preventDefault();
  loadGoogleMaps(els.apiKey.value.trim());
});

els.completeButton.addEventListener("click", () => {
  if (state.completed.has(state.selectedId)) {
    state.completed.delete(state.selectedId);
  } else {
    state.completed.add(state.selectedId);
    const quest = quests.find((item) => item.id === state.selectedId);
    const isNewCapture = !state.collected.has(state.selectedId);
    let joinedTeam = false;
    state.collected.add(state.selectedId);
    if (isNewCapture && state.activeTeam.length < 3) {
      state.activeTeam.push(state.selectedId);
      joinedTeam = true;
    }
    saveMonsterProgress();
    renderCollection();
    syncFollowerMarkers();
    if (quest && isNewCapture) showCaptureToast(quest, joinedTeam);
  }
  saveCompleted();
  renderAll();
});

els.locateButton.addEventListener("click", locateUser);
els.followButton.addEventListener("click", () => setFollowMode(true));
els.teamButton.addEventListener("click", () => setTeamPanel(els.teamPanel.hidden));
els.closeTeamButton.addEventListener("click", () => setTeamPanel(false));
els.trackButton.addEventListener("click", toggleTracking);
els.simulateButton.addEventListener("click", simulateAtWanfang);
els.cardToggle.addEventListener("click", () => {
  setCardCollapsed(!els.questCard.classList.contains("is-collapsed"));
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && state.watchId !== null && !state.wakeLock) {
    requestWakeLock();
  }
});

const storedKey = localStorage.getItem("googleMapsApiKey");
const initialKey = storedKey || DEFAULT_GOOGLE_MAPS_API_KEY;
if (initialKey) {
  els.apiKey.value = initialKey;
  loadGoogleMaps(initialKey);
}

renderMockMarkers();
renderAll();
renderCollection();
setCardCollapsed(window.matchMedia("(max-width: 620px)").matches);
initSupabaseSync();
startTracking(true);
