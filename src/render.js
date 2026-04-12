// src/render.js
import { BODY_PATH, TRUNK_PATH, SVG_BOUNDS } from './elephant.js';

const BG_COLOR   = '#111827';
const TEXT_COLOR = '#f9fafb';

// Cache Path2D objects at module load — creating them is cheap but
// re-creating every frame is unnecessary.
const bodyPath2D  = new Path2D(BODY_PATH);
const trunkPath2D = new Path2D(TRUNK_PATH);

// ─── Elephant drawing helper ──────────────────────────────────────────────────

function drawElephant(ctx, transform) {
  ctx.save();
  ctx.translate(transform.offsetX, transform.offsetY);
  ctx.scale(transform.scale, transform.scale);

  ctx.fillStyle   = '#6b7280';
  ctx.fill(bodyPath2D);
  ctx.fill(trunkPath2D);

  // Keep stroke width at 2px regardless of scale.
  ctx.strokeStyle = '#374151';
  ctx.lineWidth   = 2 / transform.scale;
  ctx.stroke(bodyPath2D);
  ctx.stroke(trunkPath2D);

  ctx.restore();
}

// ─── Center transform (Phase 1b only) ────────────────────────────────────────
// Removed in Task 8 once board.js provides a real per-round transform.

function getCenterTransform(canvas) {
  const scale    = 1.0;
  const svgCx    = (SVG_BOUNDS.minX + SVG_BOUNDS.maxX) / 2; // 379.5
  const svgCy    = (SVG_BOUNDS.minY + SVG_BOUNDS.maxY) / 2; // 260.5
  return {
    offsetX: canvas.width  / 2 - svgCx * scale,
    offsetY: canvas.height / 2 - svgCy * scale,
    scale,
  };
}

// ─── Main draw function ───────────────────────────────────────────────────────

export function draw(ctx, { state, round, cursor, debugMode }) {
  const { width, height } = ctx.canvas;

  // Clear
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, width, height);

  if (state === 'IDLE') {
    ctx.fillStyle    = TEXT_COLOR;
    ctx.font         = '28px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Press SPACE to play', width / 2, height / 2);
    return;
  }

  if (state === 'REVEAL') {
    const transform = round?.transform ?? getCenterTransform(ctx.canvas);
    drawElephant(ctx, transform);
    return;
  }

  if (state === 'HIDDEN') {
    ctx.fillStyle    = TEXT_COLOR;
    ctx.font         = '20px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Where is the eye? Press SPACE to confirm.', width / 2, 20);
    // Cursor added in Task 9.
    return;
  }

  if (state === 'RESULT') {
    ctx.fillStyle    = TEXT_COLOR;
    ctx.font         = '24px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Press SPACE to play again', width / 2, height / 2);
    // Result visualization added in Task 11.
  }
}
