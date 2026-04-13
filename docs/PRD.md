# EyeDrop — Project Document

> A browser-based Sri Lankan Avurudu game where players use their hands to place the eye on the elephant.

***

## Executive Summary

EyeDrop is a webcam-powered browser game inspired by **Aliyata Asa Thabeema** (අලියාට ඇස තැබීමේ), the traditional Sri Lankan New Year game where a blindfolded person walks to a board and places the eye on a drawn elephant. The web version replaces the physical blindfold with a **flash-hide mechanic** — the elephant is shown briefly, then hidden, and the player must place the eye from memory using their hand tracked by the laptop camera.

The project is built to drive social media engagement on Reddit and LinkedIn. The game is designed to look entertaining in a 10–15 second demo clip, be instantly understandable by any audience, and generate conversation around Sri Lankan culture and creative web development.

***

## Background & Inspiration

The traditional game is a well-known part of Sinhala and Tamil New Year (Avurudu) celebrations in Sri Lanka, typically played at community events and family gatherings. A player is blindfolded, spun around, and must walk to a board and draw or place the elephant's eye as accurately as possible. The game combines memory, spatial awareness, and the comedy of being disoriented.

EyeDrop adapts this for the web:
- No physical blindfold needed
- Playable solo or in a party ("next player") format
- Works on any laptop with a camera
- Shareable result card for social media

The game is named **EyeDrop** — a double meaning of dropping the eye onto the board and the Sri Lankan elephant reference. It works as a brand name for both Sri Lankan and international audiences.

***

## Game Mechanics

### Core Loop

1. Player enters their display name
2. Round begins — elephant board appears on screen at a slightly randomised position
3. After **2 seconds**, the elephant is hidden (flash-hide)
4. Player moves their index fingertip (tracked by camera) to where they believe the eye should be
5. Player drops the eye by **pinching** or pressing **spacebar**
6. Elephant reappears — actual eye position and player's placed position are revealed
7. Score calculated based on distance accuracy and speed
8. Result screen shown — player can retry or submit to leaderboard

### Flash-Hide Mechanic

The elephant is visible for a fixed window (default 2 seconds), then hidden. The player must rely on short-term visual memory to place the eye accurately. This directly mirrors the disorientation of the physical blindfold.

### Anti-Cheat: Random Elephant Repositioning

A key design decision: the elephant board is repositioned slightly every round within safe bounds, preventing players from marking their screen to cheat.

- Horizontal shift: ±5–12% of board width
- Vertical shift: ±3–8% of board height
- Scale variance: 0.95x to 1.05x
- The true eye position is always calculated relative to the elephant's current rendered position, not fixed screen coordinates

This makes every round unique while keeping the game feel fair and consistent.

### Scoring Model

| Factor | Weight | Notes |
|--------|--------|-------|
| Accuracy (distance from true eye) | Primary | Lower distance = higher score |
| Speed (time to place after hide) | Secondary bonus | Faster = small bonus points |
| Tie-break | Tertiary | Shortest distance, then fastest time |

Example score messages based on distance:
- 0–10px: "Perfect! ඔය ඇස හරිම හරි!"
- 11–30px: "Very close! තව ටිකක් හොඳයි!"
- 31–60px: "Not bad! හොඳ උත්සාහයක්!"
- 61–100px: "That's the ear, not the eye!"
- 100px+: "You got the wall, not the elephant 😂"

### Controls

| Method | Description |
|--------|-------------|
| MediaPipe fingertip tracking | Primary — index fingertip moves the eye cursor |
| Pinch gesture | Confirm placement |
| Spacebar / Enter | Fallback confirm for low-light environments |

The keyboard fallback is important for reliable demos in varying lighting conditions.

***

## Visual Design Direction

### Theme
Playful, festive Avurudu aesthetic — warm colours, traditional Sri Lankan patterns as accents, bold typography.

