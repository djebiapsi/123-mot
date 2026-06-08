/* ══ 1,2,3 Mot! — Application principale ══════════════════════════════════ */

// ─── État global ─────────────────────────────────────────────────────────────
const state = {
  mode: null,           // 'solo' | 'multi'
  playerIndex: 0,       // 0 ou 1 (multi)
  isHost: false,
  roomCode: '',
  players: [
    { name: 'Joueur 1', score: 0 },
    { name: 'Joueur 2', score: 0 },
  ],
  settings: { targetScore: 10, timerDuration: 30 },
  currentRound: null,
  rounds: [],
  timerInterval: null,
  timeLeft: 0,
  roundActive: false,
  buzzed: false,        // solo: qui a buzzé (0 ou 1)
  usedCategories: [],
};

let socket = null;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; };

function normalize(str) {
  return str.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function wordValid(word, l1, l2) {
  const w = normalize(word);
  return w.includes(l1) && w.includes(l2);
}

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const LETTER_POOL = 'AAAABBCCDDDEEEEEFGHIIIIJKLLLLMMMNNNNOOOOPRRRRSSSSTTTTUUUUVWY';
function randomLetters() {
  let l1, l2;
  do {
    l1 = LETTER_POOL[Math.floor(Math.random() * LETTER_POOL.length)];
    l2 = LETTER_POOL[Math.floor(Math.random() * LETTER_POOL.length)];
  } while (l1 === l2);
  return [l1, l2];
}

// ─── Navigation ───────────────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const s = $(id);
  if (s) { s.classList.add('active'); s.scrollTop = 0; }
}

document.querySelectorAll('[data-back]').forEach(btn => {
  btn.addEventListener('click', () => showScreen(btn.dataset.back));
});

// ─── Toast ─────────────────────────────────────────────────────────────────────
function toast(msg, type = 'info', duration = 2500) {
  const t = el('div', `toast ${type}`);
  t.textContent = msg;
  $('toast-container').appendChild(t);
  setTimeout(() => t.remove(), duration);
}

// ─── Status bar ───────────────────────────────────────────────────────────────
function setStatus(msg, type = '') {
  const bar = $('status-bar');
  bar.innerHTML = '';
  if (!msg) return;
  const d = el('div', `status-msg ${type}`);
  d.textContent = msg;
  bar.appendChild(d);
}

// ─── Confetti ─────────────────────────────────────────────────────────────────
const confettiCanvas = $('confetti-canvas');
const confettiCtx = confettiCanvas.getContext('2d');
let confettiParticles = [];
let confettiRunning = false;

function launchConfetti() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
  confettiParticles = Array.from({ length: 180 }, () => ({
    x: Math.random() * confettiCanvas.width,
    y: -20,
    vx: (Math.random() - 0.5) * 5,
    vy: Math.random() * 4 + 2,
    color: `hsl(${Math.random() * 360},90%,60%)`,
    w: Math.random() * 12 + 6,
    h: Math.random() * 6 + 3,
    rot: Math.random() * 360,
    rotV: (Math.random() - 0.5) * 12,
  }));
  confettiRunning = true;
  animateConfetti();
}

function animateConfetti() {
  if (!confettiRunning) return;
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  confettiParticles = confettiParticles.filter(p => p.y < confettiCanvas.height + 30);
  confettiParticles.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.rot += p.rotV; p.vy += 0.06;
    confettiCtx.save();
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate(p.rot * Math.PI / 180);
    confettiCtx.fillStyle = p.color;
    confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    confettiCtx.restore();
  });
  if (confettiParticles.length > 0) requestAnimationFrame(animateConfetti);
  else { confettiRunning = false; confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height); }
}

// ─── Floating letters (home) ──────────────────────────────────────────────────
function initFloatingLetters() {
  const container = $('floating-letters');
  const letters = 'ABCDEFGHIJKLMNOPRSTUVWXY';
  for (let i = 0; i < 18; i++) {
    const d = el('div', 'float-letter');
    d.textContent = letters[Math.floor(Math.random() * letters.length)];
    d.style.cssText = `left:${Math.random() * 100}%;animation-duration:${8 + Math.random() * 12}s;animation-delay:${-Math.random() * 15}s;`;
    container.appendChild(d);
  }
}

