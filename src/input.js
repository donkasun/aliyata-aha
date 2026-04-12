// src/input.js
// Phase 1a+: spacebar handler.
// Phase 1d: mouse position tracking.
// Phase 1d (Task 12): Shift key debug mode.

export function createInput(canvas) {
  // Initialise cursor at canvas centre so there's no jump on first frame.
  let cursor = { x: canvas.width / 2, y: canvas.height / 2 };
  const commitCallbacks = [];

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    cursor.x   = e.clientX - rect.left;
    cursor.y   = e.clientY - rect.top;
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      commitCallbacks.forEach((cb) => cb());
    }
  });

  return {
    getCursor:   () => ({ ...cursor }),
    onCommit:    (cb) => { commitCallbacks.push(cb); },
    isDebugMode: () => false, // Shift tracking added in Task 12
  };
}
