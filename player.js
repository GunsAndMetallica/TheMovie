// Basic HTML5 player with play/pause, seek, volume, captions, rate, fullscreen, resume.

const video = document.getElementById('video');
const playPause = document.getElementById('playPause');
const back15 = document.getElementById('back15');
const fwd30 = document.getElementById('fwd30');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const seek = document.getElementById('seek');
const volume = document.getElementById('volume');
const playbackRate = document.getElementById('playbackRate');
const toggleCaptions = document.getElementById('toggleCaptions');
const fullscreenBtn = document.getElementById('fullscreen');
const chaptersEl = document.getElementById('chapters');
const statusEl = document.getElementById('status');

const STORAGE_KEY = 'gh_movie_player_position';
const CHAPTERS = [
  // Example chapters: change to match your movie
  { label: 'Opening', time: 0 },
  { label: 'Act I', time: 15 * 60 },
  { label: 'Act II', time: 55 * 60 },
  { label: 'Intermission', time: 75 * 60 },
  { label: 'Act III', time: 105 * 60 },
  { label: 'Finale', time: 140 * 60 }
];

// Utility: format seconds -> HH:MM:SS
function fmtTime(sec) {
  const s = Math.floor(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const pad = v => String(v).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(r)}`;
}

// Load saved position
function restorePosition() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const t = parseFloat(saved);
      if (!Number.isNaN(t) && t > 0 && t < video.duration) {
        video.currentTime = t;
        statusEl.textContent = `Resumed at ${fmtTime(t)}`;
      }
    }
  } catch {}
}

// Save position periodically
function persistPosition() {
  try {
    localStorage.setItem(STORAGE_KEY, String(video.currentTime));
  } catch {}
}

function updateTimeUI() {
  currentTimeEl.textContent = fmtTime(video.currentTime);
  durationEl.textContent = Number.isFinite(video.duration) ? fmtTime(video.duration) : '--:--:--';
  // Seek range maps 0..1000 to 0..duration
  if (Number.isFinite(video.duration) && video.duration > 0) {
    seek.value = Math.floor((video.currentTime / video.duration) * 1000);
  }
}

function seekToRangeValue(v) {
  if (!Number.isFinite(video.duration) || video.duration <= 0) return;
  const t = (v / 1000) * video.duration;
  video.currentTime = t;
}

function initChapters() {
  chaptersEl.innerHTML = '';
  CHAPTERS.forEach(ch => {
    const btn = document.createElement('button');
    btn.className = 'chapter';
    btn.textContent = ch.label;
    btn.title = fmtTime(ch.time);
    btn.addEventListener('click', () => {
      video.currentTime = Math.min(ch.time, video.duration - 0.1);
      video.play();
    });
    chaptersEl.appendChild(btn);
  });
}

function initTracks() {
  // Toggle first text track
  const tracks = video.textTracks;
  if (tracks && tracks.length) {
    for (let i = 0; i < tracks.length; i++) tracks[i].mode = 'hidden'; // start hidden
  }
}

function toggleFirstTrack() {
  const tracks = video.textTracks;
  if (!tracks || !tracks.length) return;
  const t = tracks[0];
  t.mode = t.mode === 'showing' ? 'hidden' : 'showing';
  statusEl.textContent = t.mode === 'showing' ? 'Captions: On' : 'Captions: Off';
}

function togglePlayPause() {
  if (video.paused) {
    video.play();
  } else {
    video.pause();
  }
}

function requestFullscreen(el) {
  const fn =
    el.requestFullscreen ||
    el.webkitRequestFullscreen ||
    el.msRequestFullscreen;
  if (fn) fn.call(el);
}

function exitFullscreen() {
  const fn =
    document.exitFullscreen ||
    document.webkitExitFullscreen ||
    document.msExitFullscreen;
  if (fn) fn.call(document);
}

function isFullscreen() {
  return document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
}

function initUI() {
  // Buttons
  playPause.addEventListener('click', togglePlayPause);
  back15.addEventListener('click', () => { video.currentTime = Math.max(0, video.currentTime - 15); });
  fwd30.addEventListener('click', () => { video.currentTime = Math.min(video.duration - 0.1, video.currentTime + 30); });

  // Seek
  seek.addEventListener('input', e => { seekToRangeValue(parseFloat(e.target.value)); });
  seek.addEventListener('change', e => { seekToRangeValue(parseFloat(e.target.value)); });

  // Volume
  volume.addEventListener('input', e => { video.volume = parseFloat(e.target.value); });

  // Rate
  playbackRate.addEventListener('change', e => { video.playbackRate = parseFloat(e.target.value); });

  // Captions
  toggleCaptions.addEventListener('click', toggleFirstTrack);

  // Fullscreen
  fullscreenBtn.addEventListener('click', () => {
    const fs = isFullscreen();
    if (fs) exitFullscreen(); else requestFullscreen(document.getElementById('player'));
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    const tag = (e.target && e.target.tagName) || '';
    const isInput = /INPUT|TEXTAREA|SELECT/.test(tag);
    if (isInput) return;

    switch (e.key) {
      case ' ':
        e.preventDefault();
        togglePlayPause();
        break;
      case 'ArrowLeft':
        video.currentTime = Math.max(0, video.currentTime - 5);
        break;
      case 'ArrowRight':
        video.currentTime = Math.min(video.duration - 0.1, video.currentTime + 5);
        break;
      case 'ArrowUp':
        video.volume = Math.min(1, video.volume + 0.1);
        break;
      case 'ArrowDown':
        video.volume = Math.max(0, video.volume - 0.1);
        break;
      case 'f':
      case 'F':
        if (isFullscreen()) exitFullscreen(); else requestFullscreen(document.getElementById('player'));
        break;
      case 'c':
      case 'C':
        toggleFirstTrack();
        break;
      case '>':
      case '.':
        video.playbackRate = Math.min(2, (video.playbackRate + 0.25));
        break;
      case '<':
      case ',':
        video.playbackRate = Math.max(0.5, (video.playbackRate - 0.25));
        break;
    }
  });

  // Status & time updates
  video.addEventListener('play', () => { statusEl.textContent = 'Playing'; });
  video.addEventListener('pause', () => { statusEl.textContent = 'Paused'; });
  video.addEventListener('waiting', () => { statusEl.textContent = 'Buffering…'; });
  video.addEventListener('timeupdate', () => { updateTimeUI(); persistPosition(); });
  video.addEventListener('durationchange', updateTimeUI);
  video.addEventListener('loadedmetadata', () => { updateTimeUI(); restorePosition(); });
}

initTracks();
initChapters();
initUI();
