// src/game.js
import { createMouseInput } from './input-mouse.js';
import { createHandInput }  from './input-hand.js';
import { draw }             from './render.js';
import { generateSeed, generateTransform, getEyeWorld } from './board.js';

const canvas = document.getElementById('game-canvas');
const ctx    = canvas.getContext('2d');

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
    round.guess = input.getCursor();

    const dx       = round.guess.x - round.trueEyeWorld.x;
    const dy       = round.guess.y - round.trueEyeWorld.y;
    round.distance = Math.round(Math.sqrt(dx * dx + dy * dy));
    round.hit      = round.distance <= 12;

    const gx = Math.round((round.guess.x - round.transform.offsetX) / round.transform.scale);
    const gy = Math.round((round.guess.y - round.transform.offsetY) / round.transform.scale);
    console.log(`Seed: ${round.seed} | Distance: ${round.distance}px | EYE_SVG: { x: ${gx}, y: ${gy} }`);
  }
}

// ─── Mode switching (M / C keys, IDLE only) ──────────────────────────────────

window.addEventListener('keydown', (e) => {
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
  draw(ctx, { state, round, debugMode: input.isDebugMode(), mode, cameraErrorMsg, handInput });
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
