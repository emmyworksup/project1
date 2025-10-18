// script.js
// Minimal, persistent timer that reads config.json and redirects on time up.
// Keeps UI exactly as requested (small transparent black box, white text).

const CONFIG_PATH = 'config.json';
const STORAGE_KEY = 'escapeRoomEndTime_v1';
let config = { timerMinutes: 60, redirectTimeUp: '', showResetButton: false };
let endTime = null;
let tickInterval = null;

// Format minutes:seconds. Allows minutes >= 60 (e.g. 60:00)
function formatMMSS(totalSec) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

async function loadConfig() {
  try {
    const res = await fetch(CONFIG_PATH + '?t=' + Date.now());
    const j = await res.json();
    config = Object.assign(config, j || {});
  } catch (e) {
    console.warn('Could not load config.json — using defaults', e);
  }
}

function setEndFromNow() {
  const mins = Number(config.timerMinutes) || 60;
  endTime = Date.now() + mins * 60 * 1000;
  localStorage.setItem(STORAGE_KEY, String(endTime));
}

function initEndTime() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    setEndFromNow();
  } else {
    endTime = Number(saved);
    // invalid saved value? reset
    if (!endTime || endTime <= Date.now()) {
      setEndFromNow();
    }
  }
}

function showResetIfAllowed() {
  if (config.showResetButton) {
    const b = document.getElementById('resetBtn');
    if (b) {
      b.style.display = 'inline-block';
      b.onclick = () => {
        setEndFromNow();
        document.getElementById('status').textContent = 'Timer reset';
      };
    }
  }
}

// Safe redirect: try to navigate top window; if blocked, show manual button with target _top
function redirectTo(url) {
  if (!url) return;
  try {
    if (window.top !== window.self) {
      // prefer top navigation
      window.top.location.href = url;
    } else {
      window.location.href = url;
    }
  } catch (err) {
    // sandbox or CSP blocked: show simple fallback that opens in top
    document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;text-align:center;">
        <div>
          <h2 style="color:#d33; font-family: sans-serif;">⏰ Time’s Up!</h2>
          <p style="margin:10px 0;">Click below to continue</p>
          <a href="${url}" target="_top" style="font-size:16px;background:#008000;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;display:inline-block;">Go to Next Page</a>
        </div>
      </div>`;
  }
}

function tick() {
  const now = Date.now();
  const remainingSec = Math.floor((endTime - now) / 1000);
  const minutesEl = document.getElementById('minutes');
  const statusEl = document.getElementById('status');

  if (remainingSec <= 0) {
    clearInterval(tickInterval);
    localStorage.removeItem(STORAGE_KEY);
    if (minutesEl) minutesEl.textContent = '00:00';
    if (statusEl) statusEl.textContent = "TIME'S UP";

    // play sound (may be blocked by browser autoplay rules)
    const audio = document.getElementById('timeUpSound');
    if (audio) {
      audio.volume = 0.9;
      audio.play().catch(()=>{/* ignore autoplay block */});
    }

    // small delay then redirect
    setTimeout(() => {
      if (config.redirectTimeUp) redirectTo(config.redirectTimeUp);
    }, 800); // short delay so 00:00 is visible briefly
    return;
  }

  if (minutesEl) minutesEl.textContent = formatMMSS(remainingSec);
  if (statusEl) statusEl.textContent = '';
}

async function start() {
  await loadConfig();
  initEndTime();
  showResetIfAllowed();
  // ensure UI shows starting time immediately
  tick();
  tickInterval = setInterval(tick, 1000);
}

// start
start();
