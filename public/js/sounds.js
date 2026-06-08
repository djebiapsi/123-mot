const Sounds = (() => {
  let ctx = null;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, type, dur, vol = 0.3, delay = 0) {
    try {
      const c = getCtx();
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain);
      gain.connect(c.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, c.currentTime + delay);
      gain.gain.setValueAtTime(vol, c.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + dur);
      osc.start(c.currentTime + delay);
      osc.stop(c.currentTime + delay + dur);
    } catch (_) {}
  }

  return {
    init() { try { getCtx(); } catch (_) {} },

    click() { tone(800, 'sine', 0.05, 0.2); },

    buzz() {
      tone(220, 'sawtooth', 0.12, 0.4);
      tone(180, 'sawtooth', 0.18, 0.3, 0.1);
    },

    win() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 'sine', 0.25, 0.35, i * 0.1));
    },

    lose() {
      [400, 300, 220].forEach((f, i) => tone(f, 'triangle', 0.2, 0.3, i * 0.12));
    },

    tick() { tone(1000, 'sine', 0.04, 0.1); },

    urgentTick() {
      tone(1200, 'square', 0.06, 0.15);
    },

    whoosh() {
      try {
        const c = getCtx();
        const buf = c.createBuffer(1, c.sampleRate * 0.3, c.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
        const src = c.createBufferSource();
        const filter = c.createBiquadFilter();
        const gain = c.createGain();
        src.buffer = buf;
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, c.currentTime);
        filter.frequency.linearRampToValueAtTime(200, c.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(c.destination);
        src.start();
      } catch (_) {}
    },

    roundStart() {
      tone(440, 'sine', 0.1, 0.3);
      tone(660, 'sine', 0.15, 0.3, 0.12);
    },

    invalid() {
      tone(200, 'square', 0.1, 0.2);
      tone(150, 'square', 0.15, 0.2, 0.1);
    },

    vibrate(pattern = [50]) {
      if (navigator.vibrate) navigator.vibrate(pattern);
    },
  };
})();
