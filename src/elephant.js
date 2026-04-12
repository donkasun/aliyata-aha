// src/elephant.js
// Left-facing elephant silhouette, viewBox 0 0 800 500.
// Reference: chalk-drawing style — large rounded ear, long curling trunk, round body.
//
// To update the art: edit the paths, then update EYE_SVG to match
// the new eye centre, and SVG_BOUNDS to the new path extents.
// board.js and render.js pick up changes automatically.

// ─── Body (head + torso + 4 legs, trunk and ear are separate paths) ───────────
// Clockwise from top of head. Elephant faces left.
export const BODY_PATH = `
  M 192,108
  Q 188,86 218,78 Q 278,65 358,68 Q 450,63 538,76
  Q 625,90 675,132 Q 718,172 722,234
  Q 728,295 704,334
  L 704,436 L 660,436 L 658,337
  L 602,337 L 600,436 L 556,436 L 554,337
  Q 490,330 430,334
  L 428,436 L 384,436 L 382,334
  L 326,334 L 324,436 L 280,436 L 278,334
  Q 248,324 225,302 Q 200,278 183,246
  Q 168,218 166,192 Q 163,162 172,140
  Q 180,120 192,108 Z
`;

// ─── Ear (large rounded shape, drawn first so body overlaps the join) ─────────
export const EAR_PATH = `
  M 218,78
  Q 272,36 352,28 Q 435,20 468,76
  Q 502,132 472,188 Q 442,244 375,252
  Q 308,260 265,220 Q 228,186 226,146
  Q 222,110 218,78 Z
`;

// ─── Trunk (from lower face, curves down, tip curls back up) ──────────────────
export const TRUNK_PATH = `
  M 166,192
  Q 136,208 108,246 Q 78,286 68,328
  Q 56,372 72,402 Q 88,432 120,432
  Q 154,434 168,408 Q 182,380 168,348
  Q 156,320 158,290 Q 160,265 172,248
  Q 172,218 166,192 Z
`;

// ─── Eye ──────────────────────────────────────────────────────────────────────
// Centre of the eye in SVG space — the scoring target the player must memorise.
export const EYE_SVG = { x: 176, y: 148 };

// ─── Bounds ───────────────────────────────────────────────────────────────────
// Axis-aligned bounding box of all paths. Used by board.js for clamping.
export const SVG_BOUNDS = { minX: 56, maxX: 722, minY: 20, maxY: 436 };

export const VIEWBOX = { width: 800, height: 500 };
