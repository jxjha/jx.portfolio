/* ============================================================================
   bioscope-lib.js — the parts of the bioscope that are pure three.js / WebAudio.

   Ported from a Next.js + React-Three-Fiber bundle to plain ES5-ish JS so it
   drops into this static site with no build step. Nothing here touches React.
   Everything the box is painted with, and every sound it makes, is generated at
   runtime — no texture files, no audio files.

   Exposed as one global: window.BIOSCOPE
   ========================================================================== */
window.BIOSCOPE = (function () {
  "use strict";

  /* ── DIMENSIONS ────────────────────────────────────────────────────────────
     Physical size of the instrument, in scene units (roughly metres). Shared by
     the cabinet, the crank and the camera rig so the peep animation lands
     exactly on the lens. */
  var BOX = {
    halfWidth: 0.72,
    halfHeight: 0.4,
    depth: 0.62,
    chamfer: 0.16          // corner chamfer → the octagonal front
  };
  var FRONT_Z = BOX.depth / 2;   // front face at +Z; camera looks down -Z

  var LENS = {
    radius: 0.105,
    barrelLength: 0.14,
    y: -0.06,
    xs: [-0.36, 0, 0.36]         // left, centre, right eyepieces
  };

  var CRANK = {
    x: -BOX.halfWidth - 0.01,    // left cheek, just below the lid
    y: 0.2,
    z: 0.1,
    armLength: 0.24,
    radiansPerFrame: Math.PI * 2,  // one full turn → one new picture
    notchesPerTurn: 12
  };

  var STAND = {
    legLength: 1.12,
    legThickness: 0.062,
    tilt: 0.6,
    zs: [0.2, -0.2]
  };

  /* ── THE REEL ──────────────────────────────────────────────────────────────
     A bioscope-wala's reel was hand-cut, so this order is deliberate rather
     than alphabetical. Titles only — the pictures speak for themselves. */
  var reelFrames = [
    { src: "assets/bioscope/motorcycle-stunt-1.jpg", title: "Maut ka Kuan" },
    { src: "assets/bioscope/street-kids.jpg",        title: "Do Dost" },
    { src: "assets/bioscope/man-in-alcove.jpg",      title: "Taaq mein" },
    { src: "assets/bioscope/neon-mask.jpg",          title: "Neon Chehra" },
    { src: "assets/bioscope/red-light-portrait-1.jpg", title: "Laal Roshni" },
    { src: "assets/bioscope/motorcycle-stunt-2.jpg", title: "Hawa mein" },
    { src: "assets/bioscope/man-through-hole.jpg",   title: "Jhaank" },
    { src: "assets/bioscope/red-light-portrait-2.jpg", title: "Parchhai" },
    { src: "assets/bioscope/motorcycle-stunt-3.jpg", title: "Ek Pahiya" },
    { src: "assets/bioscope/wall-texture.jpg",       title: "Deewar" }
  ];

  /** Fisher–Yates — a fresh order each visit. */
  function shuffle(items) {
    var out = items.slice();
    for (var i = out.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = out[i]; out[i] = out[j]; out[j] = tmp;
    }
    return out;
  }

  /* ── PROCEDURAL TEXTURES ───────────────────────────────────────────────────
     Every surface is drawn on a 2D canvas at runtime and cached by key. */
  var cache = new Map();

  function make(key, w, h, draw) {
    var cached = cache.get(key);
    if (cached && cached.image) return cached;

    var canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    var ctx = canvas.getContext("2d");
    draw(ctx, w, h);

    var texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;   // r128 API (was colorSpace in 0.15x+)
    texture.anisotropy = 8;
    cache.set(key, texture);
    return texture;
  }

  /** Deterministic pseudo-random so the paintwork looks the same every reload. */
  function rng(seed) {
    var s = seed;
    return function () {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
  }

  function woodGrain(ctx, w, h, base, dark, seed) {
    var rand = rng(seed);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);

    // Long grain streaks running along the plank.
    for (var i = 0; i < 260; i++) {
      var y = rand() * h;
      var thickness = 0.5 + rand() * 2.5;
      ctx.strokeStyle = dark;
      ctx.globalAlpha = 0.04 + rand() * 0.12;
      ctx.lineWidth = thickness;
      ctx.beginPath();
      ctx.moveTo(0, y);
      var waves = 3 + Math.floor(rand() * 3);
      for (var x = 0; x <= w; x += w / waves) {
        ctx.lineTo(x, y + Math.sin((x / w) * Math.PI * waves + rand()) * (2 + rand() * 6));
      }
      ctx.stroke();
    }

    // A few knots.
    for (var k = 0; k < 4; k++) {
      var cx = rand() * w, cy = rand() * h;
      for (var r = 2; r < 22; r += 2.5) {
        ctx.globalAlpha = 0.1;
        ctx.strokeStyle = dark;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(cx, cy, r, r * 0.55, rand() * Math.PI, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  /** A single hand-painted lotus/marigold — the motif on every bioscope panel. */
  function flower(ctx, cx, cy, r, petal, heart) {
    var petals = 8;
    for (var i = 0; i < petals; i++) {
      var a = (i / petals) * Math.PI * 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a);
      ctx.fillStyle = petal;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(r * 0.45, -r * 0.35, 0, -r);
      ctx.quadraticCurveTo(-r * 0.45, -r * 0.35, 0, 0);
      ctx.fill();
      ctx.strokeStyle = "rgba(60,15,10,0.55)";
      ctx.lineWidth = Math.max(1, r * 0.05);
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = heart;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.26, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(60,15,10,0.6)";
    ctx.lineWidth = Math.max(1, r * 0.05);
    ctx.stroke();
  }

  /** A curling leaf spray flanking the flowers. */
  function vine(ctx, x, y, len, dir, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1.5, len * 0.03);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + dir * len * 0.5, y - len * 0.35, x + dir * len, y - len * 0.1);
    ctx.stroke();

    for (var i = 1; i <= 5; i++) {
      var t = i / 6;
      var px = x + dir * len * t;
      var py = y - len * 0.3 * Math.sin(t * Math.PI);
      ctx.fillStyle = color;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(dir * (0.6 + t));
      ctx.beginPath();
      ctx.ellipse(0, 0, len * 0.13, len * 0.05, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /** Front face: vermilion paint, floral panel, gold borders. Lens holes are 3D. */
  function frontPanelTexture() {
    return make("front", 1024, 512, function (ctx, w, h) {
      woodGrain(ctx, w, h, "#b8231d", "#5c0d0a", 7717);

      // Sun-bleaching towards the top edge.
      var bleach = ctx.createLinearGradient(0, 0, 0, h);
      bleach.addColorStop(0, "rgba(255,190,120,0.22)");
      bleach.addColorStop(0.5, "rgba(255,255,255,0)");
      bleach.addColorStop(1, "rgba(0,0,0,0.18)");
      ctx.fillStyle = bleach;
      ctx.fillRect(0, 0, w, h);

      // Gold border with an inner keyline.
      ctx.strokeStyle = "#e0a63c"; ctx.lineWidth = 14;
      ctx.strokeRect(18, 18, w - 36, h - 36);
      ctx.strokeStyle = "#2a1408"; ctx.lineWidth = 3;
      ctx.strokeRect(34, 34, w - 68, h - 68);

      // Pierced fretwork band — cut from tin so the wallah's lamp could breathe.
      var bandY = h * 0.19, bandH = 46;
      ctx.fillStyle = "#c9c4bb";
      ctx.fillRect(w * 0.14, bandY, w * 0.72, bandH);
      ctx.fillStyle = "#2a1408";
      for (var i = 0; i < 13; i++) {
        var x = w * 0.155 + i * (w * 0.69) / 13;
        ctx.beginPath();
        ctx.arc(x + 12, bandY + 15, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x + 7, bandY + 15, 10, bandH - 22);
      }
      ctx.strokeStyle = "#e0a63c"; ctx.lineWidth = 6;
      ctx.strokeRect(w * 0.14, bandY, w * 0.72, bandH);

      // Corner marigolds and a big central bloom, mirrored left/right.
      flower(ctx, w * 0.5, h * 0.55, 86, "#f2c14e", "#7d1a12");
      [-1, 1].forEach(function (s) {
        var cx = w * 0.5 + s * w * 0.3;
        flower(ctx, cx, h * 0.55, 68, "#e8622b", "#f2c14e");
        vine(ctx, cx + s * 70, h * 0.42, 150, s, "#1f6b46");
        vine(ctx, cx + s * 70, h * 0.86, 150, s, "#1f6b46");
        flower(ctx, w * 0.5 + s * w * 0.44, h * 0.55, 42, "#f2c14e", "#7d1a12");
        flower(ctx, w * 0.5 + s * w * 0.44, h * 0.9, 30, "#e8622b", "#f2c14e");
      });
      flower(ctx, w * 0.5, h * 0.92, 40, "#e8622b", "#f2c14e");

      // Scuffs from decades on the back of a bicycle.
      var rand = rng(4242);
      ctx.globalAlpha = 0.14;
      for (var j = 0; j < 90; j++) {
        ctx.fillStyle = rand() > 0.5 ? "#000" : "#fff";
        ctx.fillRect(rand() * w, rand() * h, rand() * 24, rand() * 3);
      }
      ctx.globalAlpha = 1;
    });
  }

  /** Side/back panels: mustard yellow with a simpler motif. */
  function sidePanelTexture() {
    return make("side", 512, 512, function (ctx, w, h) {
      woodGrain(ctx, w, h, "#d99a20", "#6b4407", 331);
      ctx.strokeStyle = "#8c1d15"; ctx.lineWidth = 12;
      ctx.strokeRect(16, 16, w - 32, h - 32);
      flower(ctx, w * 0.5, h * 0.5, 74, "#c2261c", "#1f6b46");
      vine(ctx, w * 0.2, h * 0.22, 130, 1, "#1f6b46");
      vine(ctx, w * 0.8, h * 0.78, 130, -1, "#1f6b46");
    });
  }

  /** Top signboard — the invitation every bioscope-wala painted on his box. */
  function signboardTexture(text) {
    text = text || "देखो मगर प्यार से";
    return make("sign", 1024, 192, function (ctx, w, h) {
      var bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "#1b4f9c");
      bg.addColorStop(1, "#0d2f66");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = "#e0a63c"; ctx.lineWidth = 10;
      ctx.strokeRect(10, 10, w - 20, h - 20);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = 'bold ' + Math.floor(h * 0.5) + 'px "Noto Sans Devanagari", "Nirmala UI", system-ui, sans-serif';
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillText(text, w / 2 + 4, h / 2 + 5);
      ctx.fillStyle = "#f6d97a";
      ctx.fillText(text, w / 2, h / 2);
    });
  }

  /** Brushed brass for the eyepieces, horn and crank. */
  function brassTexture() {
    return make("brass", 512, 512, function (ctx, w, h) {
      var g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#8a6015");
      g.addColorStop(0.35, "#e6b64c");
      g.addColorStop(0.55, "#fbe9a8");
      g.addColorStop(0.8, "#c58f28");
      g.addColorStop(1, "#6f4a10");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      var rand = rng(99);
      ctx.globalAlpha = 0.12;
      for (var i = 0; i < 900; i++) {
        ctx.strokeStyle = rand() > 0.5 ? "#fff8d8" : "#4a3208";
        ctx.beginPath();
        var y = rand() * h;
        ctx.moveTo(rand() * w, y);
        ctx.lineTo(rand() * w, y + (rand() - 0.5) * 4);
        ctx.stroke();
      }
      // Tarnish patches.
      ctx.globalAlpha = 0.18;
      for (var j = 0; j < 30; j++) {
        ctx.fillStyle = "#3b2a08";
        ctx.beginPath();
        ctx.ellipse(rand() * w, rand() * h, rand() * 40, rand() * 25, rand() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    });
  }

  /** Dark stained teak for the folding X-stand. */
  function standTexture() {
    return make("stand", 256, 512, function (ctx, w, h) {
      woodGrain(ctx, w, h, "#4a2c17", "#1a0d05", 555);
    });
  }

  function disposeTextures() {
    cache.forEach(function (t) { t.dispose(); });
    cache.clear();
  }

  /* ── THE WALLAH'S TUNE ─────────────────────────────────────────────────────
     A bioscope-wala sang over his own reel, so the music is generated rather
     than loaded: a tanpura-ish drone under a slow plucked line drawn from a
     raga's notes. Four ragas by their traditional hour — a bioscope did its
     best trade at dusk, so the set leans that way. */
  var ragas = [
    // Bhairav — dawn, grave, flat second and sixth.
    { name: "Bhairav",  sa: 196.00, swaras: [0, 1, 4, 5, 7, 8, 11, 12], pace: 1.50, colour: 0.45 },
    // Yaman — early evening, open and warm, sharp fourth.
    { name: "Yaman",    sa: 220.00, swaras: [0, 2, 4, 6, 7, 9, 11, 12], pace: 1.15, colour: 0.72 },
    // Bhupali — pentatonic, unhurried, the easiest on the ear.
    { name: "Bhupali",  sa: 174.61, swaras: [0, 2, 4, 7, 9, 12, 14],    pace: 1.35, colour: 0.60 },
    // Bageshri — late night, wistful, flat third and seventh.
    { name: "Bageshri", sa: 164.81, swaras: [0, 3, 5, 7, 9, 10, 12, 14], pace: 1.60, colour: 0.38 }
  ];

  function semitone(root, steps) { return root * Math.pow(2, steps / 12); }

  /** Plays one raga at a time and cross-fades between them. */
  function RagaPlayer(ctx, destination) {
    this.ctx = ctx;
    this.destination = destination;
    this.drone = [];
    this.gain = null;
    this.timer = null;
    this.raga = null;
    this.step = 0;        // position in the phrase, so the line wanders
    this.direction = 1;
  }

  RagaPlayer.prototype.play = function (raga, fadeSeconds) {
    fadeSeconds = fadeSeconds === undefined ? 2 : fadeSeconds;
    this.stop(fadeSeconds);

    var gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.32, this.ctx.currentTime + fadeSeconds);
    gain.connect(this.destination);
    this.gain = gain;
    this.raga = raga;
    this.step = 0;
    this.direction = 1;

    // Tanpura: Sa and Pa held underneath, slightly detuned against each other.
    var self = this;
    [1, 1.5, 2].forEach(function (ratio, i) {
      var osc = self.ctx.createOscillator();
      var droneGain = self.ctx.createGain();
      var filter = self.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 700 + raga.colour * 500;

      osc.type = i === 0 ? "sawtooth" : "triangle";
      osc.frequency.value = raga.sa * ratio;
      osc.detune.value = (i - 1) * 4;
      droneGain.gain.value = 0.075 / (i + 1);

      osc.connect(filter).connect(droneGain).connect(gain);
      osc.start();
      self.drone.push({ osc: osc, gain: droneGain });
    });

    this.scheduleNext(raga);
  };

  RagaPlayer.prototype.stop = function (fadeSeconds) {
    fadeSeconds = fadeSeconds === undefined ? 1.5 : fadeSeconds;
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    var gain = this.gain, drone = this.drone;
    this.gain = null; this.drone = []; this.raga = null;
    if (!gain) return;

    var end = this.ctx.currentTime + fadeSeconds;
    gain.gain.cancelScheduledValues(this.ctx.currentTime);
    gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    drone.forEach(function (d) { d.osc.stop(end + 0.05); });
    setTimeout(function () { gain.disconnect(); }, (fadeSeconds + 0.2) * 1000);
  };

  /** Walks the melody one note along and books the note after it. */
  RagaPlayer.prototype.scheduleNext = function (raga) {
    if (!this.gain) return;

    // Mostly stepwise motion, occasionally a leap, and a turn at the extremes.
    var leap = Math.random() < 0.18 ? 2 : 1;
    this.step += this.direction * leap;
    if (this.step >= raga.swaras.length) {
      this.step = raga.swaras.length - 2;
      this.direction = -1;
    } else if (this.step < 0) {
      this.step = 1;
      this.direction = 1;
    } else if (Math.random() < 0.22) {
      this.direction *= -1;
    }

    this.pluck(semitone(raga.sa * 2, raga.swaras[this.step]), raga.colour);

    // Slight rubato so the line never sounds sequenced.
    var wait = raga.pace * (0.75 + Math.random() * 0.6);
    var self = this;
    this.timer = setTimeout(function () { self.scheduleNext(raga); }, wait * 1000);
  };

  /** One plucked note: a bright attack decaying into a soft body. */
  RagaPlayer.prototype.pluck = function (freq, colour) {
    if (!this.gain) return;
    var t = this.ctx.currentTime;
    var decay = 1.8 + colour * 1.6;

    var osc = this.ctx.createOscillator();
    var partial = this.ctx.createOscillator();
    var noteGain = this.ctx.createGain();
    var filter = this.ctx.createBiquadFilter();

    osc.type = "triangle";
    osc.frequency.value = freq;
    partial.type = "sine";
    partial.frequency.value = freq * 2.01;
    partial.detune.value = 6;

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1200 + colour * 3200, t);
    filter.frequency.exponentialRampToValueAtTime(400, t + decay);
    filter.Q.value = 1.5;

    noteGain.gain.setValueAtTime(0.0001, t);
    noteGain.gain.exponentialRampToValueAtTime(0.16, t + 0.02);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, t + decay);

    osc.connect(filter);
    partial.connect(filter);
    filter.connect(noteGain).connect(this.gain);
    osc.start(t); partial.start(t);
    osc.stop(t + decay + 0.1); partial.stop(t + decay + 0.1);
  };

  /* ── SOUND ─────────────────────────────────────────────────────────────────
     Two layers: the crank's ratchet + shutter chime, and the reel's music.
     Browsers block audio until a gesture, so nothing exists until unlock(). */
  function BioscopeAudio() {
    this.ctx = null;
    this.master = null;
    this.musicBus = null;
    this.noiseBuffer = null;
    this.player = null;
    this.queue = [];
    this.queueIndex = -1;
    this.musicRunning = false;
    this.muted = false;
  }

  /** Call from a user gesture before anything else. Safe to call repeatedly. */
  BioscopeAudio.prototype.unlock = function () {
    if (this.ctx) {
      if (this.ctx.state === "suspended") this.ctx.resume();
      return;
    }
    var Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return;

    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.9;
    this.master.connect(this.ctx.destination);

    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = 0.85;
    this.musicBus.connect(this.master);
    this.player = new RagaPlayer(this.ctx, this.musicBus);

    // A short block of white noise, reused for every ratchet click.
    var frames = Math.floor(this.ctx.sampleRate * 0.4);
    var buffer = this.ctx.createBuffer(1, frames, this.ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buffer;
  };

  BioscopeAudio.prototype.nowPlaying = function () {
    return this.player && this.player.raga ? this.player.raga.name : null;
  };

  BioscopeAudio.prototype.setMuted = function (muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.9;
  };

  /** One notch of the crank. Faster turning → brighter, harder click. */
  BioscopeAudio.prototype.ratchet = function (speed) {
    if (speed === undefined) speed = 0.5;
    if (!this.ctx || !this.master || !this.noiseBuffer || this.muted) return;
    var ctx = this.ctx, t = ctx.currentTime;
    var intensity = Math.min(1, Math.max(0.15, speed));

    var src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.playbackRate.value = 0.8 + intensity * 0.8;

    var band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 1400 + intensity * 2200;
    band.Q.value = 6;

    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2 * intensity, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);

    src.connect(band).connect(gain).connect(this.master);
    src.start(t); src.stop(t + 0.09);

    // A low wooden thunk under the click gives the box some mass.
    var thunk = ctx.createOscillator();
    var thunkGain = ctx.createGain();
    thunk.type = "triangle";
    thunk.frequency.setValueAtTime(150 + intensity * 40, t);
    thunk.frequency.exponentialRampToValueAtTime(60, t + 0.08);
    thunkGain.gain.setValueAtTime(0.09 * intensity, t);
    thunkGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    thunk.connect(thunkGain).connect(this.master);
    thunk.start(t); thunk.stop(t + 0.1);
  };

  /** A soft brass "ting" as the shutter opens onto a new picture. */
  BioscopeAudio.prototype.chime = function () {
    if (!this.ctx || !this.master || this.muted) return;
    var ctx = this.ctx, t = ctx.currentTime, self = this;
    [880, 1320, 1760].forEach(function (freq, i) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.05 / (i + 1), t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.1 + i * 0.2);
      osc.connect(gain).connect(self.master);
      osc.start(t); osc.stop(t + 1.4);
    });
  };

  BioscopeAudio.prototype.startMusic = function () {
    this.unlock();
    if (!this.player) return;
    this.queue = shuffle(ragas);
    this.queueIndex = -1;
    this.musicRunning = true;
    this.nextRaga();
  };

  BioscopeAudio.prototype.stopMusic = function () {
    this.musicRunning = false;
    if (this.player) this.player.stop(1.2);
  };

  /** Called once per picture; the raga changes on every alternate frame, so
      each tune spans two pictures. */
  BioscopeAudio.prototype.onFrame = function (frameIndex) {
    if (!this.musicRunning || frameIndex % 2 !== 0) return;
    this.nextRaga();
  };

  BioscopeAudio.prototype.nextRaga = function () {
    if (!this.player || this.queue.length === 0) return;
    this.queueIndex = (this.queueIndex + 1) % this.queue.length;
    if (this.queueIndex === 0) this.queue = shuffle(this.queue);  // fresh lap
    this.player.play(this.queue[this.queueIndex], 2.4);
  };

  BioscopeAudio.prototype.dispose = function () {
    if (this.player) this.player.stop(0.05);
    this.player = null;
    if (this.ctx) { try { this.ctx.close(); } catch (e) {} }
    this.ctx = null; this.master = null; this.musicBus = null; this.noiseBuffer = null;
  };

  /* ── EXPORTS ─────────────────────────────────────────────────────────────── */
  return {
    BOX: BOX, FRONT_Z: FRONT_Z, LENS: LENS, CRANK: CRANK, STAND: STAND,
    reelFrames: reelFrames, shuffle: shuffle,
    frontPanelTexture: frontPanelTexture,
    sidePanelTexture: sidePanelTexture,
    signboardTexture: signboardTexture,
    brassTexture: brassTexture,
    standTexture: standTexture,
    disposeTextures: disposeTextures,
    ragas: ragas, RagaPlayer: RagaPlayer, BioscopeAudio: BioscopeAudio
  };
})();