// ─── Chip groups ──────────────────────────────────────────────────────────────
function initChips() {
  document.querySelectorAll('.chip-group').forEach(group => {
    group.addEventListener('click', e => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      group.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      Sounds.click();
    });
  });
}

function getChipVal(group, attr) {
  const selected = group.querySelector('.chip.selected');
  return selected ? selected.dataset[attr] : null;
}

// ─── Timer ────────────────────────────────────────────────────────────────────
const CIRCUMFERENCE = 2 * Math.PI * 26; // r=26

function startTimer(duration, onExpire) {
  clearInterval(state.timerInterval);
  if (duration === 0) {
    $('timer-text').textContent = '∞';
    $('timer-arc').style.strokeDashoffset = 0;
    $('timer-text').classList.remove('urgent');
    return;
  }
  state.timeLeft = duration;
  updateTimerUI(duration, duration);

  state.timerInterval = setInterval(() => {
    state.timeLeft--;
    updateTimerUI(state.timeLeft, duration);

    if (state.timeLeft <= 5 && state.timeLeft > 0) Sounds.urgentTick();
    else if (state.timeLeft > 0 && state.timeLeft % 5 === 0) Sounds.tick();

    if (state.timeLeft <= 0) {
      clearInterval(state.timerInterval);
      onExpire();
    }
  }, 1000);
}

function stopTimer() { clearInterval(state.timerInterval); }

function updateTimerUI(left, total) {
  const txt = $('timer-text');
  const arc = $('timer-arc');
  const ratio = total > 0 ? left / total : 1;
  const offset = CIRCUMFERENCE * (1 - ratio);
  arc.style.strokeDasharray = CIRCUMFERENCE;
  arc.style.strokeDashoffset = offset;
  txt.textContent = left;

  arc.classList.remove('yellow', 'red');
  txt.classList.remove('urgent');
  if (ratio < 0.2) { arc.classList.add('red'); txt.classList.add('urgent'); }
  else if (ratio < 0.5) { arc.classList.add('yellow'); }
}

// ─── Category card ────────────────────────────────────────────────────────────
function renderCategoryCard(cat) {
  const found = CATEGORIES.find(c => c.name === cat.name || c === cat);
  const data = found || { name: cat.name || cat, emoji: cat.emoji || '🎯', grad: ['#E94560','#C73652'] };
  const card = $('category-card');
  card.style.background = `linear-gradient(135deg, ${data.grad[0]}, ${data.grad[1]})`;
  // Re-trigger animation
  card.style.animation = 'none';
  card.offsetHeight;
  card.style.animation = '';
  $('category-emoji').textContent = data.emoji;
  $('category-name').textContent = data.name;
}

// ─── Letter tiles ─────────────────────────────────────────────────────────────
function renderLetters(l1, l2, p1Name, p2Name) {
  const t1 = $('letter-p1');
  const t2 = $('letter-p2');
  // Re-trigger flip animation
  [t1, t2].forEach(t => { t.style.animation = 'none'; t.offsetHeight; t.style.animation = ''; });
  setTimeout(() => {
    t1.textContent = l1;
    t2.textContent = l2;
  }, 50);
  $('tile-p1-name').textContent = p1Name || state.players[0].name;
  $('tile-p2-name').textContent = p2Name || state.players[1].name;
}

// ─── Scores ───────────────────────────────────────────────────────────────────
function updateScores() {
  $('score-p1-name').textContent = (state.players[0].name || 'J1').substring(0, 8);
  $('score-p2-name').textContent = (state.players[1].name || 'J2').substring(0, 8);
  $('score-p1-val').textContent = state.players[0].score;
  $('score-p2-val').textContent = state.players[1].score;
}

