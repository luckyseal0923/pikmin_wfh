const WANFANG = { lat: 24.99915, lng: 121.55878 };

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
  }
];

const state = {
  selectedId: quests[0].id,
  completed: new Set(JSON.parse(localStorage.getItem("completedQuests") || "[]")),
  walkedMeters: Number(localStorage.getItem("walkedMeters") || "0"),
  map: null,
  markers: new Map(),
  userMarker: null,
  accuracyCircle: null,
  userPath: null,
  userTrail: [],
  lastPosition: null,
  lastAccuracy: null,
  watchId: null
};

const els = {
  apiKey: document.querySelector("#apiKey"),
  completeButton: document.querySelector("#completeButton"),
  completedCount: document.querySelector("#completedCount"),
  keyForm: document.querySelector("#keyForm"),
  locateButton: document.querySelector("#locateButton"),
  locationStatus: document.querySelector("#locationStatus"),
  map: document.querySelector("#map"),
  mockMap: document.querySelector("#mockMap"),
  nearestQuest: document.querySelector("#nearestQuest"),
  progressMeter: document.querySelector("#progressMeter"),
  questDescription: document.querySelector("#questDescription"),
  questDistance: document.querySelector("#questDistance"),
  questList: document.querySelector("#questList"),
  questRadius: document.querySelector("#questRadius"),
  questReward: document.querySelector("#questReward"),
  questTitle: document.querySelector("#questTitle"),
  questType: document.querySelector("#questType"),
  simulateButton: document.querySelector("#simulateButton"),
  stepCount: document.querySelector("#stepCount"),
  distanceCount: document.querySelector("#distanceCount"),
  trackButton: document.querySelector("#trackButton")
};

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
  els.progressMeter.value = state.completed.size;
  els.stepCount.textContent = `${Math.round(state.walkedMeters / 0.75)} 步`;
  els.distanceCount.textContent = `${Math.round(state.walkedMeters)} m`;
  const nearest = nearestQuest();
  els.nearestQuest.textContent = nearest ? `最近：${nearest.quest.title} ${Math.round(nearest.distance)}m` : "尚未定位";
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
}

