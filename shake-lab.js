const els = {
  stage: document.querySelector(".battle-stage"),
  sensorButton: document.querySelector("#sensorButton"),
  simulateButton: document.querySelector("#simulateButton"),
  attackButton: document.querySelector("#attackButton"),
  energyTrack: document.querySelector("#energyTrack"),
  energyFill: document.querySelector("#energyFill"),
  energyText: document.querySelector("#energyText"),
  comboText: document.querySelector("#comboText"),
  intensityText: document.querySelector("#intensityText"),
  shakeCountText: document.querySelector("#shakeCountText"),
  attackCountText: document.querySelector("#attackCountText"),
  sensorStatus: document.querySelector("#sensorStatus"),
  enemyHpFill: document.querySelector("#enemyHpFill"),
  enemyHpText: document.querySelector("#enemyHpText"),
  damageNumber: document.querySelector("#damageNumber")
};

const state = {
  energy: 0,
  enemyHp: 100,
  combo: 0,
  shakes: 0,
  attacks: 0,
  lastMagnitude: null,
  lastShakeAt: 0,
  motionArmed: true,
  quietSince: 0,
  comboExpiresAt: 0,
  sensorActive: false,
  attackLocked: false
};

const SHAKE_THRESHOLD = 7.2;
const RESET_THRESHOLD = 2.2;
const RESET_HOLD_MS = 140;
const SHAKE_COOLDOWN_MS = 320;
const COMBO_WINDOW_MS = 1200;

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function render() {
  const roundedEnergy = Math.round(state.energy);
  const ready = roundedEnergy >= 100;
  els.energyFill.style.width = `${roundedEnergy}%`;
  els.energyText.textContent = `${roundedEnergy}%`;
  els.energyTrack.classList.toggle("is-ready", ready);
  els.energyTrack.setAttribute("aria-valuenow", String(roundedEnergy));
  els.comboText.textContent = `連續 ${state.combo} 次`;
  els.shakeCountText.textContent = String(state.shakes);
  els.attackCountText.textContent = String(state.attacks);
  els.enemyHpFill.style.width = `${state.enemyHp}%`;
  els.enemyHpText.textContent = `${state.enemyHp} / 100`;
  els.attackButton.disabled = !ready || state.attackLocked;
  els.attackButton.textContent = ready ? "發動能量攻擊" : "能量未滿";
}

function flashShake() {
  els.stage.classList.remove("is-shaking");
  void els.stage.offsetWidth;
  els.stage.classList.add("is-shaking");
  window.setTimeout(() => els.stage.classList.remove("is-shaking"), 200);
}

function registerShake(intensity) {
  const now = performance.now();
  if (now - state.lastShakeAt < SHAKE_COOLDOWN_MS || state.attackLocked) return;
  state.lastShakeAt = now;
  state.motionArmed = false;
  state.quietSince = 0;
  state.combo = now <= state.comboExpiresAt ? state.combo + 1 : 1;
  state.comboExpiresAt = now + COMBO_WINDOW_MS;
  state.shakes += 1;
  const baseGain = clamp(5 + intensity * 1.45, 7, 18);
  const comboBonus = Math.min(5, Math.floor(state.combo / 3));
  state.energy = clamp(state.energy + baseGain + comboBonus, 0, 100);
  els.intensityText.textContent = intensity.toFixed(1);
  els.sensorStatus.textContent = state.energy >= 100
    ? "能量充滿，可以發動攻擊。"
    : `偵測到有效晃動，蓄能 +${Math.round(baseGain + comboBonus)}。`;
  if (navigator.vibrate) navigator.vibrate(18);
  flashShake();
  render();
}

function readMotion(event) {
  const source = event.acceleration || event.accelerationIncludingGravity;
  if (!source) return;
  const x = Number(source.x) || 0;
  const y = Number(source.y) || 0;
  const z = Number(source.z) || 0;
  const magnitude = Math.sqrt(x * x + y * y + z * z);
  if (state.lastMagnitude === null) {
    state.lastMagnitude = magnitude;
    return;
  }
  const intensity = Math.abs(magnitude - state.lastMagnitude);
  state.lastMagnitude = state.lastMagnitude * 0.35 + magnitude * 0.65;
  els.intensityText.textContent = intensity.toFixed(1);
  const now = performance.now();
  if (!state.motionArmed) {
    if (intensity <= RESET_THRESHOLD) {
      if (!state.quietSince) state.quietSince = now;
      if (now - state.quietSince >= RESET_HOLD_MS) {
        state.motionArmed = true;
        state.quietSince = 0;
      }
    } else {
      state.quietSince = 0;
    }
    return;
  }
  if (intensity >= SHAKE_THRESHOLD) registerShake(intensity);
}

async function startSensor() {
  if (state.sensorActive) return;
  try {
    if (typeof DeviceMotionEvent === "undefined") {
      throw new Error("此瀏覽器沒有提供動作感測器。");
    }
    if (typeof DeviceMotionEvent.requestPermission === "function") {
      const permission = await DeviceMotionEvent.requestPermission();
      if (permission !== "granted") throw new Error("動作感測權限未允許。");
    }
    window.addEventListener("devicemotion", readMotion, { passive: true });
    state.sensorActive = true;
    els.sensorButton.textContent = "動作感測中";
    els.sensorButton.disabled = true;
    els.sensorStatus.textContent = "感測器已啟動，請做明顯的大幅上下晃動；輕微手抖不會計入。";
  } catch (error) {
    els.sensorStatus.textContent = `${error.message} 仍可使用「模擬晃動」測試。`;
    els.sensorButton.textContent = "重新開啟感測";
  }
}

function attack() {
  if (state.energy < 100 || state.attackLocked) return;
  state.attackLocked = true;
  state.attacks += 1;
  const damage = 28 + Math.min(12, state.combo);
  state.enemyHp = Math.max(0, state.enemyHp - damage);
  state.energy = 0;
  state.combo = 0;
  els.damageNumber.textContent = `-${damage}`;
  els.stage.classList.remove("is-attacking");
  void els.stage.offsetWidth;
  els.stage.classList.add("is-attacking");
  els.sensorStatus.textContent = state.enemyHp === 0
    ? "測試成功，敵人已被擊倒。下一次攻擊將重置敵人。"
    : `攻擊命中，造成 ${damage} 點傷害。重新晃動即可蓄能。`;
  if (navigator.vibrate) navigator.vibrate([35, 35, 70]);
  render();
  window.setTimeout(() => {
    els.stage.classList.remove("is-attacking");
    if (state.enemyHp === 0) state.enemyHp = 100;
    state.attackLocked = false;
    render();
  }, 850);
}

els.sensorButton.addEventListener("click", startSensor);
els.simulateButton.addEventListener("click", () => {
  state.motionArmed = true;
  registerShake(9 + Math.random() * 3);
});
els.attackButton.addEventListener("click", attack);
window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    state.motionArmed = true;
    registerShake(9.5);
  }
});

window.setInterval(() => {
  if (performance.now() > state.comboExpiresAt && state.combo !== 0) {
    state.combo = 0;
    render();
  }
}, 250);

render();
