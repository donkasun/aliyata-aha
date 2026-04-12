// src/render.js
import { IMAGE_SRC, VIEWBOX } from './elephant.js';

const BG_COLOR   = '#111827';
const TEXT_COLOR = '#f9fafb';

// Pre-load elephant image once at module load.
const elephantImg = new Image();
elephantImg.src = IMAGE_SRC;

// ─── Elephant drawing helper ──────────────────────────────────────────────────

function drawElephant(ctx, transform) {
  if (!elephantImg.complete || elephantImg.naturalWidth === 0) return;
  const w = VIEWBOX.width  * transform.scale;
  const h = VIEWBOX.height * transform.scale;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.drawImage(elephantImg, transform.offsetX, transform.offsetY, w, h);
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

export function draw(ctx, { state, round, debugMode }) {
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

    return;
  }

  if (state === 'RESULT') {
    // Draw elephant at the same transform used during REVEAL.
    drawElephant(ctx, round.transform);

    const eye = round.trueEyeWorld;
    const g   = round.guess;

    // Tolerance ring (12px radius) around the true eye.
    ctx.beginPath();
    ctx.arc(eye.x, eye.y, 12, 0, Math.PI * 2);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // True eye: small green dot.
    ctx.beginPath();
    ctx.arc(eye.x, eye.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#22c55e';
    ctx.fill();

    // Player's guess: small red dot.
    ctx.beginPath();
    ctx.arc(g.x, g.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();

    // HIT / MISS label.
    ctx.font         = 'bold 36px monospace';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle    = round.hit ? '#22c55e' : '#ef4444';
    ctx.fillText(round.hit ? 'HIT!' : 'MISS', 20, 20);

    // Distance (below label).
    ctx.fillStyle = TEXT_COLOR;
    ctx.font      = '18px monospace';
    ctx.fillText(`${round.distance}px off`, 20, 66);

    // Instruction.
    ctx.font = '16px monospace';
    ctx.fillText('SPACE to play again', 20, 96);
  }
}
