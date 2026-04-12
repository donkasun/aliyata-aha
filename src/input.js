// src/input.js
// Handles keyboard and mouse input.
// Phase 1a: spacebar only. Mouse and debug mode added in Tasks 9 and 12.

export function createInput(canvas) {
  let cursor = { x: canvas.width / 2, y: canvas.height / 2 };
  const commitCallbacks = [];

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      commitCallbacks.forEach((cb) => cb());
    }
  });

  return {
    // Returns current cursor position in canvas (world) space.
    getCursor: () => ({ ...cursor }),
    // Registers a callback fired when the player commits (spacebar).
    onCommit: (cb) => { commitCallbacks.push(cb); },
    // True when Shift is held (debug mode — added in Task 12).
    isDebugMode: () => false,
  };
}
