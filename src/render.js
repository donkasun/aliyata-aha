// src/render.js
// Draws the current game state to the canvas.
// Pure function of state — never writes to game state, only reads it.
// Extended in Tasks 6, 9, 11, and 12 as game features are added.

const BG_COLOR    = '#111827';
const TEXT_COLOR  = '#f9fafb';

const STATE_LABELS = {
  IDLE:   'Press SPACE to play',
  REVEAL: 'REVEAL',
  HIDDEN: 'HIDDEN — move mouse, press SPACE to guess',
  RESULT: 'RESULT — press SPACE to play again',
};

export function draw(ctx, { state, round, cursor, debugMode }) {
  const { width, height } = ctx.canvas;

  // Clear
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, width, height);

  // State label (centred) — replaced per-state in later tasks
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = '24px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(STATE_LABELS[state] ?? state, width / 2, height / 2);
}
