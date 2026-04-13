// src/render.js
import { IMAGE_SRC, VIEWBOX } from './elephant.js';

const BG_COLOR   = '#111827';
const TEXT_COLOR = '#f9fafb';

// ─── Button layout helpers (exported for hit-testing in game.js) ──────────────

export function idleButtonLayout(width, height) {
  const cx = width / 2, cy = height / 2;
  const W = 130, H = 40;
  return [
    { id: 'mouse',  label: '[M] Mouse',  x: cx - 80 - W / 2, y: cy + 20 - H / 2, w: W, h: H },
    { id: 'camera', label: '[C] Camera', x: cx + 80 - W / 2, y: cy + 20 - H / 2, w: W, h: H },
  ];
}

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

// ─── Leaderboard overlay ──────────────────────────────────────────────────────

function drawLeaderboard(ctx, leaderboard, canvasW, canvasH) {
  const PW = 320, PH = Math.min(leaderboard.length * 36 + 80, canvasH - 40);
  const PX = (canvasW - PW) / 2;
  const PY = (canvasH - PH) / 2;

  // Background panel
  ctx.fillStyle = 'rgba(17,24,39,0.95)';
  ctx.beginPath();
  ctx.roundRect(PX, PY, PW, PH, 8);
  ctx.fill();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth   = 2;
  ctx.stroke();

  // Title
  ctx.fillStyle    = '#f59e0b';
  ctx.font         = 'bold 18px monospace';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('🏆  Leaderboard', PX + PW / 2, PY + 14);

  if (leaderboard.length === 0) {
    ctx.fillStyle = '#9ca3af';
    ctx.font      = '14px monospace';
    ctx.fillText('No scores yet', PX + PW / 2, PY + 50);
    return;
  }

  const medals = ['🥇', '🥈', '🥉'];
  leaderboard.forEach((entry, i) => {
    const rowY = PY + 54 + i * 34;
    const rank = medals[i] ?? `${i + 1}.`;

    ctx.textAlign    = 'left';
    ctx.font         = '14px monospace';
    ctx.fillStyle    = i === 0 ? '#f59e0b' : TEXT_COLOR;
    ctx.fillText(`${rank}  ${entry.displayName ?? 'Anonymous'}`, PX + 16, rowY);

    ctx.textAlign    = 'right';
    ctx.fillStyle    = '#22c55e';
    ctx.fillText(`${entry.bestScore ?? 0}`, PX + PW - 16, rowY);
  });

  // Dismiss hint
  ctx.fillStyle    = '#6b7280';
  ctx.font         = '11px monospace';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('[L] close', PX + PW / 2, PY + PH - 8);
}

// ─── Main draw function ───────────────────────────────────────────────────────

export function draw(ctx, { state, round, mode, cameraErrorMsg, handInput, leaderboard = [], showLeaderboard = false }) {
  const { width, height } = ctx.canvas;

  // Clear
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, width, height);

  if (state === 'IDLE') {
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#f59e0b';  // gold
    ctx.font      = '32px sans-serif';
    ctx.fillText('Aliyata Asa Thabeema', width / 2, height / 2 - 30);

    // Mode selector buttons — clickable or keyboard [M] / [C]
    for (const btn of idleButtonLayout(width, height)) {
      const active = (btn.id === 'mouse' && mode === 'mouse') || (btn.id === 'camera' && mode === 'hand');
      // Outline
      ctx.beginPath();
      ctx.roundRect(btn.x, btn.y, btn.w, btn.h, 5);
      ctx.strokeStyle = active ? '#f59e0b' : '#374151';
      ctx.lineWidth   = 1.5;
      ctx.stroke();
      // Label
      ctx.font         = '18px monospace';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle    = active ? '#f59e0b' : '#78350f';
      ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2);
    }

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

    // Leaderboard overlay (toggled with L key).
    if (showLeaderboard) drawLeaderboard(ctx, leaderboard, width, height);
  }
}
