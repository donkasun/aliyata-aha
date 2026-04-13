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
  // Border around the image area, visible in all modes.
  ctx.strokeStyle = '#374151';
  ctx.lineWidth   = 1;
  ctx.strokeRect(transform.offsetX, transform.offsetY, w, h);
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


// ─── Webcam overlay (hand mode, HIDDEN only) ─────────────────────────────────

function drawWebcamOverlay(ctx, handInput, canvasW, canvasH) {
  const video = handInput.getVideoElement();
  if (!video || video.readyState < 2) return;

  const OW = 240, OH = 180;
  const OX = canvasW - OW - 10;
  const OY = canvasH - OH - 10;

  // Draw mirrored webcam feed (flip horizontally so it acts like a mirror).
  ctx.save();
  ctx.translate(OX + OW, OY);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, OW, OH);
  ctx.restore();

  // Thin border around the overlay.
  ctx.strokeStyle = '#374151';
  ctx.lineWidth   = 1;
  ctx.strokeRect(OX, OY, OW, OH);

  // Fingertip dot mapped from world space into overlay coordinates.
  // The video is already mirrored, so X maps straight (no flip needed here).
  const cur  = handInput.getCursor();
  const dotX = OX + (cur.x / canvasW * OW);
  const dotY = OY + (cur.y / canvasH * OH);

  ctx.beginPath();
  ctx.arc(dotX, dotY, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#f9fafb';
  ctx.fill();

  // "show hand" hint when no landmarks are detected.
  if (!handInput.isHandVisible()) {
    ctx.fillStyle    = 'rgba(249,250,251,0.6)';
    ctx.font         = '13px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('show hand', OX + OW / 2, OY + OH / 2);
  }
}

// ─── Main draw function ───────────────────────────────────────────────────────

export function draw(ctx, { state, round, debugMode, mode, cameraErrorMsg, handInput }) {
  const { width, height } = ctx.canvas;

  // Clear
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, width, height);

  if (state === 'IDLE') {
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = TEXT_COLOR;
    ctx.font      = '28px monospace';
    ctx.fillText('Aliyata Asa Thabeema', width / 2, height / 2 - 30);

    // Mode selector — pressing M or C selects mode and starts immediately
    ctx.font      = '18px monospace';
    ctx.fillStyle = TEXT_COLOR;
    ctx.fillText('[M] Mouse',  width / 2 - 80, height / 2 + 20);
    ctx.fillText('[C] Camera', width / 2 + 80, height / 2 + 20);

    if (cameraErrorMsg) {
      ctx.fillStyle = '#ef4444';
      ctx.font      = '16px monospace';
      ctx.fillText(cameraErrorMsg, width / 2, height / 2 + 60);
    }

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
    const hint = mode === 'hand' ? 'Where is the eye? Pinch to confirm.' : 'Where is the eye? Press SPACE to confirm.';
    ctx.fillText(hint, width / 2, 20);

    // Hand cursor on main canvas — draws crosshair at fingertip world position.
    if (mode === 'hand' && handInput) {
      const { x, y } = handInput.getCursor();
      ctx.strokeStyle = '#f9fafb';
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 18, y); ctx.lineTo(x + 18, y);
      ctx.moveTo(x, y - 18); ctx.lineTo(x, y + 18);
      ctx.stroke();
    }

    // Webcam overlay — hand mode only, drawn last so it sits above everything.
    if (mode === 'hand' && handInput) {
      drawWebcamOverlay(ctx, handInput, width, height);
    }

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
    ctx.fillText('SPACE  [M] Mouse  [C] Camera', 20, 96);
  }
}
