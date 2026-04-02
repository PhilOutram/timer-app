/* app.js — Rummikub Turn Timer */

document.addEventListener('DOMContentLoaded', () => {

  // ── DOM refs ──────────────────────────────────────────────
  const timerDisplay  = document.getElementById('timerDisplay');
  const ringProgress  = document.getElementById('ringProgress');
  const timerCard     = document.getElementById('timerCard');
  const btnPlayPause  = document.getElementById('btnPlayPause');
  const btnSkip       = document.getElementById('btnSkip');
  const btnMinus      = document.getElementById('btnMinus');
  const btnPlus       = document.getElementById('btnPlus');
  const adjLabel      = document.getElementById('adjLabel');
  const playPauseLabel= document.getElementById('playPauseLabel');
  const iconPlay      = btnPlayPause.querySelector('.icon-play');
  const iconPause     = btnPlayPause.querySelector('.icon-pause');
  const versionLabel  = document.getElementById('versionLabel');

  // ── State ─────────────────────────────────────────────────
  const STORAGE_KEY = 'gameTimer_turnTime';
  const saved = parseInt(localStorage.getItem(STORAGE_KEY), 10);
  let turnTime = (saved && saved >= CONFIG.minTime && saved <= CONFIG.maxTime)
    ? saved
    : CONFIG.defaultTime;
  let timeLeft   = turnTime;
  let isRunning  = false;
  let intervalId = null;
  const RING_CIRC = 597; // 2πr where r=95

  // ── Init ──────────────────────────────────────────────────
  versionLabel.textContent = CONFIG.version;
  renderDisplay();

  // ── Audio beep (Web Audio API — no files needed) ──────────
  function beep(frequency = 880, duration = 180, volume = 0.4) {
    try {
      const ctx  = new (window.AudioContext || window.webkitAudioContext)();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type      = 'sine';
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration / 1000);
    } catch (e) {
      // Audio not available — silent fail
    }
  }

  function playEndChime() {
    // Three ascending beeps
    beep(660, 160, 0.4);
    setTimeout(() => beep(880, 160, 0.4), 200);
    setTimeout(() => beep(1100, 300, 0.5), 400);
  }

  // ── Display helpers ───────────────────────────────────────
  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0
      ? `${m}:${String(s).padStart(2, '0')}`
      : `${s}`;
  }

  function renderDisplay() {
    timerDisplay.textContent = formatTime(timeLeft);

    // Ring progress
    const fraction = timeLeft / turnTime;
    const offset   = RING_CIRC * (1 - fraction);
    ringProgress.style.strokeDashoffset = offset;

    // Urgency styling (last 10s)
    const urgent = timeLeft <= 10 && timeLeft > 0;
    ringProgress.classList.toggle('urgent', urgent);
    timerDisplay.classList.toggle('urgent', urgent);
  }

  function updateAdjLabel() {
    adjLabel.textContent = `${turnTime}s per turn`;
  }

  function setPlayPauseUI(running) {
    if (running) {
      iconPlay.style.display  = 'none';
      iconPause.style.display = '';
      playPauseLabel.textContent = 'Pause';
    } else {
      iconPlay.style.display  = '';
      iconPause.style.display = 'none';
      playPauseLabel.textContent = 'Play';
    }
  }

  // ── Timer logic ───────────────────────────────────────────
  function startTimer() {
    if (isRunning) return;
    isRunning = true;
    setPlayPauseUI(true);
    intervalId = setInterval(tick, 1000);
  }

  function pauseTimer() {
    if (!isRunning) return;
    isRunning = false;
    clearInterval(intervalId);
    intervalId = null;
    setPlayPauseUI(false);
  }

  function resetTimer() {
    pauseTimer();
    timeLeft = turnTime;
    renderDisplay();
    timerCard.classList.remove('beeping');
  }

  function skipTurn() {
    // Stop current countdown, reset and immediately start for next player
    resetTimer();
    startTimer();
  }

  function tick() {
    if (timeLeft > 0) {
      timeLeft--;
      renderDisplay();
    }

    if (timeLeft === 0) {
      // Time's up!
      clearInterval(intervalId);
      intervalId = null;
      isRunning = false;
      setPlayPauseUI(false);
      playEndChime();

      // Flash the card
      timerCard.classList.add('beeping');
      setTimeout(() => timerCard.classList.remove('beeping'), 1600);

      // Auto-restart after a short pause (next player)
      setTimeout(() => {
        timeLeft = turnTime;
        renderDisplay();
        startTimer();
      }, 1800);
    }
  }

  // ── Button handlers ───────────────────────────────────────
  btnPlayPause.addEventListener('click', () => {
    if (isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  });

  btnSkip.addEventListener('click', () => {
    skipTurn();
  });

  btnMinus.addEventListener('click', () => {
    if (turnTime - CONFIG.timeStep < CONFIG.minTime) return;
    turnTime -= CONFIG.timeStep;
    localStorage.setItem(STORAGE_KEY, turnTime);
    if (!isRunning) { timeLeft = turnTime; renderDisplay(); }
    updateAdjLabel();
  });

  btnPlus.addEventListener('click', () => {
    if (turnTime + CONFIG.timeStep > CONFIG.maxTime) return;
    turnTime += CONFIG.timeStep;
    localStorage.setItem(STORAGE_KEY, turnTime);
    if (!isRunning) { timeLeft = turnTime; renderDisplay(); }
    updateAdjLabel();
  });

  // ── Initial label ─────────────────────────────────────────
  updateAdjLabel();
});
