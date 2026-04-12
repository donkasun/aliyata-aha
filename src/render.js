// src/render.js
import { BODY_PATH, TRUNK_PATH } from './elephant.js';

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
    drawElephant(ctx, round.transform);
    return;
  }

  if (state === 'HIDDEN') {
    // Instruction text
    ctx.fillStyle    = TEXT_COLOR;
    ctx.font         = '20px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Where is the eye? Press SPACE to confirm.', width / 2, 20);

    // Custom crosshair cursor
    const { x, y } = cursor;
    ctx.strokeStyle = '#f9fafb';
    ctx.lineWidth   = 2;

    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x - 18, y);
    ctx.lineTo(x + 18, y);
    ctx.moveTo(x, y - 18);
    ctx.lineTo(x, y + 18);
    ctx.stroke();

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
