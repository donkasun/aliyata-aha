// src/input-mouse.js
export function createMouseInput(canvas) {
  let cursor    = { x: canvas.width / 2, y: canvas.height / 2 };
  const commitCallbacks = [];

  canvas.addEventListener('mousemove', (e) => {
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    cursor.x = (e.clientX - rect.left) * scaleX;
    cursor.y = (e.clientY - rect.top)  * scaleY;
  });

  window.addEventListener('keydown', (e) => {
    if (document.activeElement?.tagName === 'INPUT') return;
    if (e.code === 'Space') {
      e.preventDefault();
      commitCallbacks.forEach((cb) => cb());
    }
  });

  return {
    getCursor:   () => ({ ...cursor }),
    onCommit:    (cb) => { commitCallbacks.push(cb); },
    isDebugMode: () => false,
  };
}