### Colour Palette
Inspired by traditional Avurudu decorations: deep saffron, warm red, ivory white, and forest green accents.

### Elephant Board
Custom SVG illustration — hand-drawn style, expressive, friendly. The eye target is a precise coordinate within the SVG that is used for scoring calculations.

### Result Screen
Designed to be screenshot-friendly and shareable:
- Player name prominently displayed
- Score and distance shown in large type
- EyeDrop branding and URL
- Funny Sinhala/English reaction message
- "Download result card" button via html2canvas

***

## Tech Stack

### Frontend

| Tool | Role |
|------|------|
| HTML5 Canvas + Vanilla JS | Game board, animations, coordinate logic |
| MediaPipe Hands (Google) | Browser-based webcam hand tracking |
| Howler.js | Sound effects (rabana drum, cheer, fail sounds) |
| html2canvas | Screenshot result screen for social sharing |
| Google Fonts / Fontshare | Typography |
| Custom SVG | Elephant board illustration and logo |

### Backend

| Tool | Role |
|------|------|
| Firebase Anonymous Auth | Silent user identity — no sign-up required |
| Firebase Firestore | Store scores, player names, session data |
| Firestore `onSnapshot` | Real-time leaderboard updates |
| Firebase Hosting | Deploy and serve the game |

### DevOps

| Tool | Role |
|------|------|
| GitHub | Source control |
| Firebase CLI | Deploy to Firebase Hosting from terminal |

### Open Graph & Sharing

| Element | Purpose |
|---------|---------|
| `og:title`, `og:image`, `og:description` | Rich link previews on LinkedIn and Reddit |
| html2canvas result card | Downloadable PNG for posts and stories |

***

## System Architecture

```
Player opens link (Firebase Hosting)
         ↓
Browser loads game (HTML/CSS/JS + Canvas)
         ↓
MediaPipe reads webcam → tracks index fingertip
         ↓
Flash-hide round → elephant hidden → player places eye
         ↓
Score calculated (distance + speed)
         ↓
Result screen → html2canvas → player downloads card
         ↓
Score submitted to Firestore
         ↓
Leaderboard updates live (onSnapshot listener)
```

***

## User Identity & Session Model

### Authentication

Firebase Anonymous Auth is used silently on every page load. No sign-up, no password, no email. Firebase creates a persistent `uid` stored in the browser's IndexedDB and recognised on return visits.

An optional **Google Sign-In** button is offered after a competitive score is posted, allowing players to preserve their identity across devices.

### Retry Policy

**Best score policy** — players can retry unlimited times. Only their personal best score is shown on the leaderboard. This maximises engagement and encourages players to share when they beat their own record.

For live Avurudu events, an **Event Mode** can be toggled by the host: each player gets one attempt before the game resets for the next player.

### Firestore Data Model

```
users/
  {uid}/
    displayName:    "Kasun"
    bestScore:      94
    bestDistance:   12          ← pixels from true eye
    totalAttempts:  7
    firstPlayed:    timestamp
    lastPlayed:     timestamp

scores/
  {scoreId}/
    uid:            "abc123"
    displayName:    "Kasun"
    score:          94
    distance:       12
    timeTaken:      3.4         ← seconds
    roundSeed:      "r7f2k"     ← for server-side validation later
    timestamp:      serverTimestamp()
```

### Leaderboard Query

```javascript
const q = query(
  collection(db, "scores"),
  orderBy("score", "desc"),
  limit(10)
);
onSnapshot(q, (snapshot) => {
  // update leaderboard UI live
});
```

***

## Build Phases

### Phase 1 — Game Prototype
- HTML Canvas with elephant SVG
- Flash-hide mechanic (2-second reveal, then hide)
- Mouse-controlled eye cursor (no camera yet)
- Random elephant reposition per round
- Distance scoring and result screen
- Keyboard spacebar confirm

**Goal:** Prove the game loop feels right before adding complexity.

