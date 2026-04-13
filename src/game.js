// src/game.js
import { createMouseInput } from './input-mouse.js';
import { createHandInput }  from './input-hand.js';
import { draw } from './render.js';
import { generateSeed, generateTransform, getEyeWorld } from './board.js';
import { createPlayer }        from './audio.js';
import { getMessage }          from './messages.js';
import { getName, setName }    from './name-store.js';
import { submitScore, subscribeLeaderboard, isNameTaken } from './score.js';
import { track }               from './firebase.js';

const canvas   = document.getElementById('game-canvas');
const ctx      = canvas.getContext('2d');
const isMobile = window.matchMedia('(pointer: coarse)').matches;

// ─── Music ───────────────────────────────────────────────────────────────────
const player = createPlayer();

function updateTrackName() {
  document.getElementById('track-name').textContent = player.trackName();
}

const btnPlay = document.getElementById('btn-play');

function syncPlayButton() {
  btnPlay.textContent = player.isPaused() ? '▶' : '⏸';
}

/** Starts playback; resolves when playing or rejects if the browser blocks autoplay. */
function tryPlayMusic() {
  return player.play().then(() => {
    updateTrackName();
    syncPlayButton();
  }).catch(() => {
    syncPlayButton();
  });
}

btnPlay.addEventListener('click', () => {
  player.toggle();
  syncPlayButton();
});
document.getElementById('btn-prev').addEventListener('click', () => { player.prev(); updateTrackName(); });
document.getElementById('btn-next').addEventListener('click', () => { player.next(); updateTrackName(); });
const volSlider  = document.getElementById('vol-slider');
const volIosNote = document.getElementById('vol-ios-note');

// iOS Safari ignores audio.volume — hardware buttons control volume there.
const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) ||
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

if (isIOS) {
  volSlider.style.display  = 'none';
  volIosNote.style.display = 'inline';
} else {
  volSlider.value = Math.round(player.getVolume() * 100);
  // 'input' fires during drag; 'change' fires on release (fallback for some mobile browsers).
  const onVol = (e) => player.setVolume(e.target.value / 100);
  volSlider.addEventListener('input',  onVol);
  volSlider.addEventListener('change', onVol);
}

updateTrackName();
syncPlayButton();
tryPlayMusic();

// If autoplay was blocked, first key press or click still starts playback.
window.addEventListener('keydown', () => { tryPlayMusic(); }, { once: true });
window.addEventListener('click', () => { tryPlayMusic(); }, { once: true });

// ─── How to Play overlay (shown once per browser) ────────────────────────────

const introOverlay = document.getElementById('intro-overlay');
const introConfirm = document.getElementById('intro-confirm');

function showIntro() {
  introOverlay.classList.remove('hidden');
  // Re-attach one-time keyboard dismiss each time overlay opens.
  document.addEventListener('keydown', function onIntroKey(e) {
    if (document.activeElement?.tagName === 'INPUT') return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
      e.preventDefault();
      dismissIntro();
      document.removeEventListener('keydown', onIntroKey);
    }
  });
}

function dismissIntro() {
  introOverlay.classList.add('hidden');
  tryPlayMusic();
}

// Always show on page load.
introConfirm.addEventListener('click', dismissIntro);
showIntro();

// Help button in tab bar re-opens instructions any time.
document.getElementById('btn-help').addEventListener('click', showIntro);

// ─── Name overlay ────────────────────────────────────────────────────────────

const nameOverlay  = document.getElementById('name-overlay');
const nameInput    = document.getElementById('name-input');
const nameError    = document.getElementById('name-error');
const nameConfirm  = document.getElementById('name-confirm');

