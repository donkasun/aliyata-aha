// src/board.js
// Generates a per-round seeded transform that maps SVG space to world (canvas pixel) space.
// Exposes svgToWorld and getEyeWorld for converting coordinates.

import { EYE_SVG, SVG_BOUNDS } from './elephant.js';

// ─── Seeded PRNG (mulberry32) ─────────────────────────────────────────────────
// Deterministic, fast, ~10 lines. Same seed → same sequence every time.

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed  = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t     = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedToInt(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h;
}

// Generates a short random seed string (6 alphanumeric chars).
export function generateSeed() {
  return Math.random().toString(36).slice(2, 8);
}

// ─── Transform generation ─────────────────────────────────────────────────────

/**
 * Generates a per-round { offsetX, offsetY, scale, seed } transform.
 * The transform maps SVG coordinates to world (canvas pixel) coordinates:
 *   worldX = offsetX + svgX * scale
 *   worldY = offsetY + svgY * scale
 *
 * The elephant is centered on canvas with small random jitter, then clamped
 * to stay fully on-canvas regardless of scale variance.
 */
export function generateTransform(seed, canvasWidth, canvasHeight) {
  const rng   = mulberry32(seedToInt(seed));
  const scale = 0.95 + rng() * 0.10; // [0.95, 1.05]

  // SVG visual dimensions and center.
  const svgW  = SVG_BOUNDS.maxX - SVG_BOUNDS.minX; // ~539
  const svgH  = SVG_BOUNDS.maxY - SVG_BOUNDS.minY; // ~285
  const svgCx = SVG_BOUNDS.minX + svgW / 2;        // ~379.5
  const svgCy = SVG_BOUNDS.minY + svgH / 2;        // ~260.5

  // Base: center of elephant maps to center of canvas.
  let offsetX = canvasWidth  / 2 - svgCx * scale;
  let offsetY = canvasHeight / 2 - svgCy * scale;

  // Random jitter: ±12% of scaled elephant width, ±8% of scaled height.
  offsetX += (rng() * 2 - 1) * 0.12 * svgW * scale;
  offsetY += (rng() * 2 - 1) * 0.08 * svgH * scale;

  // Clamp so the full elephant (including trunk and legs) stays on-canvas.
  const MARGIN = 10;
  const minOX  = -SVG_BOUNDS.minX * scale + MARGIN;
  const maxOX  =  canvasWidth  - SVG_BOUNDS.maxX * scale - MARGIN;
  const minOY  = -SVG_BOUNDS.minY * scale + MARGIN;
  const maxOY  =  canvasHeight - SVG_BOUNDS.maxY * scale - MARGIN;

  offsetX = Math.max(minOX, Math.min(maxOX, offsetX));
  offsetY = Math.max(minOY, Math.min(maxOY, offsetY));

  return { offsetX, offsetY, scale, seed };
}

// ─── Coordinate conversion ────────────────────────────────────────────────────

/** Converts a point in SVG space to world (canvas pixel) space. */
export function svgToWorld(transform, svgX, svgY) {
  return {
    x: transform.offsetX + svgX * transform.scale,
    y: transform.offsetY + svgY * transform.scale,
  };
}

/** Returns the true eye position in world space for a given transform. */
export function getEyeWorld(transform) {
  return svgToWorld(transform, EYE_SVG.x, EYE_SVG.y);
}
