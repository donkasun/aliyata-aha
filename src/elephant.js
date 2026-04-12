// src/elephant.js
// Defines the elephant's SVG geometry in its own coordinate space.
// viewBox: 0 0 800 500. Elephant faces right, trunk hangs down.
//
// To update the elephant art: edit BODY_PATH and TRUNK_PATH,
// then update EYE_SVG to match the new eye location,
// and update SVG_BOUNDS to the new path extents.
// Nothing else needs to change.

// Rough silhouette: body + head as one connected shape.
// Legs are simplified stubs at the bottom.
export const BODY_PATH = `
  M 150,390 L 150,360 L 110,360 L 110,246
  Q 116,178 181,155 Q 250,130 341,124
  Q 430,118 505,133 Q 562,148 592,184
  Q 624,221 619,265 Q 616,301 593,321
  Q 572,337 546,342 L 546,382 L 506,382 L 506,344
  L 448,344 L 448,382 L 386,382 L 386,344
  L 325,344 L 325,382 L 265,382 L 265,344
  Q 224,336 199,312 Q 174,285 162,258 Q 150,231 150,210 Z
`;

// Trunk hangs from the right side of the head, curving slightly.
export const TRUNK_PATH = `
  M 614,272 Q 637,308 643,347 Q 649,378 633,393
  Q 622,403 606,398 Q 589,392 588,373
  Q 586,350 594,320 Q 602,293 614,268 Z
`;

// Eye location in SVG space.
// This is the target the player must place the eye on.
// Used by board.js to compute trueEyeWorld each round.
export const EYE_SVG = { x: 578, y: 200 };

// Axis-aligned bounding box of all paths in SVG space.
// Used by board.js to clamp the elephant within the canvas.
export const SVG_BOUNDS = { minX: 110, maxX: 649, minY: 118, maxY: 403 };

// SVG viewBox dimensions.
export const VIEWBOX = { width: 800, height: 500 };
