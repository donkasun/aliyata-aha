# 🐘 Aliyata Aha

**Aliyata Aha** (ඇලියාට ඇහ) is a Sri Lankan Avurudu party game where you try to place an elephant's eye from memory — think *Pin the Tail on the Donkey*, but festive, digital, and scored.

🎮 **[Play now → aliyata-aha.web.app](https://aliyata-aha.web.app)**

---

## How to Play

1. The elephant appears on screen — **memorise where the eye is**
2. The elephant hides
3. Move your cursor (or finger via camera) to where you think the eye was
4. Drop it — and see how close you were!

Two input modes are supported:

| Mode | How to start | How to drop |
|------|-------------|-------------|
| 🖱️ Mouse | Press `M` or click **[M] Mouse** | Click or press `Space` |
| 📷 Camera | Press `C` or click **[C] Camera** | Pinch your index finger and thumb |

Your best score goes on the leaderboard. Higher score = closer to the eye, faster.

---

## Scoring

| Component | Max | Details |
|-----------|-----|---------|
| Accuracy | 1000 | `max(0, 1000 − distance × 5)` |
| Speed bonus | 100 | Full bonus at ≤ 0 s, scales down to 10 s |
| **Total** | **1100** | |

---

## Tech Stack

- Vanilla JS (ES Modules) + HTML5 Canvas — no build step
- [MediaPipe Hands](https://google.github.io/mediapipe/solutions/hands) — camera/gesture input
- [Firebase](https://firebase.google.com/) — anonymous auth, Firestore leaderboard, Hosting

---

## Running Locally

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

No install needed. Firebase features (leaderboard, score saving) are skipped on localhost automatically.

---

## Project Structure

```
├── index.html          # Entry point
├── style.css
├── src/
│   ├── game.js         # Main loop & state machine
│   ├── render.js       # Canvas drawing
│   ├── board.js        # Seed-based elephant placement
│   ├── input-mouse.js  # Mouse / keyboard input
│   ├── input-hand.js   # MediaPipe camera input
│   ├── audio.js        # Music player
│   ├── score.js        # Scoring & Firestore
│   ├── messages.js     # Sinhala result messages
│   └── firebase.js     # Firebase init
├── music/              # Avurudu background tracks
├── sounds/             # Sound effects
└── elephant.jpeg       # Source image
```

---

Made with ❤️ for Avurudu 2026 🎊
