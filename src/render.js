// src/render.js
import { BODY_PATH, TRUNK_PATH, EAR_PATH } from './elephant.js';

const BG_COLOR   = '#111827';
const TEXT_COLOR = '#f9fafb';

// Cache Path2D objects at module load.
const bodyPath2D  = new Path2D(BODY_PATH);
const trunkPath2D = new Path2D(TRUNK_PATH);
const earPath2D   = new Path2D(EAR_PATH);

// ─── Elephant drawing helper ──────────────────────────────────────────────────

function drawElephant(ctx, transform) {
  ctx.save();
  ctx.translate(transform.offsetX, transform.offsetY);
  ctx.scale(transform.scale, transform.scale);

  const strokeW = 2 / transform.scale;

  // Ear first (behind body)
  ctx.fillStyle   = '#7c8898';
  ctx.strokeStyle = '#374151';
  ctx.lineWidth   = strokeW;
  ctx.fill(earPath2D);
  ctx.stroke(earPath2D);

  // Body + head
  ctx.fillStyle = '#6b7280';
  ctx.fill(bodyPath2D);
  ctx.stroke(bodyPath2D);

  // Trunk (in front of body)
  ctx.fill(trunkPath2D);
  ctx.stroke(trunkPath2D);

  ctx.restore();
}

// ─── Eye marker (shown during REVEAL so player knows what to memorise) ────────

function drawEyeMarker(ctx, eyeWorld) {
  // Outer circle
  ctx.beginPath();
  ctx.arc(eyeWorld.x, eyeWorld.y, 9, 0, Math.PI * 2);
  ctx.fillStyle   = '#111827';
  ctx.fill();
  ctx.strokeStyle = '#f9fafb';
  ctx.lineWidth   = 2;
  ctx.stroke();
  // Inner pupil dot
  ctx.beginPath();
  ctx.arc(eyeWorld.x, eyeWorld.y, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#f9fafb';
  ctx.fill();
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
    drawEyeMarker(ctx, round.trueEyeWorld); // show eye — player memorises its position
    return;
  }

  if (state === 'HIDDEN') {
    // Debug mode: show elephant faintly so you can verify coordinate accuracy.
    if (debugMode && round?.transform) {
      ctx.save();
      ctx.globalAlpha = 0.25;
      drawElephant(ctx, round.transform);
      ctx.restore();
    }

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
    // Draw elephant at the same transform used during REVEAL.
    drawElephant(ctx, round.transform);

    // True eye: green dot (where it actually was).
    const eye = round.trueEyeWorld;
    ctx.beginPath();
    ctx.arc(eye.x, eye.y, 10, 0, Math.PI * 2);
    ctx.fillStyle   = '#22c55e';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 2;
    ctx.stroke();

    // Player's guess: red dot (where they placed it).
    const g = round.guess;
    ctx.beginPath();
    ctx.arc(g.x, g.y, 10, 0, Math.PI * 2);
    ctx.fillStyle   = '#ef4444';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 2;
    ctx.stroke();

    // Distance text (top-left).
    ctx.fillStyle    = TEXT_COLOR;
    ctx.font         = 'bold 30px monospace';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Distance: ${round.distance}px`, 20, 20);

    // Instruction (below distance).
    ctx.font = '18px monospace';
    ctx.fillText('SPACE to play again', 20, 62);
  }
}
