// src/game.js
// Entry point. Owns the game state machine and the requestAnimationFrame loop.
// Imports all other modules. Nothing else imports game.js.

import { createInput } from './input.js';
import { draw }        from './render.js';
import { generateSeed, generateTransform, getEyeWorld } from './board.js';

const canvas = document.getElementById('game-canvas');
const ctx    = canvas.getContext('2d');
const input  = createInput(canvas);

// ─── State ───────────────────────────────────────────────────────────────────

let state       = 'IDLE';   // 'IDLE' | 'REVEAL' | 'HIDDEN' | 'RESULT'
let round       = null;     // populated at start of each round
let revealTimer = null;

function startNewRound() {
  const seed         = generateSeed();
  const transform    = generateTransform(seed, canvas.width, canvas.height);
  const trueEyeWorld = getEyeWorld(transform);
  return { seed, transform, trueEyeWorld, guess: null, distance: null };
}

function transition(newState) {
  if (revealTimer !== null) {
    clearTimeout(revealTimer);
    revealTimer = null;
  }

  state = newState;

  // During REVEAL: hide cursor entirely.
  // During HIDDEN: use a native SVG cursor (zero-lag, hardware-accelerated).
  // During IDLE/RESULT: default pointer.
  if (newState === 'HIDDEN') {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
      <circle cx="20" cy="20" r="10" fill="none" stroke="#f9fafb" stroke-width="2"/>
      <line x1="2" y1="20" x2="38" y2="20" stroke="#f9fafb" stroke-width="2"/>
      <line x1="20" y1="2" x2="20" y2="38" stroke="#f9fafb" stroke-width="2"/>
    </svg>`;
    canvas.style.cursor = `url("data:image/svg+xml,${encodeURIComponent(svg)}") 20 20, crosshair`;
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

    const dx        = round.guess.x - round.trueEyeWorld.x;
    const dy        = round.guess.y - round.trueEyeWorld.y;
    round.distance  = Math.round(Math.sqrt(dx * dx + dy * dy));
    round.hit       = round.distance <= 12;

    const gx = Math.round((round.guess.x - round.transform.offsetX) / round.transform.scale);
    const gy = Math.round((round.guess.y - round.transform.offsetY) / round.transform.scale);
    console.log(`Seed: ${round.seed} | Distance: ${round.distance}px | EYE_SVG: { x: ${gx}, y: ${gy} }`);
  }
}

// ─── Input handler ────────────────────────────────────────────────────────────

input.onCommit(() => {
  switch (state) {
    case 'IDLE':   transition('REVEAL'); break;
    case 'HIDDEN': transition('RESULT'); break;
    case 'RESULT': transition('REVEAL'); break;
  }
});

// ─── Render loop ──────────────────────────────────────────────────────────────

function loop() {
  draw(ctx, { state, round, debugMode: input.isDebugMode() });
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