### Phase 2 — Hand Tracking
- Integrate MediaPipe Hands via CDN
- Replace mouse cursor with index fingertip tracker
- Add pinch-to-drop gesture
- Retain keyboard fallback
- Test in varying lighting conditions

**Goal:** Core interaction works reliably on a laptop camera.

### Phase 3 — Polish
- Festive Avurudu visual theme (SVG elephant, colours, fonts)
- Sound effects via Howler.js
- Animated result screen with score reveal
- Funny distance-based reaction messages in Sinhala and English
- Smooth transitions between game states

**Goal:** The game looks and feels good enough to record a demo clip.

### Phase 4 — Firebase & Leaderboard
- Firebase project setup (Auth, Firestore, Hosting)
- Anonymous Auth on page load
- Player name input (saved once, persisted)
- Score submission to Firestore
- Top-10 live leaderboard with `onSnapshot`
- Optional Google Sign-In after a good score
- Event Mode toggle

**Goal:** Multiple players can compete and see a shared leaderboard.

### Phase 5 — Sharing & Deploy
- Result card via html2canvas (score, name, distance, branding)
- Open Graph meta tags for rich link previews
- Final QA at desktop and mobile
- Deploy to Firebase Hosting
- Record 15-second demo clip

**Goal:** The game is live, shareable, and ready to post.

***

## Social Media Strategy

### Goal
Drive engagement on Reddit and LinkedIn that points back to the creator's LinkedIn profile. The game itself is the content — it should create enough curiosity that viewers want to know who built it.

### Reddit Approach
Post in relevant communities (r/webdev, r/gamedev, r/srilanka, r/InternetIsBeautiful).

- **Title format:** "I built a webcam version of the Sri Lankan Avurudu game where you place the elephant's eye with your hand"
- Show a short clip (10–15 seconds)
- Ask one specific question: "Which blindfold mode should I add next?"
- Reply quickly to every comment in the first 30 minutes
- No hard sell, no link dump

### LinkedIn Approach
Frame the post as a project story, not a product promotion.

- **Hook:** "I grew up watching people try to place the elephant's eye blindfolded at Avurudu. I decided to build a web version."
- Brief story: what inspired it, one technical challenge solved
- Demo video or screenshot
- Soft invite: "Would you try this at your Avurudu gathering?"
- No links in the first comment until engagement starts

### Shareable Result Card
The result card (generated via html2canvas) is designed to be pasted directly into LinkedIn posts and stories. It shows the player's name, score, distance error, and a funny reaction. This creates organic secondary sharing when players post their own results.

### Suggested Posting Sequence
1. Post on Reddit first for organic discovery
2. Cross-post the Reddit discussion to LinkedIn with the build story
3. Comment on your own LinkedIn post with a link to play
4. Ask your network to share their result cards

***

## Cost & Infrastructure

All services run on free tiers for the initial launch:

| Service | Free Tier Limit |
|---------|----------------|
| Firebase Hosting | 10GB bandwidth/month |
| Firestore | 50,000 reads/day, 20,000 writes/day, 1GB storage |
| Firebase Auth | Unlimited anonymous users |
| MediaPipe Hands | Open source, runs in browser |
| Howler.js | Open source |
| html2canvas | Open source |

The free tier is sufficient unless the game goes unexpectedly viral, which would be a welcome problem.

***

## Future Enhancements (Post-Launch)

- **Multiplayer mode:** Two players on separate devices, same elephant, who is closer wins
- **Round variations:** Torch mode (small spotlight), Blur mode, Mirror controls
- **Daily leaderboard:** Resets each day, encourages daily return visits
- **Custom elephant upload:** Community-submitted elephant drawings
- **Tamil New Year theme:** Same game, alternate cultural assets for Thai Pongal
- **Projector event mode:** Full-screen leaderboard view for community Avurudu events
- **Mobile support:** Touch-based placement for phones

***

*EyeDrop — Play the tradition. Beat the memory.*