function bounceScore(pi) {
  const el = pi === 0 ? $('score-p1-val') : $('score-p2-val');
  el.classList.remove('bounce');
  el.offsetHeight;
  el.classList.add('bounce');
  setTimeout(() => el.classList.remove('bounce'), 500);
}

// ─── History ──────────────────────────────────────────────────────────────────
function addHistoryItem(entry) {
  const list = $('history-list');
  const item = el('div', 'history-item');
  if (entry.winner) {
    item.innerHTML = `<span class="history-winner" style="color:${entry.pi===0?'#E94560':'#9B59B6'}">${entry.winner}</span>
      <span class="history-cat">${entry.category}</span>
      <span class="history-word">${entry.word}</span>`;
  } else {
    item.innerHTML = `<span class="history-draw">— Nulle</span>
      <span class="history-cat">${entry.category}</span>`;
  }
  list.prepend(item);
  // Keep last 5
  while (list.children.length > 5) list.lastChild.remove();
}

// ─── Buzz overlay ─────────────────────────────────────────────────────────────
function showBuzzOverlay(name, callback) {
  const ov = $('buzz-overlay');
  $('buzz-overlay-text').textContent = `🙋 ${name} a buzzé !`;
  ov.classList.add('show');
  setTimeout(() => {
    ov.classList.remove('show');
    if (callback) callback();
  }, 600);
}

// ─── Word modal ───────────────────────────────────────────────────────────────
function openWordModal(l1, l2) {
  $('modal-l1').textContent = l1;
  $('modal-l2').textContent = l2;
  $('word-input').value = '';
  $('word-modal').classList.add('open');
  setTimeout(() => $('word-input').focus(), 100);
}
function closeWordModal() { $('word-modal').classList.remove('open'); }

$('btn-submit-word').addEventListener('click', submitWord);
$('word-input').addEventListener('keydown', e => { if (e.key === 'Enter') submitWord(); });

