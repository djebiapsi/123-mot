const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, 'public')));

const rooms = new Map();

// ─── Données partagées avec le client ─────────────────────────────────────────
const { CATEGORIES, weightedRandom, randomLettersWeighted } =
  require('./public/js/categories.js');

// ─── Helpers ──────────────────────────────────────────────────────────────────
function randomCode() {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXY23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function normalize(str) {
  return str.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function wordValid(word, l1, l2) {
  const w = normalize(word);
  return w.includes(l1) && w.includes(l2);
}

// ─── Socket.io ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {

  socket.on('create-room', ({ playerName, settings }) => {
    let code;
    do { code = randomCode(); } while (rooms.has(code));

    const room = {
      code,
      host: socket.id,
      players: [{ id: socket.id, name: playerName, score: 0 }],
      settings,
      state: 'waiting',
      currentRound: null,
      rounds: [],
      usedCategories: [],
    };
    rooms.set(code, room);
    socket.join(code);
    socket.emit('room-created', { code, playerIndex: 0, player: room.players[0] });
  });

  socket.on('join-room', ({ code, playerName }) => {
    const room = rooms.get(code.toUpperCase());
    if (!room) return socket.emit('room-error', { message: 'Partie introuvable. Vérifie le code.' });
    if (room.players.length >= 2) return socket.emit('room-error', { message: 'Partie complète !' });
    if (room.state !== 'waiting') return socket.emit('room-error', { message: 'Partie déjà commencée.' });

    room.players.push({ id: socket.id, name: playerName, score: 0 });
    socket.join(code.toUpperCase());
    socket.emit('room-joined', { code: code.toUpperCase(), playerIndex: 1, player: room.players[1] });
    io.to(code.toUpperCase()).emit('room-updated', { players: room.players, settings: room.settings });
  });

  socket.on('start-game', ({ code }) => {
    const room = rooms.get(code);
    if (!room || room.host !== socket.id) return;
    if (room.players.length < 2) return socket.emit('room-error', { message: "En attente du 2ème joueur !" });

    room.state = 'playing';
    room.players.forEach(p => p.score = 0);
    room.rounds = [];
    room.usedCategories = [];
    startNewRound(room);
  });

  socket.on('buzz', ({ code }) => {
    const room = rooms.get(code);
    if (!room || !room.currentRound?.active) return;

    const pi = room.players.findIndex(p => p.id === socket.id);
    if (pi === -1) return;

    room.currentRound.active = false;
    room.currentRound.buzzerId = socket.id;
    room.currentRound.buzzerIndex = pi;

    io.to(code).emit('buzz-registered', {
      buzzerIndex: pi,
      buzzerName: room.players[pi].name,
    });
  });

  socket.on('submit-word', ({ code, word }) => {
    const room = rooms.get(code);
    if (!room || !room.currentRound) return;
    if (room.currentRound.buzzerId !== socket.id) return;

    const round = room.currentRound;
    const valid = wordValid(word, round.letter1, round.letter2);

    if (valid) {
      const pi = room.players.findIndex(p => p.id === socket.id);
      room.players[pi].score++;
      room.rounds.push({
        category: round.category, letter1: round.letter1, letter2: round.letter2,
        winner: room.players[pi].name, word,
      });

      const gameOver = room.players[pi].score >= room.settings.targetScore;
      io.to(code).emit('round-result', {
        valid: true, word,
        winnerIndex: pi, winnerName: room.players[pi].name,
        scores: room.players.map(p => p.score),
        gameOver,
      });

      if (gameOver) {
        room.state = 'finished';
        io.to(code).emit('game-over', {
          winnerIndex: pi, winner: room.players[pi],
          players: room.players, rounds: room.rounds,
        });
      }
    } else {
      round.active = true;
      round.buzzerId = null;
      io.to(code).emit('word-invalid', { word, letter1: round.letter1, letter2: round.letter2 });
    }
  });

  socket.on('next-round', ({ code }) => {
    const room = rooms.get(code);
    if (!room || room.host !== socket.id) return;
    startNewRound(room);
  });

  socket.on('rematch', ({ code }) => {
    const room = rooms.get(code);
    if (!room || room.host !== socket.id) return;
    room.state = 'playing';
    room.players.forEach(p => p.score = 0);
    room.rounds = [];
    room.usedCategories = [];
    io.to(code).emit('rematch-started', { players: room.players, settings: room.settings });
    startNewRound(room);
  });

  // ── Skip : en multi, les deux joueurs doivent voter ──────────────────────
  socket.on('vote-skip', ({ code }) => {
    const room = rooms.get(code);
    if (!room || !room.currentRound?.active) return;
    if (!room.skipVotes) room.skipVotes = new Set();
    room.skipVotes.add(socket.id);

    const needed = room.players.length; // 2 en multi
    io.to(code).emit('skip-vote-update', {
      votes: room.skipVotes.size,
      needed,
    });

    if (room.skipVotes.size >= needed) {
      room.skipVotes = new Set();
      room.currentRound.active = false;
      room.rounds.push({
        category: room.currentRound.category,
        letter1: room.currentRound.letter1,
        letter2: room.currentRound.letter2,
        winner: null, word: null, skipped: true,
      });
      io.to(code).emit('round-skipped', {
        category: room.currentRound.category,
      });
      setTimeout(() => startNewRound(room), 1500);
    }
  });

  socket.on('timer-expired', ({ code }) => {
    const room = rooms.get(code);
    if (!room || !room.currentRound || room.host !== socket.id) return;
    room.currentRound.active = false;
    room.rounds.push({
      category: room.currentRound.category,
      letter1: room.currentRound.letter1,
      letter2: room.currentRound.letter2,
      winner: null, word: null,
    });
    io.to(code).emit('round-draw', {
      category: room.currentRound.category,
      letter1: room.currentRound.letter1,
      letter2: room.currentRound.letter2,
    });
  });

  socket.on('disconnect', () => {
    for (const [code, room] of rooms) {
      const pi = room.players.findIndex(p => p.id === socket.id);
      if (pi === -1) continue;
      io.to(code).emit('player-disconnected', { playerName: room.players[pi].name });
      room.players.splice(pi, 1);
      if (room.players.length === 0) rooms.delete(code);
      else room.host = room.players[0].id;
      break;
    }
  });
});

function startNewRound(room) {
  const available = CATEGORIES.filter(c => !room.usedCategories.includes(c.name));
  if (available.length === 0) room.usedCategories = [];
  const pool = available.length ? available : CATEGORIES;
  const cat = weightedRandom(pool, c => c.weight);
  room.usedCategories.push(cat.name);

  const [l1, l2] = randomLettersWeighted();
  room.currentRound = { category: cat.name, emoji: cat.emoji, letter1: l1, letter2: l2, active: true, buzzerId: null };

  io.to(room.code).emit('new-round', {
    category: cat.name, emoji: cat.emoji, letter1: l1, letter2: l2,
    roundNumber: room.rounds.length + 1,
    scores: room.players.map(p => p.score),
    settings: room.settings,
    players: room.players,
  });
}

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => console.log(`✅ Serveur démarré → http://localhost:${PORT}`));
