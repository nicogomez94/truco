(() => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  let context;
  let masterGain;
  let musicGain;
  let effectsGain;
  let musicTimer;
  let nextPhraseTime = 0;
  let noiseBuffer;
  let muted = localStorage.getItem('la-revancha-muted') === 'true';

  const frequencies = {
    A2: 110,
    C3: 130.81,
    D3: 146.83,
    E3: 164.81,
    G3: 196,
    A3: 220,
    C4: 261.63,
    D4: 293.66,
    E4: 329.63,
    G4: 392,
    A4: 440
  };

  function createNoiseBuffer() {
    const length = Math.floor(context.sampleRate * 0.22);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < length; index += 1) {
      data[index] = (Math.random() * 2 - 1) * (1 - index / length);
    }
    return buffer;
  }

  function ensureAudio() {
    if (!AudioContextClass) return false;
    if (!context) {
      context = new AudioContextClass();
      masterGain = context.createGain();
      musicGain = context.createGain();
      effectsGain = context.createGain();
      masterGain.gain.value = muted ? 0 : 0.72;
      musicGain.gain.value = 0.32;
      effectsGain.gain.value = 0.72;
      musicGain.connect(masterGain);
      effectsGain.connect(masterGain);
      masterGain.connect(context.destination);
      noiseBuffer = createNoiseBuffer();
      startMusic();
    }
    if (context.state === 'suspended' && !muted) context.resume();
    return true;
  }

  function tone(frequency, start, duration, volume, type = 'sine', destination = effectsGain, endFrequency = frequency) {
    if (!context || muted) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, endFrequency), start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  }

  function pluck(frequency, start, duration = 0.34, volume = 0.04) {
    if (!context || muted) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    oscillator.type = 'triangle';
    oscillator.frequency.value = frequency;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, start);
    filter.frequency.exponentialRampToValueAtTime(420, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(musicGain);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.04);
  }

  function noiseSwipe(start = context?.currentTime || 0, volume = 0.13, duration = 0.12) {
    if (!context || muted || !noiseBuffer) return;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = noiseBuffer;
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2400, start);
    filter.frequency.exponentialRampToValueAtTime(650, start + duration);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(effectsGain);
    source.start(start);
    source.stop(start + duration);
  }

  function scheduleMusicPhrase() {
    if (!context || muted) return;
    const now = context.currentTime;
    const start = Math.max(now + 0.08, nextPhraseTime);
    if (start > now + 2.5) return;

    const beat = 0.36;
    const melody = ['A3', 'C4', 'E4', 'D4', 'C4', 'A3', 'G3', 'E3', 'A3', 'C4', 'D4', 'E4', 'C4', 'A3', 'G3', 'E3'];
    melody.forEach((note, index) => {
      const accent = index % 4 === 0 ? 0.042 : 0.027;
      pluck(frequencies[note], start + index * beat, beat * 0.82, accent);
    });

    ['A2', 'A2', 'D3', 'E3'].forEach((note, index) => {
      pluck(frequencies[note], start + index * beat * 4, beat * 2.1, 0.033);
    });

    nextPhraseTime = start + melody.length * beat;
  }

  function startMusic() {
    if (musicTimer) return;
    scheduleMusicPhrase();
    musicTimer = window.setInterval(scheduleMusicPhrase, 1200);
  }

  function play(effect = 'click') {
    if (!ensureAudio() || muted) return;
    const now = context.currentTime + 0.008;

    switch (effect) {
      case 'open':
        tone(392, now, 0.18, 0.055, 'triangle');
        tone(587.33, now + 0.07, 0.25, 0.045, 'triangle');
        break;
      case 'close':
      case 'back':
        tone(440, now, 0.13, 0.045, 'sine', effectsGain, 260);
        break;
      case 'coin':
        tone(880, now, 0.2, 0.06, 'sine');
        tone(1320, now + 0.05, 0.25, 0.04, 'sine');
        break;
      case 'card':
        noiseSwipe(now, 0.17, 0.13);
        tone(145, now + 0.06, 0.08, 0.025, 'sine', effectsGain, 95);
        break;
      case 'shuffle':
        [0, 0.09, 0.18, 0.29, 0.39].forEach((offset, index) => noiseSwipe(now + offset, 0.11 + index * 0.008, 0.105));
        break;
      case 'deal':
        [0, 0.13, 0.26].forEach(offset => {
          noiseSwipe(now + offset, 0.16, 0.11);
          tone(120, now + offset + 0.07, 0.07, 0.02, 'sine', effectsGain, 80);
        });
        break;
      case 'call':
        tone(164.81, now, 0.22, 0.06, 'sawtooth', effectsGain, 220);
        tone(329.63, now + 0.11, 0.34, 0.055, 'triangle');
        break;
      case 'fold':
        noiseSwipe(now, 0.13, 0.18);
        tone(220, now, 0.28, 0.045, 'triangle', effectsGain, 82);
        break;
      case 'success':
        [523.25, 659.25, 783.99].forEach((frequency, index) => tone(frequency, now + index * 0.065, 0.25, 0.04, 'triangle'));
        break;
      default:
        tone(620, now, 0.065, 0.035, 'sine', effectsGain, 410);
        break;
    }
  }

  function setMuted(value) {
    muted = Boolean(value);
    localStorage.setItem('la-revancha-muted', String(muted));
    if (ensureAudio()) {
      const now = context.currentTime;
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setTargetAtTime(muted ? 0 : 0.72, now, 0.025);
      if (!muted) {
        context.resume();
        nextPhraseTime = now + 0.08;
        scheduleMusicPhrase();
        window.setTimeout(() => play('success'), 50);
      }
    }
    document.dispatchEvent(new CustomEvent('truco:audiochange', { detail: { muted } }));
    return muted;
  }

  function toggleMuted() {
    return setMuted(!muted);
  }

  document.addEventListener('pointerdown', ensureAudio, { once: true, passive: true });

  document.addEventListener('click', event => {
    const target = event.target.closest('button, a');
    if (!target || target.matches('#loginSound, #soundButton, #gameSound')) return;

    if (target.matches('.play-card')) play('card');
    else if (target.matches('.game-action--fold')) play('fold');
    else if (target.matches('.game-action')) play('call');
    else if (target.matches('#confirmJoin')) play('shuffle');
    else if (target.matches('.fantasy-close, #modalClose, #tableBuilderClose, #leaveGame')) play('close');
    else if (target.matches('[data-panel]:not([data-panel="tables"]), #tournamentButton, #openTableBuilder')) play('open');
    else if (target.matches('.prototype-action, .join-button, .request-join')) play('coin');
    else play('click');
  });

  document.addEventListener('visibilitychange', () => {
    if (!context) return;
    if (document.hidden) context.suspend();
    else if (!muted) context.resume();
  });

  window.trucoAudio = {
    ensure: ensureAudio,
    play,
    setMuted,
    toggleMuted,
    isMuted: () => muted
  };
})();