function showNamePrompt(onDone) {
  nameInput.value   = getName();
  nameError.textContent = '';
  nameOverlay.classList.remove('hidden');
  nameInput.focus();

  async function confirm() {
    const name = nameInput.value.trim();
    if (!name) return;

    nameConfirm.disabled = true;
    nameError.textContent = '';

    const { auth } = await import('./firebase.js');
    const uid = auth.currentUser?.uid;

    if (await isNameTaken(name, uid)) {
      nameError.textContent = 'That name is already taken — try another!';
      nameConfirm.disabled = false;
      nameInput.focus();
      return;
    }

    setName(name);
    nameOverlay.classList.add('hidden');
    nameConfirm.disabled = false;
    nameConfirm.removeEventListener('click', confirm);
    nameInput.removeEventListener('keydown', onEnter);
    onDone(name);
  }

  function onEnter(e) { if (e.key === 'Enter') confirm(); }

  nameConfirm.addEventListener('click', confirm);
  nameInput.addEventListener('keydown', onEnter);
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

let leaderboard     = [];
let showLeaderboard = false;

const lbRowsEl = document.getElementById('lb-rows');
const MEDALS   = ['🥇', '🥈', '🥉'];

function renderHtmlLeaderboard(rows) {
  if (!lbRowsEl) return;
  lbRowsEl.textContent = ''; // clear previous rows

  if (!rows.length) {
    const empty = document.createElement('div');
    empty.className   = 'lb-empty';
    empty.textContent = 'No scores yet — be the first!';
    lbRowsEl.appendChild(empty);
    return;
  }

  rows.forEach((entry, i) => {
    const row = document.createElement('div');
    row.className = 'lb-row' + (i === 0 ? ' gold' : i === 1 ? ' silver' : i === 2 ? ' bronze' : '');

    const rank = document.createElement('span');
    rank.className   = 'lb-rank';
    rank.textContent = MEDALS[i] ?? `${i + 1}.`;

    const name = document.createElement('span');
    name.className   = 'lb-name';
    name.textContent = entry.displayName ?? 'Anonymous';

    const score = document.createElement('span');
    score.className   = 'lb-score';
    score.textContent = String(entry.bestScore ?? 0);

    row.appendChild(rank);
    row.appendChild(name);
    row.appendChild(score);
    lbRowsEl.appendChild(row);
  });
}

subscribeLeaderboard((rows) => {
  leaderboard = rows;
  renderHtmlLeaderboard(rows);
});

// ─── HTML state overlays (status bar + result actions) ────────────────────────

const gameStatus      = document.getElementById('game-status');
const statusLabel     = document.getElementById('status-label');
const statusSub       = document.getElementById('status-sub');
const statusMsg       = document.getElementById('status-msg');
const idleActions     = document.getElementById('idle-actions');
const resultActions   = document.getElementById('result-actions');
const tapConfirmWrap  = document.getElementById('tap-confirm-wrap');

document.getElementById('tap-confirm').addEventListener('click', () => {
  if (state === 'HIDDEN') handleCommit();
});

// Wire idle mode buttons (HTML, shown below canvas in IDLE state).
idleActions.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-idle]');
  if (!btn) return;
  if (btn.dataset.idle === 'mouse') {
    if (mode === 'hand' && handInput) handInput.stop();
    mode = 'mouse'; input = mouseInput; transition('REVEAL');
  } else if (btn.dataset.idle === 'camera') {
    switchToHand();
  }
});

function syncHtmlOverlays() {
  const isIdle   = state === 'IDLE';
  const isHidden = state === 'HIDDEN';
  const isResult = state === 'RESULT';

  idleActions.classList.toggle('hidden', !isIdle);
  gameStatus.classList.toggle('hidden', !isHidden && !isResult);
  resultActions.classList.toggle('hidden', !isResult);

  // Active styling on idle buttons
  idleActions.querySelector('[data-idle="mouse"]').classList.toggle('active', mode === 'mouse');
  idleActions.querySelector('[data-idle="camera"]').classList.toggle('active', mode === 'hand');

  // Label [T] Tap vs 🖱️ Mouse based on device
  idleActions.querySelector('[data-idle="mouse"]').textContent = isMobile ? '👆 Tap' : '🖱️ Mouse';

  // Show tap confirm only on mobile in HIDDEN state (tap mode, not hand/camera)
  tapConfirmWrap.classList.toggle('hidden', !(isHidden && isMobile && mode === 'mouse'));

  if (isHidden) {
    gameStatus.classList.add('mode-hint');
    statusLabel.className   = 'status-hint';
    if (mode === 'hand') {
      statusLabel.textContent = 'Where is the eye? Pinch to confirm.';
    } else if (isMobile) {
      statusLabel.textContent = 'Tap where the eye was, then press Drop Eye.';
    } else {
      statusLabel.textContent = 'Where is the eye? Click or SPACE to confirm.';
    }
    statusSub.textContent = '';
    statusMsg.textContent = '';
  } else if (isResult && round) {
    gameStatus.classList.remove('mode-hint');
    statusLabel.className   = round.hit ? 'status-hit' : 'status-miss';
    statusLabel.textContent = round.hit ? 'HIT!' : 'MISS';
    statusSub.textContent   = `${round.distance}px off`;
    statusMsg.textContent   = round.message ?? '';
  }
}

