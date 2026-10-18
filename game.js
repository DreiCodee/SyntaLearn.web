/* =====================================================================
   SKY RESCUE  -  the airship & meteor word game
   ---------------------------------------------------------------------
   Sentences with a missing word fall from the sky like meteors.
   Tap the right word to blast the meteor before it hits your airship.
   The longer you survive, the faster and harder it gets.

   HOW THIS FILE IS ORGANISED (search for the numbers to jump around)
     1. SETTINGS      - numbers you can change: lives, speed, points...
     2. QUESTIONS     - the sentences. Add your own here!
     3. GAME STATE    - the variables the game keeps track of
     4. HELPERS       - small tools used everywhere
     5. SPAWNING      - how new meteors and questions are created
     6. ANSWERING     - what happens when the player taps a word
     7. UPDATE        - moves everything a little bit every frame
     8. DRAWING       - paints the sky, meteors, airship, explosions
     9. SCREENS       - the Start / Paused / Game Over messages
    10. STARTING UP   - connects the game to the rest of the website
   ===================================================================== */

const SkyRescue = (() => {
  'use strict';

  /* ===================================================================
     1. SETTINGS  -  change these numbers to change the game
     =================================================================== */
  const SETTINGS = {
    lives: 3,                    // hearts at the start

    // --- difficulty: every "secondsPerLevel" seconds the level goes up ---
    secondsPerLevel: 15,
    startSpeed: 0.075,           // fall speed at level 1 (share of the screen height per second)
    speedUpPerLevel: 0.016,      // how much faster each new level is
    maxSpeed: 0.32,              // the fastest it can ever fall

    // --- how often new meteors appear (in seconds) ---
    startGap: 5.0,               // wait between meteors at level 1
    minGap: 2.0,                 // the shortest wait at high levels
    gapShrinkPerLevel: 0.45,     // the wait gets this much shorter each level

    // --- how many meteors can be in the sky at the same time ---
    startMeteors: 1,
    maxMeteors: 3,
    extraMeteorEveryLevels: 2,   // +1 meteor every 2 levels, up to maxMeteors

    // --- which question tiers (1 = easy, 2 = medium, 3 = hard) unlock at which level ---
    tierUnlocksAtLevel: { 1: 1, 2: 3, 3: 6 },

    // --- points ---
    pointsPerHit: 10,            // for every correct answer
    streakBonus: 2,              // extra points for each correct answer in a row...
    streakBonusMax: 10,          // ...up to this much extra
    pointsPerSecond: 1,          // points just for surviving

    // --- rules ---
    wrongAnswerCostsLife: true,  // true = a wrong tap also takes a heart
    tapCooldownMs: 350,          // after any tap, taps are ignored for this long (stops spam tapping)
    wrongLockMs: 1500,           // after a WRONG tap, all choices are locked for this long
    bestScoreKey: 'sf-gbest',    // where the best score is saved on the phone
  };

  /* ===================================================================
     2. QUESTIONS  -  add or edit sentences here
     -------------------------------------------------------------------
     Each line is:  [ 'sentence with ___ for the gap', 'right answer', [all choices], tier ]
     - Put exactly one ___ (three underscores) where the word is missing.
     - The right answer must also be inside the list of choices.
     - Use 3 or 4 choices.  Tier 1 = easy, 2 = medium, 3 = hard.
     - Make sure the wrong choices are really wrong!
     =================================================================== */
  const QUESTIONS = [
    // ---------- TIER 1 : easy ----------
    ['The cat ___ on the mat.',            'sits',     ['sits', 'sit', 'sitting'], 1],
    ['I ___ a student.',                   'am',       ['am', 'is', 'are'], 1],
    ['They ___ playing outside.',          'are',      ['are', 'is', 'am'], 1],
    ['She has ___ apple.',                 'an',       ['an', 'a', 'two'], 1],
    ['We ___ to school every day.',        'go',       ['go', 'goes', 'going'], 1],
    ['My brother ___ a red bike.',         'has',      ['has', 'have', 'having'], 1],
    ['There are three ___ in the box.',    'balls',    ['balls', 'ball', 'a ball'], 1],
    ['The sun ___ in the east.',           'rises',    ['rises', 'rise', 'rising'], 1],
    ['He ___ his homework yesterday.',     'finished', ['finished', 'finish', 'finishes'], 1],
    ['The birds ___ in the sky.',          'fly',      ['fly', 'flies', 'flying'], 1],
    ['Maria is ___ a book.',               'reading',  ['reading', 'read', 'reads'], 1],
    ['This is ___ book.',                  'my',       ['my', 'me', 'I'], 1],
    ['The dogs ___ loud.',                 'are',      ['are', 'is', 'am'], 1],
    ['The picture hangs ___ the wall.',    'on',       ['on', 'in', 'of'], 1],  
    ['You use a ___ to write on paper.',   'pen',      ['pen', 'fork', 'shoe'], 1],
    ['The opposite of hot is ___.',        'cold',     ['cold', 'big', 'soft'], 1],

    // ---------- TIER 2 : medium ----------
    ['She ___ to the market yesterday.',           'went',        ['went', 'goes', 'go'], 2],
    ['We ___ dinner when the phone rang.',         'were eating', ['were eating', 'are eating', 'eats'], 2],
    ['He is ___ than his sister.',                 'taller',      ['taller', 'tall', 'tallest'], 2],
    ['I have lived here ___ 2020.',                'since',       ['since', 'for', 'at'], 2],
    ['The teacher gave ___ a certificate.',        'him',         ['him', 'he', 'his'], 2],
    ['If it rains, we ___ stay home.',             'will',        ['will', 'are', 'was'], 2],
    ['The children ___ their lunch already.',      'have eaten',  ['have eaten', 'has eaten', 'is eat'], 2],
    ['My mother cooks ___ than my father.',        'better',      ['better', 'good', 'best'], 2],
    ['There ___ many students in the hall.',       'were',        ['were', 'was', 'is'], 2],
    ['She is afraid ___ spiders.',                 'of',          ['of', 'at', 'on'], 2],
    ['Each student ___ a pencil.',                 'has',         ['has', 'have', 'are'], 2],
    ['We stayed home ___ it was raining.',         'because',     ['because', 'but', 'so'], 2],
    ['He speaks English very ___.',                'well',        ['well', 'good', 'goodly'], 2],
    ['I will call you ___ I arrive.',              'when',        ['when', 'where', 'but'], 2],
    ['The window was ___ by the ball.',            'broken',      ['broken', 'break', 'breaking'], 2],

    // ---------- TIER 3 : hard ----------
    ['The students who ___ the contest received prizes.',  'won',       ['won', 'winning', 'wins'], 3],
    ['___ the rain, the match continued.',                 'Despite',   ['Despite', 'Although', 'Because'], 3],
    ['The book ___ I borrowed was very old.',              'that',      ['that', 'who', 'what'], 3],
    ['The girl ___ sits beside me is my cousin.',          'who',       ['who', 'which', 'whose'], 3],
    ['By the time we arrived, the movie ___ already started.', 'had',   ['had', 'has', 'will'], 3],
    ['She suggested ___ to the library.',                  'going',     ['going', 'to going', 'went'], 3],
    ['Not only ___ she sing, but she also dances.',        'does',      ['does', 'do', 'is'], 3],
    ['Everyone in the class ___ finished the test.',       'has',       ['has', 'have', 'are'], 3],
    ['I wish I ___ a bird.',                               'were',      ['were', 'am', 'are'], 3],
    ['He worked hard; ___, he passed the exam.',           'therefore', ['therefore', 'but', 'although'], 3],
    ['The project ___ by the group last week.',            'was completed', ['was completed', 'completed', 'is complete'], 3],
    ['If I ___ you, I would study harder.',                'were',      ['were', 'am', 'be'], 3],
    ['The more you practice, the ___ you become.',        'better',    ['better', 'good', 'best'], 3],
    ['She is interested ___ learning English.',            'in',        ['in', 'on', 'at'], 3],
    ['Neither the teacher nor the students ___ the answer.', 'knew',   ['knew', 'knows', 'knowing'], 3],
  ].map(([text, answer, choices, tier]) => ({ text, answer, choices, tier }));

  /* Look & feel (sizes in pixels) */
  const LOOK = {
    font: 'system-ui,-apple-system,"SF Pro Text",Inter,"Segoe UI",Roboto,sans-serif',
    textSize: 17,                // sentence text on the meteors
    cardMaxWidth: 300,           // widest a meteor card can be
    shipBottom: 52,              // how far the airship floats above the bottom
    dangerFromBottom: 84,        // a meteor "lands" when it gets this close to the bottom
    colors: {
      gap: '#ffd166',            // the missing-word box
      right: '#7be495',          // the filled-in correct word
      fire: ['#ffd166', '#ff9f43', '#ff6b6b', '#fff3c4'],  // explosion colours
    },
  };

  /* ===================================================================
     3. GAME STATE  -  everything the game remembers
     =================================================================== */
  const field = document.getElementById('gField');
  const canvas = document.getElementById('gCanvas');
  const ctx = canvas.getContext('2d');
  const el = {
    score: document.getElementById('gScore'),
    streak: document.getElementById('gStreak'),
    level: document.getElementById('gLevel'),
    lives: document.getElementById('gLives'),
    opts: document.getElementById('gOpts'),
    overlay: document.getElementById('gOverlay'),
    ovTitle: document.getElementById('gOvTitle'),
    ovText: document.getElementById('gOvText'),
    ovBtn: document.getElementById('gOvBtn'),
    ovBack: document.getElementById('gOvBack'),
    menuBest: document.getElementById('gBestSub'),
  };

  let state = 'ready';            // 'ready' | 'play' | 'paused' | 'over'
  let W = 0, H = 0, dpr = 1;      // size of the play area
  let dangerY = 0;                // the line meteors must not cross
  let raf = 0, lastTime = 0, clock = 0;   // animation timing

  let score, lives, level, streak, elapsed, spawnTimer, pointsCarry;
  let meteors = [], shots = [], particles = [], wordBits = [], rings = [], floaters = [];
  let target = null;              // the meteor the answer buttons are for
  let shipX = 0, shake = 0, hurt = 0;
  let recent = [];                // last questions asked (so they don't repeat quickly)
  let nextId = 0;
  let stars = [], clouds = [];
  let best = loadBest();

  /* ===================================================================
     4. HELPERS
     =================================================================== */
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = list => list[Math.floor(Math.random() * list.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const shuffle = list => { const a = [...list]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };
  function loadBest() { try { return +localStorage.getItem(SETTINGS.bestScoreKey) || 0; } catch (e) { return 0; } }
  function saveBest() { try { localStorage.setItem(SETTINGS.bestScoreKey, best); } catch (e) {} }

  function roundRect(x, y, w, h, r) {            // draws a rounded rectangle path
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* difficulty helpers: they read the current level */
  const fallSpeed = () => Math.min(SETTINGS.maxSpeed, SETTINGS.startSpeed + (level - 1) * SETTINGS.speedUpPerLevel);
  const spawnGap = () => Math.max(SETTINGS.minGap, SETTINGS.startGap - (level - 1) * SETTINGS.gapShrinkPerLevel);
  const maxAtOnce = () => Math.min(SETTINGS.maxMeteors, SETTINGS.startMeteors + Math.floor((level - 1) / SETTINGS.extraMeteorEveryLevels));
  const fallingMeteors = () => meteors.filter(m => m.mode === 'fall');

  /* ===================================================================
     5. SPAWNING  -  creating questions and meteors
     =================================================================== */
  function nextQuestion() {
    // which tiers are unlocked at this level?
    const tiers = [1, 2, 3].filter(t => level >= SETTINGS.tierUnlocksAtLevel[t]);
    const hardest = tiers[tiers.length - 1];
    // half of the time use the hardest tier, otherwise any unlocked tier
    const tier = Math.random() < 0.5 ? hardest : pick(tiers);
    let pool = QUESTIONS.filter(q => q.tier === tier && !recent.includes(q));
    if (!pool.length) { recent = []; pool = QUESTIONS.filter(q => q.tier === tier); }
    const q = pick(pool);
    recent.push(q);
    if (recent.length > 12) recent.shift();
    return q;
  }

  /* A sentence is cut into "tokens" (words). The gap is a special token. */
  function makeTokens(text) {
    return text.split(' ').map(word => word.includes('___')
      ? { gap: true, tail: word.replace('___', ''), text: '', boxW: 46, tailW: 0, w: 0 }
      : { gap: false, text: word, boxW: 0, tailW: 0, w: 0 });
  }
  function measureTokens(tokens) {
    ctx.font = `700 ${LOOK.textSize}px ${LOOK.font}`;
    tokens.forEach(t => {
      if (t.gap) { t.tailW = ctx.measureText(t.tail).width; t.w = t.boxW + t.tailW; }
      else t.w = ctx.measureText(t.text).width;
    });
  }
  const SPACE = 6;   // gap between words
  function wrapTokens(tokens, maxWidth) {        // splits tokens into lines that fit the card
    const lines = [[]];
    let used = 0;
    tokens.forEach(t => {
      const need = t.w + (used ? SPACE : 0);
      if (used + need > maxWidth && used > 0) { lines.push([]); used = 0; }
      lines[lines.length - 1].push(t);
      used += t.w + SPACE;
    });
    return lines;
  }

  function spawnMeteor() {
    const q = nextQuestion();
    const cardW = Math.min(W - 24, LOOK.cardMaxWidth);
    const tokens = makeTokens(q.text);
    measureTokens(tokens);
    const lines = wrapTokens(tokens, cardW - 30);
    const lineH = 25;
    const h = lines.length * lineH + 22;
    const x = W - 24 <= LOOK.cardMaxWidth ? W / 2 : rand(cardW / 2 + 12, W - cardW / 2 - 12);
    meteors.push({
      id: ++nextId, q, tokens, lines, lineH,
      x, y: -h - 70, w: cardW, h,          // y is the TOP of the card
      speedMul: rand(0.92, 1.08),          // each meteor falls a tiny bit differently
      wobble: rand(0, 6.28),
      choices: shuffle(q.choices),
      wrong: new Set(),                    // choices the player already got wrong
      mode: 'fall',                        // 'fall' -> 'dying' (being shot)
    });
  }

  /* where each word sits on the card (used by drawing AND by the explosion) */
  function layoutMeteor(m) {
    const out = [];
    m.lines.forEach((line, i) => {
      const total = line.reduce((s, t) => s + t.w, 0) + SPACE * (line.length - 1);
      let x = m.x - total / 2;
      const y = m.y + 11 + i * m.lineH + m.lineH / 2;
      line.forEach(t => { out.push({ t, x, y }); x += t.w + SPACE; });
    });
    return out;
  }

  /* ===================================================================
     6. ANSWERING  -  the answer buttons
     =================================================================== */
  function findTarget() {                       // the meteor closest to the airship
    const list = fallingMeteors();
    return list.length ? list.reduce((a, b) => (b.y > a.y ? b : a)) : null;
  }

  function showOptions() {                      // fill the buttons for the current target
    if (!target) {
      el.opts.classList.add('idle');
      el.opts.innerHTML = '<button class="gopt" disabled>&nbsp;</button><button class="gopt" disabled>&nbsp;</button>';
      return;
    }
    el.opts.classList.remove('idle');
    el.opts.innerHTML = target.choices.map((c, i) => {
      const bad = target.wrong.has(c);
      return `<button class="gopt${bad ? ' bad' : ''}" data-i="${i}"${bad ? ' disabled' : ''}>${c}</button>`;
    }).join('');
  }

  let lockUntil = 0, lockTimer = 0;               // anti-spam: taps are ignored until lockUntil
  function lockChoices(ms) {
    lockUntil = performance.now() + ms;
    if (ms > SETTINGS.tapCooldownMs) {            // a long lock (wrong answer): grey out the buttons too
      el.opts.classList.add('locked');
      clearTimeout(lockTimer);
      lockTimer = setTimeout(() => el.opts.classList.remove('locked'), ms);
    }
  }
  function unlockChoices() { lockUntil = 0; clearTimeout(lockTimer); el.opts.classList.remove('locked'); }

  function answer(choice) {
    if (state !== 'play' || !target) return;
    if (performance.now() < lockUntil) return;    // too fast, ignore the tap
    lockChoices(SETTINGS.tapCooldownMs);
    if (choice === target.q.answer) correctAnswer(target);
    else wrongAnswer(target, choice);
  }

  function correctAnswer(m) {
    streak++;
    const bonus = Math.min((streak - 1) * SETTINGS.streakBonus, SETTINGS.streakBonusMax);
    const points = SETTINGS.pointsPerHit + bonus;
    score += points;
    m.points = points;
    m.mode = 'dying';                           // stop falling, get shot
    const gapToken = m.tokens.find(t => t.gap);   // fill the gap with the right word
    gapToken.text = m.q.answer;
    ctx.font = `700 ${LOOK.textSize}px ${LOOK.font}`;
    gapToken.boxW = ctx.measureText(m.q.answer).width + 4;
    gapToken.w = gapToken.boxW + gapToken.tailW;
    gapToken.filled = true;
    shots.push({ x0: shipX, y0: H - LOOK.shipBottom - 30, m, t: 0, dur: 0.18 });
    target = findTarget();
    showOptions();
    updateHud();
    buzz(15);
  }

  function wrongAnswer(m, choice) {
    streak = 0;
    m.wrong.add(choice);
    shake = Math.max(shake, 0.15);
    hurt = 0.25;
    buzz(40);
    lockChoices(SETTINGS.wrongLockMs);            // no guessing again right away
    floaters.push({ x: m.x, y: m.y + m.h + 30, text: 'Wrong!', life: 0.9, max: 0.9 });
    if (SETTINGS.wrongAnswerCostsLife) loseLife();
    showOptions();
    updateHud();
  }

  function loseLife() {
    lives--;
    updateHud();
    if (lives <= 0) gameOver();
  }

  el.opts.addEventListener('click', e => {
    const b = e.target.closest('.gopt[data-i]');
    if (b && target) answer(target.choices[+b.dataset.i]);
  });
  document.addEventListener('keydown', e => {   // keys 1-4 also work (laptop)
    if (cur !== 'game' || state !== 'play' || !target) return;
    const i = '1234'.indexOf(e.key);
    if (i >= 0 && target.choices[i] && !target.wrong.has(target.choices[i])) answer(target.choices[i]);
  });

  /* ===================================================================
     7. UPDATE  -  runs every frame (about 60 times a second)
     =================================================================== */
  function update(dt) {
    elapsed += dt;

    // --- level up? ---
    const newLevel = 1 + Math.floor(elapsed / SETTINGS.secondsPerLevel);
    if (newLevel > level) {
      level = newLevel;
      floaters.push({ x: W / 2, y: H * 0.3, text: 'Level ' + level + '!', sub: 'Faster...', life: 1.8, max: 1.8, big: true });
      updateHud();
    }

    // --- survival points ---
    pointsCarry += dt * SETTINGS.pointsPerSecond;
    if (pointsCarry >= 1) { const p = Math.floor(pointsCarry); score += p; pointsCarry -= p; updateHud(); }

    // --- spawn new meteors ---
    spawnTimer -= dt;
    const falling = fallingMeteors();
    const roomAtTop = falling.every(m => m.y > H * 0.3);   // don't stack meteors on top of each other
    if (falling.length === 0) spawnTimer = Math.min(spawnTimer, 0.3);   // never leave the sky empty
    if (spawnTimer <= 0 && falling.length < maxAtOnce() && roomAtTop) {
      spawnMeteor();
      spawnTimer = spawnGap();
    }

    // --- move meteors, check if one lands ---
    for (const m of [...meteors]) {
      if (state !== 'play') break;               // the game ended during this loop
      if (m.mode !== 'fall') continue;
      m.y += fallSpeed() * H * m.speedMul * dt;
      if (m.y + m.h >= dangerY) meteorLanded(m);
    }
    // Game Over happened: only keep the effects moving, and don't re-enable the buttons
    if (state !== 'play') { updateEffects(dt); return; }

    // --- which meteor are the buttons for? ---
    const t = findTarget();
    if (t !== target) { target = t; showOptions(); }

    // --- shots flying from the airship to a meteor ---
    for (const s of [...shots]) {
      s.t += dt;
      if (s.t >= s.dur) { shots.splice(shots.indexOf(s), 1); explodeMeteor(s.m); }
    }

    // --- airship slides under the target ---
    const wantX = target ? target.x : W / 2;
    shipX += (wantX - shipX) * Math.min(1, dt * 4);

    updateEffects(dt);
  }

  function updateEffects(dt) {                  // things that keep moving, even on Game Over
    clock += dt;
    shake = Math.max(0, shake - dt);
    hurt = Math.max(0, hurt - dt);
    for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; p.life -= dt; }
    particles = particles.filter(p => p.life > 0);
    for (const b of wordBits) { b.x += b.vx * dt; b.y += b.vy * dt; b.vy += 320 * dt; b.rot += b.vr * dt; b.life -= dt; }
    wordBits = wordBits.filter(b => b.life > 0);
    for (const r of rings) { r.life -= dt; r.r += 260 * dt; }
    rings = rings.filter(r => r.life > 0);
    for (const f of floaters) { f.life -= dt; f.y -= (f.big ? 10 : 40) * dt; }
    floaters = floaters.filter(f => f.life > 0);
  }

  /* --- a meteor reaches the airship: ouch --- */
  function meteorLanded(m) {
    meteors.splice(meteors.indexOf(m), 1);
    streak = 0;
    burst(m.x, dangerY - 10, m.w * 0.6, 30, ['#ff6b6b', '#ff9f43', '#ffd166']);
    rings.push({ x: m.x, y: dangerY - 10, r: 10, life: 0.5, max: 0.5 });
    floaters.push({ x: m.x, y: dangerY - 40, text: 'Ouch!', life: 1, max: 1 });
    shake = 0.4; hurt = 0.5;
    buzz(120);
    target = findTarget();
    showOptions();
    loseLife();
  }

  /* --- a meteor was shot: the sentence explodes into flying words --- */
  function explodeMeteor(m) {
    const cx = m.x, cy = m.y + m.h / 2;
    meteors.splice(meteors.indexOf(m), 1);
    burst(cx, cy, m.w / 2, 36, LOOK.colors.fire);
    rings.push({ x: cx, y: cy, r: 10, life: 0.45, max: 0.45 });
    floaters.push({ x: cx, y: cy - 10, text: '+' + m.points, life: 1, max: 1, good: true });
    // every word of the sentence flies away on its own
    layoutMeteor(m).forEach(({ t, x, y }) => {
      const angle = Math.atan2(y - cy, x - cx + rand(-20, 20));
      const speed = rand(110, 260);
      wordBits.push({
        text: t.gap ? t.text + t.tail : t.text, good: !!t.filled,
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 120,
        rot: 0, vr: rand(-4, 4), life: 0.9, max: 0.9,
      });
    });
    shake = Math.max(shake, 0.08);
  }

  function burst(cx, cy, spread, count, colors) {   // a cloud of sparks
    for (let i = 0; i < count; i++) {
      const angle = rand(0, Math.PI * 2), speed = rand(60, 280);
      particles.push({
        x: cx + rand(-spread, spread), y: cy + rand(-10, 10),
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 80,
        size: rand(2, 5.5), color: pick(colors), life: rand(0.5, 1), max: 1,
      });
    }
  }

  /* ===================================================================
     8. DRAWING  -  paints one picture of the game
     =================================================================== */
  function resize() {
    if (!field.clientWidth || !field.clientHeight) return;
    W = field.clientWidth; H = field.clientHeight;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dangerY = H - LOOK.dangerFromBottom;
    shipX = shipX || W / 2;
    stars = Array.from({ length: 45 }, () => ({ x: rand(0, W), y: rand(0, H * 0.7), r: rand(0.6, 1.8), p: rand(0, 6.28) }));
    clouds = Array.from({ length: 5 }, () => ({ x: rand(0, W), y: rand(H * 0.2, H * 0.8), s: rand(0.7, 1.4), v: rand(5, 14) }));
  }

  function draw() {
    if (!W) return;
    ctx.save();
    if (shake > 0) ctx.translate(rand(-1, 1) * shake * 22, rand(-1, 1) * shake * 22);
    drawSky();
    drawDangerLine();
    meteors.forEach(m => drawMeteor(m, m === target));
    drawShots();
    drawShip();
    drawEffects();
    ctx.restore();
  }

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#102c47'); g.addColorStop(0.55, '#2d628c'); g.addColorStop(1, '#86c0e6');
    ctx.fillStyle = g; ctx.fillRect(-20, -20, W + 40, H + 40);
    // twinkling stars
    stars.forEach(s => {
      ctx.globalAlpha = 0.45 + 0.45 * Math.sin(clock * 2 + s.p);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.28); ctx.fill();
    });
    // slow clouds
    ctx.globalAlpha = 0.13; ctx.fillStyle = '#fff';
    clouds.forEach(c => {
      c.x -= c.v * 0.016; if (c.x < -90) c.x = W + 90;
      [[0, 0, 46], [34, 8, 34], [-34, 8, 32]].forEach(([dx, dy, r]) => {
        ctx.beginPath(); ctx.ellipse(c.x + dx * c.s, c.y + dy * c.s, r * c.s, r * 0.55 * c.s, 0, 0, 6.28); ctx.fill();
      });
    });
    ctx.globalAlpha = 1;
    // rolling hills at the bottom
    [['#3f7566', 30, 0.018, 0], ['#4f8c78', 18, 0.025, 2]].forEach(([color, height, freq, phase]) => {
      ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(-10, H + 10);
      for (let x = -10; x <= W + 10; x += 16) ctx.lineTo(x, H - height + Math.sin(x * freq + phase) * 9);
      ctx.lineTo(W + 10, H + 10); ctx.fill();
    });
  }

  function drawDangerLine() {
    ctx.save();
    ctx.setLineDash([8, 8]); ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, dangerY); ctx.lineTo(W, dangerY); ctx.stroke();
    ctx.restore();
  }

  function drawMeteor(m, isTarget) {
    const x = m.x + Math.sin(clock * 2 + m.wobble) * 3, y = m.y, w = m.w, h = m.h;
    const flicker = 1 + Math.sin(clock * 18 + m.wobble) * 0.1;
    const tail = 80 * flicker;
    // flame trail above the card
    const flame = ctx.createLinearGradient(0, y, 0, y - tail);
    flame.addColorStop(0, 'rgba(255,170,60,.95)'); flame.addColorStop(1, 'rgba(255,90,40,0)');
    ctx.fillStyle = flame;
    ctx.beginPath(); ctx.moveTo(x - w * 0.36, y + 8);
    ctx.quadraticCurveTo(x - w * 0.18, y - tail * 0.55, x, y - tail);
    ctx.quadraticCurveTo(x + w * 0.18, y - tail * 0.55, x + w * 0.36, y + 8); ctx.fill();
    ctx.fillStyle = 'rgba(255,240,170,.55)';
    ctx.beginPath(); ctx.moveTo(x - w * 0.18, y + 6);
    ctx.quadraticCurveTo(x - w * 0.08, y - tail * 0.35, x, y - tail * 0.6);
    ctx.quadraticCurveTo(x + w * 0.08, y - tail * 0.35, x + w * 0.18, y + 6); ctx.fill();
    // rocky card
    ctx.save();
    ctx.shadowColor = isTarget ? '#ffd166' : '#ff8a4c'; ctx.shadowBlur = isTarget ? 24 : 12;
    const rock = ctx.createLinearGradient(0, y, 0, y + h);
    rock.addColorStop(0, '#6a5590'); rock.addColorStop(1, '#3d3160');
    ctx.fillStyle = rock; roundRect(x - w / 2, y, w, h, 20); ctx.fill();
    ctx.restore();
    ctx.lineWidth = isTarget ? 3 : 2; ctx.strokeStyle = isTarget ? '#ffd166' : '#ff9f43';
    roundRect(x - w / 2, y, w, h, 20); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,.16)';                    // craters
    [[-0.38, 0.28, 7], [0.4, 0.7, 5], [0.12, 0.2, 4]].forEach(([cx, cy, r]) => {
      ctx.beginPath(); ctx.arc(x + cx * w, y + cy * h, r, 0, 6.28); ctx.fill();
    });
    // the sentence
    ctx.font = `700 ${LOOK.textSize}px ${LOOK.font}`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    const moved = { ...m, x };
    layoutMeteor(moved).forEach(({ t, x: tx, y: ty }) => {
      if (!t.gap) { ctx.fillStyle = '#fff'; ctx.fillText(t.text, tx, ty); return; }
      if (t.filled) {
        ctx.fillStyle = LOOK.colors.right; ctx.fillText(t.text, tx, ty);
      } else {
        ctx.fillStyle = 'rgba(255,209,102,.28)'; roundRect(tx, ty - 13, t.boxW, 26, 8); ctx.fill();
        ctx.strokeStyle = LOOK.colors.gap; ctx.lineWidth = 2; roundRect(tx, ty - 13, t.boxW, 26, 8); ctx.stroke();
        ctx.fillStyle = LOOK.colors.gap; ctx.textAlign = 'center'; ctx.fillText('?', tx + t.boxW / 2, ty); ctx.textAlign = 'left';
      }
      ctx.fillStyle = '#fff'; ctx.fillText(t.tail, tx + t.boxW, ty);
    });
  }

  function drawShots() {
    shots.forEach(s => {
      const k = clamp(s.t / s.dur, 0, 1);
      const tx = s.m.x, ty = s.m.y + s.m.h / 2;
      const x = s.x0 + (tx - s.x0) * k, y = s.y0 + (ty - s.y0) * k;
      ctx.strokeStyle = 'rgba(255,230,150,.7)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(s.x0 + (tx - s.x0) * Math.max(0, k - 0.35), s.y0 + (ty - s.y0) * Math.max(0, k - 0.35)); ctx.lineTo(x, y); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.shadowColor = '#ffd166'; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.arc(x, y, 6, 0, 6.28); ctx.fill(); ctx.shadowBlur = 0;
    });
  }

  function drawShip() {
    const scale = clamp(W / 380, 0.8, 1.15);
    const bob = Math.sin(clock * 2) * 3;
    ctx.save();
    ctx.translate(shipX, H - LOOK.shipBottom + bob); ctx.scale(scale, scale);
    if (hurt > 0 && Math.floor(hurt * 20) % 2 === 0) ctx.globalAlpha = 0.5;   // blinks when hit
    // tail fin and propeller (back of the airship)
    ctx.fillStyle = '#e07a5f';
    ctx.beginPath(); ctx.moveTo(-50, -8); ctx.lineTo(-76, -26); ctx.lineTo(-72, -2); ctx.lineTo(-76, 18); ctx.lineTo(-50, 6); ctx.fill();
    ctx.save(); ctx.translate(-80, -4); ctx.rotate(clock * 22);
    ctx.fillStyle = '#33402f'; ctx.fillRect(-2, -14, 4, 28); ctx.restore();
    // balloon with coloured stripes
    ctx.save();
    ctx.beginPath(); ctx.ellipse(0, -8, 58, 30, 0, 0, 6.28); ctx.clip();
    ctx.fillStyle = '#d5eefb'; ctx.fillRect(-60, -40, 120, 70);
    ctx.fillStyle = '#e5b544'; ctx.fillRect(-26, -40, 14, 70);
    ctx.fillStyle = '#c9775a'; ctx.fillRect(12, -40, 14, 70);
    ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.ellipse(-18, -22, 24, 7, -0.3, 0, 6.28); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#4f86a0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, -8, 58, 30, 0, 0, 6.28); ctx.stroke();
    // ropes and cabin
    ctx.strokeStyle = '#7a5a3c'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-18, 18); ctx.lineTo(-12, 30); ctx.moveTo(18, 18); ctx.lineTo(12, 30); ctx.stroke();
    ctx.fillStyle = '#8a5a3c'; roundRect(-18, 28, 36, 18, 6); ctx.fill();
    ctx.fillStyle = '#ffe9a8'; roundRect(-10, 32, 8, 8, 2); ctx.fill(); roundRect(2, 32, 8, 8, 2); ctx.fill();
    ctx.restore();
  }

  function drawEffects() {
    rings.forEach(r => {
      ctx.globalAlpha = clamp(r.life / r.max, 0, 1);
      ctx.strokeStyle = '#fff3c4'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, 6.28); ctx.stroke();
    });
    particles.forEach(p => {
      ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 6.28); ctx.fill();
    });
    ctx.font = `700 ${LOOK.textSize}px ${LOOK.font}`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    wordBits.forEach(b => {                        // the words of the exploded sentence
      ctx.globalAlpha = clamp(b.life / b.max, 0, 1);
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.rot);
      ctx.fillStyle = b.good ? LOOK.colors.right : '#fff'; ctx.fillText(b.text, 0, 0); ctx.restore();
    });
    ctx.textAlign = 'center';
    floaters.forEach(f => {                        // "+12", "Ouch!", "Level 2!"
      ctx.globalAlpha = clamp(f.life / f.max * 1.5, 0, 1);
      ctx.font = `800 ${f.big ? 34 : 22}px ${LOOK.font}`;
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(10,30,50,.7)'; ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.good ? LOOK.colors.right : f.big ? '#ffd166' : '#fff'; ctx.fillText(f.text, f.x, f.y);
      if (f.sub) { ctx.font = `600 16px ${LOOK.font}`; ctx.fillStyle = '#fff'; ctx.fillText(f.sub, f.x, f.y + 28); }
    });
    ctx.globalAlpha = 1; ctx.textAlign = 'left';
  }

  /* the score, hearts and level shown above the play area */
  function updateHud() {
    el.score.textContent = score || 0;
    el.level.textContent = 'Level ' + (level || 1);
    el.streak.textContent = streak >= 3 ? streak + ' in a row!' : '';
    el.lives.innerHTML = Array.from({ length: SETTINGS.lives }, (_, i) =>
      `<svg class="i${i < lives ? '' : ' off'}" aria-hidden="true"><use href="#i-heart"/></svg>`).join('');
  }

  /* ===================================================================
     9. SCREENS  -  Start / Paused / Game Over
     =================================================================== */
  function showOverlay(title, text, buttonText, backVisible) {
    el.ovTitle.textContent = title;
    el.ovText.innerHTML = text;
    el.ovBtn.textContent = buttonText;
    el.ovBack.hidden = !backVisible;
    el.overlay.hidden = false;
  }

  function showReady() {
    state = 'ready';
    resetGame(false);
    showOverlay('Sky Rescue',
      'Sentences are falling like meteors!<br>Tap the word that fits the gap to blast them before they reach your airship.' +
      (best ? '<br><b>Best score: ' + best + '</b>' : ''),
      'Start', false);
    startLoop();
  }

  function gameOver() {
    state = 'over';
    target = null; showOptions();             // grey out the answer buttons
    const isBest = score > best;
    if (isBest) { best = score; saveBest(); }
    const mins = Math.floor(elapsed / 60), secs = String(Math.floor(elapsed % 60)).padStart(2, '0');
    showOverlay('Game over',
      '<span class="gbig">' + score + '</span><br>' + (isBest ? 'New best score!' : 'Best: ' + best) +
      '<br>Survived ' + mins + ':' + secs + ' &middot; Level ' + level,
      'Play again', true);
    buzz([60, 60, 120]);
  }

  function pauseGame() {
    if (state !== 'play') return;
    state = 'paused';
    showOverlay('Paused', 'Take a breath!', 'Resume', true);
  }

  el.ovBtn.addEventListener('click', () => {
    if (state === 'paused') { state = 'play'; el.overlay.hidden = true; lastTime = performance.now(); return; }
    beginGame();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });

  /* ===================================================================
     10. STARTING UP
     =================================================================== */
  function resetGame(fresh) {
    score = 0; lives = SETTINGS.lives; level = 1; streak = 0; elapsed = 0; pointsCarry = 0;
    spawnTimer = 0.6;
    meteors = []; shots = []; particles = []; wordBits = []; rings = []; floaters = [];
    target = null; shake = 0; hurt = 0; recent = [];
    unlockChoices();
    shipX = W / 2;
    showOptions(); updateHud();
  }

  function beginGame() {
    resize();
    resetGame(true);
    state = 'play';
    el.overlay.hidden = true;
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - lastTime) / 1000 || 0);
    lastTime = now;
    if (state === 'play') update(dt);
    else if (state !== 'paused') updateEffects(dt);
    draw();
  }
  function startLoop() { cancelAnimationFrame(raf); lastTime = performance.now(); raf = requestAnimationFrame(frame); }
  function stop() { cancelAnimationFrame(raf); raf = 0; state = 'ready'; }

  /* the Games menu shows the best score */
  function updateMenu() {
    if (el.menuBest) el.menuBest.textContent = best ? 'Best score: ' + best : 'Blast the meteors with the right word.';
  }

  /* called by script.js every time the screen changes */
  window.onScreen = id => {
    if (id === 'game') { resize(); showReady(); }
    else { stop(); if (id === 'games') updateMenu(); }
  };
  if (window.ResizeObserver) new ResizeObserver(resize).observe(field); else addEventListener('resize', resize);
  document.addEventListener('click', e => { if (e.target.closest('[data-game="skyrescue"]')) go('game'); });
  updateMenu();

  return { stop };
})();