function submitWord() {
  const word = $('word-input').value.trim();
  if (!word) { toast('Entrez un mot !', 'error'); return; }
  closeWordModal();
  if (state.mode === 'solo') handleSoloWordSubmit(word);
  else handleMultiWordSubmit(word);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ══ MODE SOLO ══════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════

function setupSoloGame() {
  state.mode = 'solo';
  const p1 = $('solo-p1-name').value.trim() || 'Joueur 1';
  const p2 = $('solo-p2-name').value.trim() || 'Joueur 2';
  const targetScore = parseInt(getChipVal($('screen-setup-solo').querySelector('.chip-group'), 'target')) || 10;
  const timerDuration = parseInt(getChipVal($('screen-setup-solo').querySelectorAll('.chip-group')[1], 'timer') ?? '30');

  state.players = [{ name: p1, score: 0 }, { name: p2, score: 0 }];
  state.settings = { targetScore, timerDuration };
  state.rounds = [];
  state.usedCategories = [];

  $('buzz-section-solo').style.display = 'flex';
  $('buzz-section-multi').style.display = 'none';
  $('buzz-p1-label').textContent = p1;
  $('buzz-p2-label').textContent = p2;

  showScreen('screen-game');
  $('history-list').innerHTML = '';
  updateScores();
  soloNewRound();
}

function soloNewRound() {
  state.roundActive = false;
  state.buzzed = null;
  setStatus('');

  const available = CATEGORIES.filter(c => !state.usedCategories.includes(c.name));
  if (available.length === 0) state.usedCategories = [];
  const cat = randomItem(available.length ? available : CATEGORIES);
  state.usedCategories.push(cat.name);

  const [l1, l2] = randomLetters();
  state.currentRound = { category: cat.name, emoji: cat.emoji, grad: cat.grad, letter1: l1, letter2: l2 };

  $('round-indicator').textContent = `Manche ${state.rounds.length + 1}`;
  renderCategoryCard(cat);
  renderLetters(l1, l2);

  Sounds.roundStart();
  Sounds.vibrate([50, 30, 50]);

  // Enable buzz buttons
  $('buzz-p1').disabled = false;
  $('buzz-p2').disabled = false;

  setTimeout(() => {
    state.roundActive = true;
    startTimer(state.settings.timerDuration, soloTimerExpired);
  }, 700);
}

function soloTimerExpired() {
  if (!state.roundActive) return;
  state.roundActive = false;
  $('buzz-p1').disabled = true;
  $('buzz-p2').disabled = true;
  Sounds.lose();
  Sounds.vibrate([100, 50, 100]);
  setStatus('⏰ Temps écoulé ! Manche nulle', 'draw');
  state.rounds.push({ ...state.currentRound, winner: null, word: null, pi: null });
  addHistoryItem({ category: state.currentRound.category, winner: null });
  setTimeout(soloNewRound, 2000);
}

$('buzz-p1').addEventListener('click', () => soloBuzz(0));
$('buzz-p2').addEventListener('click', () => soloBuzz(1));

function soloBuzz(pi) {
  if (!state.roundActive || state.buzzed !== null) return;
  state.roundActive = false;
  state.buzzed = pi;
  stopTimer();
  $('buzz-p1').disabled = true;
  $('buzz-p2').disabled = true;

  Sounds.buzz();
  Sounds.vibrate([80]);

  showBuzzOverlay(state.players[pi].name, () => {
    openWordModal(state.currentRound.letter1, state.currentRound.letter2);
  });
}

function handleSoloWordSubmit(word) {
  const round = state.currentRound;
  const valid = wordValid(word, round.letter1, round.letter2);
  const pi = state.buzzed;

  if (valid) {
    state.players[pi].score++;
    bounceScore(pi);
    updateScores();
    Sounds.win();
    Sounds.vibrate([50, 30, 80, 30, 50]);
    setStatus(`✅ ${state.players[pi].name} marque un point avec "${word.toUpperCase()}" !`, 'success');
    state.rounds.push({ ...round, winner: state.players[pi].name, word: word.toUpperCase(), pi });
    addHistoryItem({ category: round.category, winner: state.players[pi].name, word: word.toUpperCase(), pi });

    if (state.players[pi].score >= state.settings.targetScore) {
      setTimeout(() => showEndScreen(pi), 1200);
      return;
    }
  } else {
    Sounds.invalid();
    Sounds.vibrate([200]);
    toast(`❌ "${word.toUpperCase()}" ne contient pas les lettres ${round.letter1} et ${round.letter2}`, 'error', 3000);
    setStatus('❌ Mot invalide — manche reprise', 'error');
    state.rounds.push({ ...round, winner: null, word: null, pi: null });
    addHistoryItem({ category: round.category, winner: null });
  }
  setTimeout(soloNewRound, 2000);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ══ MODE MULTI ═════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════

function initSocket() {
  if (socket) return;
  socket = io();

  socket.on('room-created', ({ code, playerIndex, player }) => {
    state.roomCode = code;
    state.playerIndex = playerIndex;
    state.isHost = true;
    state.players[0] = { ...player, score: 0 };
    showWaitingRoom(code);
  });

  socket.on('room-joined', ({ code, playerIndex, player }) => {
    state.roomCode = code;
    state.playerIndex = playerIndex;
    state.isHost = false;
    state.players[playerIndex] = { ...player, score: 0 };
    showWaitingRoom(code);
    $('btn-start-multi').style.display = 'none';
    $('guest-waiting-msg').style.display = 'block';
  });

  socket.on('room-updated', ({ players }) => {
    state.players = players.map(p => ({ ...p, score: p.score ?? 0 }));
    updateWaitingSlots();
    if (state.isHost && players.length === 2) {
      $('btn-start-multi').disabled = false;
      $('btn-start-multi').innerHTML = '🚀 Démarrer la partie';
    }
  });

  socket.on('room-error', ({ message }) => toast(message, 'error', 3000));

  socket.on('new-round', data => {
    state.players = data.players.map(p => ({ ...p, score: p.score ?? 0 }));
    state.settings = data.settings;
    state.currentRound = { category: data.category, emoji: data.emoji, letter1: data.letter1, letter2: data.letter2 };
    state.rounds = state.rounds || [];
    $('round-indicator').textContent = `Manche ${data.roundNumber}`;

    updateScores();
    renderCategoryCard({ name: data.category, emoji: data.emoji, grad: getCatGrad(data.category) });
    renderLetters(data.letter1, data.letter2);
    setStatus('');

    $('buzz-multi-btn').disabled = false;
    $('buzz-multi-btn').innerHTML = '🙋 J\'AI TROUVÉ !';

    Sounds.roundStart();
    Sounds.vibrate([50, 30, 50]);
    state.roundActive = true;
    startTimer(data.settings.timerDuration, () => {
      if (state.isHost) socket.emit('timer-expired', { code: state.roomCode });
    });

    showScreen('screen-game');
  });

  socket.on('buzz-registered', ({ buzzerIndex, buzzerName }) => {
    stopTimer();
    state.roundActive = false;
    $('buzz-multi-btn').disabled = true;

    Sounds.buzz();
    Sounds.vibrate([80]);

    if (buzzerIndex === state.playerIndex) {
      showBuzzOverlay(buzzerName, () => openWordModal(state.currentRound.letter1, state.currentRound.letter2));
    } else {
      setStatus(`🙋 ${buzzerName} a buzzé ! En attente de sa réponse…`, 'info');
    }
  });

  socket.on('round-result', ({ valid, word, winnerIndex, winnerName, scores, gameOver }) => {
    state.players.forEach((p, i) => p.score = scores[i]);
    updateScores();

    if (valid) {
      bounceScore(winnerIndex);
      Sounds.win();
      Sounds.vibrate([50, 30, 80]);
      setStatus(`✅ ${winnerName} marque avec "${word.toUpperCase()}" !`, 'success');
      addHistoryItem({ category: state.currentRound.category, winner: winnerName, word: word.toUpperCase(), pi: winnerIndex });
      state.rounds.push({ winner: winnerName, word, pi: winnerIndex });

      if (!gameOver) {
        setTimeout(() => {
          if (state.isHost) socket.emit('next-round', { code: state.roomCode });
        }, 2200);
      }
    }
  });

  socket.on('word-invalid', ({ word, letter1, letter2 }) => {
    Sounds.invalid();
    toast(`❌ "${word.toUpperCase()}" ne contient pas ${letter1} et ${letter2}`, 'error', 3000);
    setStatus('❌ Mot invalide — continuez !', 'error');
    $('buzz-multi-btn').disabled = false;
    $('buzz-multi-btn').innerHTML = '🙋 J\'AI TROUVÉ !';
    state.roundActive = true;
    startTimer(state.settings.timerDuration, () => {
      if (state.isHost) socket.emit('timer-expired', { code: state.roomCode });
    });
  });

  socket.on('round-draw', () => {
    Sounds.lose();
    setStatus('⏰ Temps écoulé ! Manche nulle', 'draw');
    addHistoryItem({ category: state.currentRound?.category, winner: null });
    state.rounds.push({ winner: null });
    if (state.isHost) setTimeout(() => socket.emit('next-round', { code: state.roomCode }), 2200);
  });

  socket.on('game-over', ({ winnerIndex, players }) => {
    state.players = players;
    stopTimer();
    setTimeout(() => showEndScreen(winnerIndex), 800);
  });

  socket.on('rematch-started', ({ players, settings }) => {
    state.players = players.map(p => ({ ...p, score: 0 }));
    state.settings = settings;
    state.rounds = [];
    $('history-list').innerHTML = '';
    updateScores();
  });

  socket.on('player-disconnected', ({ playerName }) => {
    toast(`⚠️ ${playerName} s'est déconnecté`, 'error', 4000);
    setStatus(`⚠️ ${playerName} s'est déconnecté`, 'error');
  });
}

function getCatGrad(name) {
  const found = CATEGORIES.find(c => c.name === name);
  return found ? found.grad : ['#E94560', '#C73652'];
}

// ── Create room ───────────────────────────────────────────────────────────────
$('btn-create-room').addEventListener('click', () => {
  const name = $('host-name').value.trim();
  if (!name) { toast('Entre ton prénom !', 'error'); return; }

  const setupEl = $('screen-setup-multi');
  const chips = setupEl.querySelectorAll('.chip-group');
  const targetScore = parseInt(getChipVal(chips[0], 'target')) || 10;
  const timerDuration = parseInt(getChipVal(chips[1], 'timer') ?? '30');

  state.settings = { targetScore, timerDuration };
  state.mode = 'multi';

  initSocket();
  socket.emit('create-room', { playerName: name, settings: state.settings });
});

// ── Join room ─────────────────────────────────────────────────────────────────
$('btn-join-room').addEventListener('click', () => {
  const name = $('join-name').value.trim();
  const code = $('join-code').value.trim().toUpperCase();
  if (!name) { toast('Entre ton prénom !', 'error'); return; }
  if (code.length < 4) { toast('Code invalide', 'error'); return; }
  state.mode = 'multi';
  initSocket();
  socket.emit('join-room', { playerName: name, code });
});

// ── Waiting room ──────────────────────────────────────────────────────────────
function showWaitingRoom(code) {
  $('display-room-code').textContent = code;
  $('buzz-section-solo').style.display = 'none';
  $('buzz-section-multi').style.display = 'block';

  updateWaitingSlots();
  showScreen('screen-waiting');
}

function updateWaitingSlots() {
  const p1 = state.players[0];
  const p2 = state.players[1];

  if (p1) {
    $('slot-p1-name').textContent = p1.name || 'Joueur 1';
    $('avatar-p1').textContent = (p1.name || 'J')[0].toUpperCase();
  }
  if (p2) {
    $('slot-p2').classList.add('connected');
    $('slot-p2-name').textContent = p2.name;
    $('slot-p2-status').textContent = 'Connecté ✅';
    $('avatar-p2').textContent = (p2.name || 'J')[0].toUpperCase();
    $('p2-spinner').style.display = 'none';

    if (state.isHost) {
      $('btn-start-multi').disabled = false;
      $('btn-start-multi').innerHTML = '🚀 Démarrer la partie';
    }
  }
}

$('btn-start-multi').addEventListener('click', () => {
  if (!state.isHost) return;
  socket.emit('start-game', { code: state.roomCode });
});

$('btn-copy-code').addEventListener('click', () => {
  navigator.clipboard?.writeText(state.roomCode).then(() => toast('Code copié !', 'success')).catch(() => {});
});

$('btn-leave-room').addEventListener('click', () => {
  if (socket) socket.disconnect();
  socket = null;
  showScreen('screen-home');
});

// ── Multi buzz ────────────────────────────────────────────────────────────────
$('buzz-multi-btn').addEventListener('click', () => {
  if (!state.roundActive) return;
  socket.emit('buzz', { code: state.roomCode });
});

function handleMultiWordSubmit(word) {
  socket.emit('submit-word', { code: state.roomCode, word });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ══ END SCREEN ═════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════

function showEndScreen(winnerIndex) {
  stopTimer();
  const winner = state.players[winnerIndex];
  const loserIndex = winnerIndex === 0 ? 1 : 0;
  const loser = state.players[loserIndex];

  $('end-winner-name').textContent = winner.name;
  $('end-crown').textContent = winnerIndex === 0 ? '👑' : '👑';

  const leftIndex = 0, rightIndex = 1;
  $('end-p1-name').textContent = state.players[leftIndex].name;
  $('end-p1-score').textContent = state.players[leftIndex].score;
  $('end-p2-name').textContent = state.players[rightIndex].name;
  $('end-p2-score').textContent = state.players[rightIndex].score;

  $('end-card-p1').classList.toggle('winner-card', winnerIndex === 0);
  $('end-card-p2').classList.toggle('winner-card', winnerIndex === 1);

  // Stats
  const played = state.rounds.length;
  const draws = state.rounds.filter(r => !r.winner).length;
  const words = state.rounds.filter(r => r.word).map(r => r.word);
  const bestWord = words.reduce((best, w) => (!best || w.length > best.length) ? w : best, null);

  $('stat-rounds').textContent = played;
  $('stat-best-word').textContent = bestWord || '—';
  $('stat-draws').textContent = draws;

  showScreen('screen-end');
  Sounds.win();
  Sounds.vibrate([100, 50, 100, 50, 200]);
  setTimeout(launchConfetti, 300);

  // Host-only rematch button
  if (state.mode === 'multi' && !state.isHost) {
    $('btn-rematch').style.display = 'none';
  } else {
    $('btn-rematch').style.display = '';
  }
}

$('btn-rematch').addEventListener('click', () => {
  if (state.mode === 'solo') {
    state.players.forEach(p => p.score = 0);
    state.rounds = [];
    $('history-list').innerHTML = '';
    updateScores();
    showScreen('screen-game');
    soloNewRound();
  } else {
    socket.emit('rematch', { code: state.roomCode });
  }
});

$('btn-home-end').addEventListener('click', () => {
  stopTimer();
  if (socket) { socket.disconnect(); socket = null; }
  showScreen('screen-home');
});

$('btn-share').addEventListener('click', () => {
  const winner = state.players.find(p => p.score >= state.settings.targetScore) || state.players[0];
  const text = `🎮 1,2,3 Mot ! — ${winner.name} a gagné ${winner.score} à ${state.players.find(p => p !== winner)?.score ?? '?'} !`;
  if (navigator.share) {
    navigator.share({ title: '1,2,3 Mot !', text }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(text).then(() => toast('Résultat copié !', 'success'));
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ══ HOME & NAVIGATION ══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════

$('btn-play').addEventListener('click', () => { Sounds.click(); showScreen('screen-mode'); });
$('btn-join').addEventListener('click', () => { Sounds.click(); showScreen('screen-join'); });
$('btn-rules').addEventListener('click', () => { Sounds.click(); showScreen('screen-rules'); });

$('mode-solo').addEventListener('click', () => { Sounds.click(); showScreen('screen-setup-solo'); });
$('mode-multi').addEventListener('click', () => { Sounds.click(); showScreen('screen-setup-multi'); });

$('btn-start-solo').addEventListener('click', () => {
  Sounds.click();
  setupSoloGame();
});

// Close modal on overlay click
$('word-modal').addEventListener('click', e => {
  if (e.target === $('word-modal')) closeWordModal();
});

// ═══════════════════════════════════════════════════════════════════════════════
// ══ INIT ═══════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════

// Init sounds on first interaction
document.addEventListener('click', () => Sounds.init(), { once: true });
document.addEventListener('touchstart', () => Sounds.init(), { once: true });

// Floating letters
initFloatingLetters();

// Chip groups
initChips();

// Setup chip groups for score/timer selection (binding by data attribute)
function readChipGroups(screenId) {
  const s = $(screenId);
  const chipGroups = s.querySelectorAll('.chip-group');
  return { targetScore: chipGroups[0], timerDuration: chipGroups[1] };
}

// Patch: read timer correctly (data-timer attribute)
document.querySelectorAll('[data-target]').forEach(chip => {
  chip.parentNode.querySelectorAll('[data-target]').forEach(c => c.classList.remove('selected'));
});

// Word input uppercase transform
$('word-input').addEventListener('input', function() {
  const pos = this.selectionStart;
  this.value = this.value.toUpperCase();
  this.setSelectionRange(pos, pos);
});

// Join code uppercase
$('join-code').addEventListener('input', function() {
  const pos = this.selectionStart;
  this.value = this.value.toUpperCase();
  this.setSelectionRange(pos, pos);
});

console.log('🎮 1,2,3 Mot! — Prêt à jouer !');