// Wire result action buttons via event delegation.
resultActions.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  if (action === 'again') {
    transition('REVEAL');
  } else if (action === 'mouse') {
    if (mode === 'hand' && handInput) handInput.stop();
    mode = 'mouse'; input = mouseInput; transition('REVEAL');
  } else if (action === 'camera') {
    switchToHand();
  } else if (action === 'board') {
    showLeaderboard = !showLeaderboard;
  } else if (action === 'name') {
    showNamePrompt((name) => {
      submitScore({ displayName: name, distance: round.distance, timeTaken: round.timeTaken, seed: round.seed }).catch(console.error);
    });
  }
});

// ─── Tab bar ──────────────────────────────────────────────────────────────────

const gameView = document.getElementById('game-view');
const lbView   = document.getElementById('leaderboard-view');

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    if (tab.dataset.tab === 'game') {
      gameView.classList.remove('hidden');
      lbView.classList.add('hidden');
    } else {
      gameView.classList.add('hidden');
      lbView.classList.remove('hidden');
    }
  });
});

// ─── Mode ────────────────────────────────────────────────────────────────────

let mode           = 'mouse';  // 'mouse' | 'hand'
let handInput      = null;     // populated lazily in Task 2
let cameraErrorMsg = '';
let hiddenAt       = 0;  // timestamp when HIDDEN state was entered

const mouseInput = createMouseInput(canvas);
let   input      = mouseInput;

// ─── State ───────────────────────────────────────────────────────────────────

let state       = 'IDLE';
let round       = null;
let revealTimer = null;

function handleCommit() {
  switch (state) {
    case 'IDLE':   transition('REVEAL'); break;
    case 'HIDDEN': transition('RESULT'); break;
    case 'RESULT': transition('REVEAL'); break;
  }
}

// Spacebar always advances state regardless of mode.
mouseInput.onCommit(() => handleCommit());

function startNewRound() {
  const seed         = generateSeed();
  const transform    = generateTransform(seed, canvas.width, canvas.height);
  const trueEyeWorld = getEyeWorld(transform);
  return { seed, transform, trueEyeWorld, guess: null, distance: null, hit: null };
}