function saveWalkedMeters() {
  localStorage.setItem("walkedMeters", String(state.walkedMeters));
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

function userMarkerIcon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="76" height="76" viewBox="0 0 76 76">
      <ellipse cx="38" cy="68" rx="18" ry="5" fill="#26312b" opacity=".18"/>
      <path d="M38 10c-6 0-11 4-14 10" fill="none" stroke="#2f4b42" stroke-width="5" stroke-linecap="round"/>
      <circle cx="24" cy="20" r="5" fill="#f6cf57" stroke="#fff" stroke-width="2"/>
      <path d="M15 39c0-17 12-27 27-25 12 2 22 12 22 27 0 18-13 29-31 28-13-1-18-11-18-30z" fill="#2f7bb2" stroke="#fff" stroke-width="5"/>
      <circle cx="31" cy="38" r="6" fill="#fff"/>
      <circle cx="50" cy="38" r="6" fill="#fff"/>
      <circle cx="33" cy="40" r="2.5" fill="#26312b"/>
      <circle cx="48" cy="40" r="2.5" fill="#26312b"/>
      <path d="M36 51c4 3 9 3 13 0" fill="none" stroke="#26312b" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M21 59c-6 3-9 7-11 12" fill="none" stroke="#2f7bb2" stroke-width="5" stroke-linecap="round"/>
      <path d="M55 59c6 3 9 7 11 12" fill="none" stroke="#2f7bb2" stroke-width="5" stroke-linecap="round"/>
    </svg>
  `;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(58, 58),
    anchor: new google.maps.Point(29, 52)
  };
}

function initGoogleMap() {
  els.mockMap.style.display = "none";
  state.map = new google.maps.Map(els.map, {
    center: WANFANG,
    zoom: 16,
    disableDefaultUI: true,
    clickableIcons: false,
    styles: [
      { featureType: "poi.business", stylers: [{ visibility: "off" }] },
      { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#b7d5e6" }] },
      { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#dff1fb" }] },
      { featureType: "poi", elementType: "geometry", stylers: [{ color: "#d7edf8" }] },
      { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#c9eadf" }] },
      { featureType: "road", elementType: "geometry", stylers: [{ color: "#f7fbff" }] },
      { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#c3dceb" }] },
      { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#5f7583" }] },
      { featureType: "transit", elementType: "geometry", stylers: [{ color: "#c4e3f5" }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#a9d8f3" }] }
    ]
  });

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
}

function accuracyText(accuracy) {
  if (!Number.isFinite(accuracy)) return "定位精準度未知";
  if (accuracy <= 30) return `定位精準度約 ${Math.round(accuracy)}m，很適合觸發任務。`;
  if (accuracy <= 100) return `定位精準度約 ${Math.round(accuracy)}m，可用但任務觸發要放寬。`;
  return `定位精準度約 ${Math.round(accuracy)}m，這多半是 Wi-Fi/IP 估算，位置可能偏很多。`;
}

function updateUserPosition(coords, accuracy) {
  const previous = state.lastPosition;
  state.lastPosition = coords;
  state.lastAccuracy = accuracy;

  if (previous && Number.isFinite(accuracy) && accuracy <= 80) {
    const delta = distanceBetween(previous, coords);
    if (delta >= 2 && delta <= 80) {
      state.walkedMeters += delta;
      saveWalkedMeters();
    }
  }

  if (!state.map) {
    els.locationStatus.textContent = `${accuracyText(accuracy)} 填入 Google Maps API key 後可顯示在真實地圖上。`;
    renderAll();
    return;
  }

  state.map.panTo(coords);
  state.map.setZoom(Math.max(state.map.getZoom(), 17));
  if (!state.userMarker) {
    state.userMarker = new google.maps.Marker({
      map: state.map,
      position: coords,
      icon: userMarkerIcon(),
      title: "目前位置"
    });
  } else {
    state.userMarker.setPosition(coords);
  }

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

  window.initWanfangMap = initGoogleMap;
  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&callback=initWanfangMap&v=weekly`;
  script.async = true;
  script.defer = true;
  script.onerror = () => {
    els.mockMap.style.display = "block";
    alert("Google Maps 載入失敗，請確認 API key 與網路連線。");
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
      updateUserPosition(coords, position.coords.accuracy);
    },
    () => alert("無法取得定位，請確認瀏覽器定位權限。"),
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

function toggleTracking() {
  if (!navigator.geolocation) {
    alert("這個瀏覽器不支援定位。");
    return;
  }
  if (state.watchId !== null) {
    navigator.geolocation.clearWatch(state.watchId);
    state.watchId = null;
    els.trackButton.textContent = "持續追蹤";
    return;
  }
  state.watchId = navigator.geolocation.watchPosition(
    (position) => {
      updateUserPosition(
        { lat: position.coords.latitude, lng: position.coords.longitude },
        position.coords.accuracy
      );
    },
    () => {
      alert("無法持續追蹤定位，請確認瀏覽器定位權限。");
      if (state.watchId !== null) {
        navigator.geolocation.clearWatch(state.watchId);
        state.watchId = null;
      }
      els.trackButton.textContent = "持續追蹤";
    },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
  );
  els.trackButton.textContent = "停止追蹤";
}

function simulateAtWanfang() {
  updateUserPosition(WANFANG, 15);
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
  }
  saveCompleted();
  renderAll();
});

els.locateButton.addEventListener("click", locateUser);
els.trackButton.addEventListener("click", toggleTracking);
els.simulateButton.addEventListener("click", simulateAtWanfang);

const storedKey = localStorage.getItem("googleMapsApiKey");
if (storedKey) {
  els.apiKey.value = storedKey;
  loadGoogleMaps(storedKey);
}

renderMockMarkers();
renderAll();
