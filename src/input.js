// src/input.js

export function createInput(canvas) {
  let cursor    = { x: canvas.width / 2, y: canvas.height / 2 };
  let shiftHeld = false;
  const commitCallbacks = [];

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    cursor.x   = e.clientX - rect.left;
    cursor.y   = e.clientY - rect.top;
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      shiftHeld = true;
    }
    if (e.code === 'Space') {
      e.preventDefault();
      commitCallbacks.forEach((cb) => cb());
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      shiftHeld = false;
    }
  });

  return {
    getCursor:   () => ({ ...cursor }),
    onCommit:    (cb) => { commitCallbacks.push(cb); },
    isDebugMode: () => shiftHeld,
  };
}
