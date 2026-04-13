// src/input-hand.js
// Hand tracking using MediaPipe Hands (loaded via CDN as window.Hands / window.Camera).
// Exposes the same { getCursor(), onCommit(cb), isDebugMode() } interface as input-mouse.js,
// plus { start(), stop(), isHandVisible(), getVideoElement() }.

export function createHandInput(canvas) {
  let cursor      = { x: canvas.width / 2, y: canvas.height / 2 };
  let wasOpen     = true;
  let handVisible = false;
  const commitCallbacks = [];

  const video = document.getElementById('hand-feed');

  const hands = new window.Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  });

  hands.setOptions({
    maxNumHands:            1,
    modelComplexity:        0,   // lite model — faster on mobile
    minDetectionConfidence: 0.7,
    minTrackingConfidence:  0.5,
  });

  hands.onResults((results) => {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      handVisible = false;
      return;
    }
    handVisible = true;
    const lm = results.multiHandLandmarks[0];

    // Landmark 8 = index fingertip → cursor, mirrored horizontally.
    cursor.x = (1 - lm[8].x) * canvas.width;
    cursor.y =      lm[8].y  * canvas.height;

    // Pinch: normalised distance between thumb tip (4) and index tip (8).
    const dx      = lm[4].x - lm[8].x;
    const dy      = lm[4].y - lm[8].y;
    const pinched = Math.sqrt(dx * dx + dy * dy) < 0.05;

    // Fire on leading edge only (open → pinched transition).
    if (pinched && wasOpen) {
      wasOpen = false;
      commitCallbacks.forEach((cb) => cb());
    } else if (!pinched) {
      wasOpen = true;
    }
  });

  let camera  = null;
  let warmed  = false;

  /** Send one blank frame so MediaPipe downloads and compiles the model in the background. */
  async function warmUp() {
    if (warmed) return;
    warmed = true;
    try {
      const offscreen = document.createElement('canvas');
      offscreen.width = 1; offscreen.height = 1;
      await hands.send({ image: offscreen });
    } catch {
      // ignore — warm-up is best-effort
    }
  }

  return {
    getCursor:       () => ({ ...cursor }),
    onCommit:        (cb) => { commitCallbacks.push(cb); },
    isDebugMode:     () => false,
    isHandVisible:   () => handVisible,
    getVideoElement: () => video,
    warmUp,

    start() {
      return new Promise((resolve, reject) => {
        camera = new window.Camera(video, {
          onFrame: async () => { await hands.send({ image: video }); },
          width:   640,
          height:  480,
        });
        camera.start().then(resolve).catch(reject);
      });
    },

    stop() {
      if (camera) { camera.stop(); camera = null; }
      handVisible = false;
    },
  };
}
