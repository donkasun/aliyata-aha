// src/game.js
import { createMouseInput } from './input-mouse.js';
import { createHandInput }  from './input-hand.js';
import { draw }             from './render.js';
import { generateSeed, generateTransform, getEyeWorld } from './board.js';
import { createPlayer }        from './audio.js';
import { getMessage }          from './messages.js';
import { getName, setName }    from './name-store.js';
import { submitScore, subscribeLeaderboard } from './score.js';

const canvas = document.getElementById('game-canvas');
const ctx    = canvas.getContext('2d');

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
document.getElementById('vol-slider').addEventListener('input', (e) => {
  player.setVolume(e.target.value / 100);
});

updateTrackName();
syncPlayButton();
tryPlayMusic();

// If autoplay was blocked, first key press or click still starts playback.
window.addEventListener('keydown', () => { tryPlayMusic(); }, { once: true });
window.addEventListener('click', () => { tryPlayMusic(); }, { once: true });

// ─── Name overlay ────────────────────────────────────────────────────────────

const nameOverlay  = document.getElementById('name-overlay');
const nameInput    = document.getElementById('name-input');
const nameConfirm  = document.getElementById('name-confirm');

function showNamePrompt(onDone) {
  nameInput.value = getName();
  nameOverlay.classList.remove('hidden');
  nameInput.focus();

  function confirm() {
    const name = nameInput.value.trim();
    if (!name) return;
    setName(name);
    nameOverlay.classList.add('hidden');
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

subscribeLeaderboard((rows) => { leaderboard = rows; });

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
    revealTimer = setTimeout(() => transition('HIDDEN'), 1000);
  }

  if (newState === 'RESULT') {
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
}

// ─── Mode switching (M / C keys, IDLE only) ──────────────────────────────────

window.addEventListener('keydown', (e) => {
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
  draw(ctx, { state, round, debugMode: input.isDebugMode(), mode, cameraErrorMsg, handInput, leaderboard, showLeaderboard });
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
