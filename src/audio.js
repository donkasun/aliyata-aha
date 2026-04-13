// src/audio.js
// Background music player. Add filenames to TRACKS as new MP3s are added to music/.

const TRACKS = [
  'music/Sirilaka Piri Aurudu Siri - Aurudu Song Rupavahini Official Video 2012.mp3',
  'music/Me Awurudu Kale  ම අවරද කල - Lionel Ranwala , Ranwala Balakaya.mp3',
  'music/ITN සරය මගලයය තම ගතය  Soorya Mangalya Theme Song 2014.mp3',
];

// Shuffle array in place (Fisher-Yates).
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function createPlayer() {
  const queue   = shuffle([...TRACKS]);
  let   index   = 0;
  const audio   = new Audio();
  audio.volume  = 0.20;

  function load(i) {
    index       = ((i % queue.length) + queue.length) % queue.length;
    audio.src   = queue[index];
    audio.load();
  }

  audio.addEventListener('ended', () => { load(index + 1); audio.play().catch(() => {}); });
  load(0);

  return {
    play()           { return audio.play(); },
    pause()          { audio.pause(); },
    toggle()         { audio.paused ? audio.play().catch(() => {}) : audio.pause(); },
    next()           { load(index + 1); audio.play().catch(() => {}); },
    prev()           { load(index - 1); audio.play().catch(() => {}); },
    setVolume(v)     { audio.volume = Math.max(0, Math.min(1, v)); },
    getVolume()      { return audio.volume; },
    isPaused()       { return audio.paused; },
    trackName()      { return queue[index].split('/').pop().replace('.mp3', ''); },
  };
}