function transition(newState) {
  if (revealTimer !== null) { clearTimeout(revealTimer); revealTimer = null; }

  state = newState;

  if (newState === 'HIDDEN') {
    hiddenAt = Date.now();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
      <circle cx="20" cy="20" r="10" fill="none" stroke="#f9fafb" stroke-width="2"/>
      <line x1="2" y1="20" x2="38" y2="20" stroke="#f9fafb" stroke-width="2"/>
      <line x1="20" y1="2" x2="20" y2="38" stroke="#f9fafb" stroke-width="2"/>
    </svg>`;
    canvas.style.cursor = mode === 'hand'
      ? 'none'
      : `url("data:image/svg+xml,${encodeURIComponent(svg)}") 20 20, crosshair`;
  } else if (newState === 'REVEAL') {
    canvas.style.cursor = 'none';
  } else {
    canvas.style.cursor = 'default';
  }

  if (newState === 'REVEAL') {
    round = startNewRound();
    track('round_start', { mode });
    // Restart camera if we're in hand mode (was stopped after last RESULT).
    if (mode === 'hand' && handInput) {
      handInput.start().catch(() => {
        cameraErrorMsg = 'Camera unavailable';
        setTimeout(() => { cameraErrorMsg = ''; }, 3000);
      });
    }
    revealTimer = setTimeout(() => transition('HIDDEN'), 1000);
  }

  if (newState === 'RESULT') {
    // Stop camera immediately — no need for it until the next round starts.
    if (mode === 'hand' && handInput) handInput.stop();
    round.guess     = input.getCursor();
    round.timeTaken = (Date.now() - hiddenAt) / 1000;

    const dx       = round.guess.x - round.trueEyeWorld.x;
    const dy       = round.guess.y - round.trueEyeWorld.y;
    round.distance = Math.round(Math.sqrt(dx * dx + dy * dy));
    round.hit      = round.distance <= 12;

    const gx = Math.round((round.guess.x - round.transform.offsetX) / round.transform.scale);
    const gy = Math.round((round.guess.y - round.transform.offsetY) / round.transform.scale);
    round.message  = getMessage(round.distance, round.hit, dx, dy, gx, gy);
    if (round.hit) new Audio('sounds/Koha.mp3').play().catch(() => {});
    track('round_result', {
      hit:       round.hit,
      distance:  round.distance,
      time_taken: Math.round(round.timeTaken * 10) / 10,
      mode,
    });
    console.log(`Seed: ${round.seed} | Distance: ${round.distance}px | EYE_SVG: { x: ${gx}, y: ${gy} }`);

    // Submit score — prompt for name first if not set.
    const submit = (name) => {
      submitScore({ displayName: name, distance: round.distance, timeTaken: round.timeTaken, seed: round.seed })
        .then((score) => { if (score !== null) round.score = score; })
        .catch(console.error);
    };
    if (!getName()) {
      showNamePrompt(submit);
    } else {
      submit(getName());
    }
  }

  syncHtmlOverlays();
}

// ─── Canvas click / hover helpers ────────────────────────────────────────────

canvas.addEventListener('click', () => {
  // IDLE buttons are now HTML — no canvas click handling needed in IDLE.
  // On mobile in tap mode, commit is via the explicit #tap-confirm button.
  if (state === 'HIDDEN' && !(isMobile && mode === 'mouse')) {
    handleCommit();
  }
});


// ─── Mode switching (M / C keys, IDLE only) ──────────────────────────────────

window.addEventListener('keydown', (e) => {
  if (document.activeElement?.tagName === 'INPUT') return;
  if (e.code === 'KeyL' && state === 'RESULT') {
    showLeaderboard = !showLeaderboard;
    return;
  }
  if (e.code === 'KeyN' && state === 'RESULT') {
    showNamePrompt((name) => {
      submitScore({ displayName: name, distance: round.distance, timeTaken: round.timeTaken, seed: round.seed }).catch(console.error);
    });
    return;
  }
  if (state !== 'IDLE' && state !== 'RESULT') return;
  if (e.code === 'KeyM') {
    if (mode === 'hand' && handInput) handInput.stop();
    mode  = 'mouse';
    input = mouseInput;
    transition('REVEAL');
  }
  if (e.code === 'KeyC') {
    switchToHand();
  }
});

async function switchToHand() {
  if (!handInput) {
    handInput = createHandInput(canvas);
    // Pinch only commits the guess — HIDDEN state only.
    handInput.onCommit(() => {
      if (mode === 'hand' && state === 'HIDDEN' && Date.now() - hiddenAt >= 1500) handleCommit();
    });
  }
  try {
    await handInput.start();
    mode  = 'hand';
    input = handInput;
    transition('REVEAL');
  } catch {
    cameraErrorMsg = 'Camera unavailable';
    setTimeout(() => { cameraErrorMsg = ''; }, 3000);
  }
}

// ─── Render loop ──────────────────────────────────────────────────────────────

function loop() {
  draw(ctx, { state, round, mode, cameraErrorMsg, handInput, leaderboard, showLeaderboard, isMobile });
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

// Initialise HTML overlay state for the starting IDLE state.
syncHtmlOverlays();
