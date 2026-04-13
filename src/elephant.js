// src/elephant.js
// Elephant asset definition. Uses the actual photo (elephant.jpeg) instead
// of SVG paths — drawn onto canvas with 'screen' blend mode so the black
// blackboard background vanishes, leaving only the white chalk lines.
//
// To recalibrate the eye: hold Shift during HIDDEN (debug mode), place the
// cursor on the visible eye, and check the console distance. Adjust EYE_SVG
// until a perfect aim reads < 5px.

// Path to the elephant image, relative to index.html.
export const IMAGE_SRC = './elephant.jpeg';

// Native dimensions of elephant.jpeg.
export const VIEWBOX = { width: 1184, height: 864 };

// Eye centre in image-native pixel coordinates.
// Upper-left area of the head — the circle the player must memorise.
export const EYE_SVG = { x: 279, y: 238 };

// Axis-aligned bounding box used by board.js for clamping the elephant
// within the canvas. Matches the full image dimensions.
export const SVG_BOUNDS = { minX: 0, maxX: 1184, minY: 0, maxY: 864 };
