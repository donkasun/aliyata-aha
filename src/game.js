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

  if (newState === 'REVEAL') {
    round = startNewRound();
    revealTimer = setTimeout(() => transition('HIDDEN'), 1000);
  }

  if (newState === 'RESULT') {
    round.guess = input.getCursor();

    const dx        = round.guess.x - round.trueEyeWorld.x;
    const dy        = round.guess.y - round.trueEyeWorld.y;
    round.distance  = Math.round(Math.sqrt(dx * dx + dy * dy));

    console.log(`Seed: ${round.seed} | Distance: ${round.distance}px`);
  }
}

// ─── Input handler ────────────────────────────────────────────────────────────

input.onCommit(() => {
  switch (state) {
    case 'IDLE':   transition('REVEAL'); break;
    case 'HIDDEN': transition('RESULT'); break;
    case 'RESULT': transition('IDLE');   break;
  }
});

// ─── Render loop ──────────────────────────────────────────────────────────────

function loop() {
  draw(ctx, { state, round, cursor: input.getCursor(), debugMode: input.isDebugMode() });
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
