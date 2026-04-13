// src/input-mouse.js
export function createMouseInput(canvas) {
  let cursor    = { x: canvas.width / 2, y: canvas.height / 2 };
  const commitCallbacks = [];

  function updateFromClient(clientX, clientY) {
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    cursor.x = (clientX - rect.left) * scaleX;
    cursor.y = (clientY - rect.top)  * scaleY;
  }

  // Mouse movement
  canvas.addEventListener('mousemove', (e) => updateFromClient(e.clientX, e.clientY));

  // Touch movement — updates cursor position; commit is handled separately via button
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // prevent scroll and ghost mouse events
    const t = e.changedTouches[0];
    updateFromClient(t.clientX, t.clientY);
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const t = e.changedTouches[0];
    updateFromClient(t.clientX, t.clientY);
  }, { passive: false });

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
    commit:      ()   => commitCallbacks.forEach((cb) => cb()),
    isDebugMode: () => false,
  };
}
