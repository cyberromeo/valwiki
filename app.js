// ===== API Configuration =====
const API_BASE = 'https://valorant-api.com/v1';

// ===== Data Cache =====
const cache = {
    agents: null,
    weapons: null,
    maps: null,
    gamemodes: null,
    playercards: null,
    buddies: null,
    sprays: null,
    titles: null,
    ranks: null,
    currencies: null
};

// ===== DOM Elements =====
const app = document.getElementById('app');
const loader = document.getElementById('loader');
const modal = document.getElementById('agent-modal');
const modalContent = document.getElementById('agent-detail-content');
const navLinks = document.querySelectorAll('.nav-link');
const mobileToggle = document.querySelector('.mobile-toggle');
const navContainer = document.querySelector('.nav-links');

// ===== API Functions =====
async function fetchData(endpoint) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error("Fetch Error:", error);
        return [];
    }
}

async function getAgents() {
    if (cache.agents) return cache.agents;
    const agents = await fetchData('/agents?isPlayableCharacter=true');
    cache.agents = agents;
    return agents;
}

async function getWeapons() {
    if (cache.weapons) return cache.weapons;
    const weapons = await fetchData('/weapons');
    cache.weapons = weapons;
    return weapons;
}

async function getMaps() {
    if (cache.maps) return cache.maps;
    const maps = await fetchData('/maps');
    cache.maps = maps.filter(m => m.displayName !== 'The Range' && m.displayName !== 'Basic Training');
    return cache.maps;
}

async function getPlayerCards() {
    if (cache.playercards) return cache.playercards;
    const cards = await fetchData('/playercards');
    cache.playercards = cards.filter(c => c.displayIcon);
    return cache.playercards;
}

async function getRanks() {
    if (cache.ranks) return cache.ranks;
    const tiers = await fetchData('/competitivetiers');
    const latestTiers = tiers[tiers.length - 1]; // Latest episode
    cache.ranks = latestTiers.tiers.filter(t => t.tierName !== 'UNRANKED' && t.largeIcon);
    return cache.ranks;
}

async function getBuddies() {
    if (cache.buddies) return cache.buddies;
    const buddies = await fetchData('/buddies');
    cache.buddies = buddies.filter(b => b.displayIcon);
    return cache.buddies;
}

async function getSprays() {
    if (cache.sprays) return cache.sprays;
    const sprays = await fetchData('/sprays');
    cache.sprays = sprays.filter(s => s.displayIcon); // Some sprays might not have icons
    return cache.sprays;
}

async function getTitles() {
    if (cache.titles) return cache.titles;
    const titles = await fetchData('/playertitles');
    cache.titles = titles.filter(t => t.titleText);
    return cache.titles;
}

async function getCurrencies() {
    if (cache.currencies) return cache.currencies;
    const currencies = await fetchData('/currencies');
    cache.currencies = currencies;
    return cache.currencies;
}

async function getSeasons() {
    // No cache needed usually as it's small, but consistency
    const seasons = await fetchData('/seasons');
    return seasons; // Typically we want episodes/acts structure, but raw list is fine for now
}

// ===== Loader Functions =====
function showLoader() {
    if (loader) loader.classList.remove('hidden');
}

function hideLoader() {
    if (loader) loader.classList.add('hidden');
}

function openModal(htmlContent, className = '') {
    if (!modal || !modalContent) return;

    // Reset classes - clear all custom classes, keep ID functionality
    // Important: Do NOT add 'modal-content' class here as it's already on the parent
    modalContent.className = '';
    if (className) modalContent.classList.add(className);

    modalContent.innerHTML = htmlContent;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ===== Navigation =====
function setActiveNav(page) {
    navLinks.forEach(link => {
        if (link.dataset.page === page) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
            if (page === 'home' && link.dataset.page === 'home') link.classList.add('active');
        }
    });
}

// ===== Render Functions =====

// HOME
// ===== RETRO// GAME ENGINE - SHOOT THE BLIND (AIM TRAINER)
const RetroGame = {
    canvas: null,
    ctx: null,
    width: 320, // Higher res for pixel art
    height: 180,
    scale: 1,
    running: false,
    score: 0,
    highScore: window.localStorage.getItem('val_retro_highscore') || 0,

    // Assets (Code Only)
    sprites: {
        eye: [
            [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
            [0, 0, 1, 1, 2, 2, 2, 2, 2, 2, 1, 1, 0, 0],
            [0, 1, 2, 2, 3, 3, 3, 3, 3, 3, 2, 2, 1, 0],
            [1, 2, 2, 3, 3, 4, 4, 4, 4, 3, 3, 2, 2, 1],
            [1, 2, 3, 3, 4, 0, 0, 0, 0, 4, 3, 3, 2, 1],
            [1, 2, 3, 4, 0, 0, 0, 0, 0, 0, 4, 3, 2, 1],
            [1, 2, 3, 4, 0, 0, 0, 0, 0, 0, 4, 3, 2, 1],
            [1, 2, 3, 4, 0, 0, 0, 0, 0, 0, 4, 3, 2, 1],
            [1, 2, 3, 4, 0, 0, 0, 0, 0, 0, 4, 3, 2, 1],
            [1, 2, 3, 3, 4, 0, 0, 0, 0, 4, 3, 3, 2, 1],
            [1, 2, 2, 3, 3, 4, 4, 4, 4, 3, 3, 2, 2, 1],
            [0, 1, 2, 2, 3, 3, 3, 3, 3, 3, 2, 2, 1, 0],
            [0, 0, 1, 1, 2, 2, 2, 2, 2, 2, 1, 1, 0, 0],
            [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0]
        ],
        reyna: [
            [0, 0, 0, 0, 1, 1, 1, 0, 0, 0],
            [0, 0, 0, 0, 1, 1, 1, 0, 0, 0], // Head
            [0, 0, 0, 1, 1, 1, 1, 1, 0, 0],
            [0, 0, 1, 0, 1, 2, 1, 0, 1, 0], // Shoulders
            [0, 1, 3, 0, 1, 2, 1, 0, 3, 1], // Body
            [0, 1, 3, 0, 2, 2, 2, 0, 3, 1],
            [0, 0, 0, 1, 2, 2, 2, 1, 0, 0],
            [0, 0, 0, 1, 2, 4, 2, 1, 0, 0], // Legs
            [0, 0, 0, 1, 1, 0, 1, 1, 0, 0],
            [0, 0, 0, 1, 1, 0, 1, 1, 0, 0],
            [0, 0, 1, 1, 0, 0, 0, 1, 1, 0]
        ]
    },
    // Palette
    colors: [
        null,     // 0 = Transparent
        '#3f1b4f', // 1 = Dark Purple
        '#9c27b0', // 2 = Reyna Purple
        '#e1bee7', // 3 = Light Pink/White
        '#111111', // 4 = Dark Grey
    ],

    // Game State
    targets: [],
    particles: [],
    reyna: { x: 280, y: 140, active: true, timer: 0, scale: 4 }, // Stand on right
    chat: { active: false, text: "", timer: 0 },
    roasts: [
        "PATHETIC", "MISSED AGAIN?", "ARE YOU BLIND?",
        "TRY HARDER", "MY GRANDMA AIMS BETTER", "DISAPPOINTING"
    ],
    mouse: { x: 0, y: 0, click: false },
    misses: 0,
    shots: 0,
    hits: 0,
    wave: 0,

    init: function () {
        const container = document.getElementById('game-container-root');
        if (!container) return;

        container.innerHTML = `
            <div class="game-overlay" id="game-start-screen">
                <div class="game-title">SHOOT THE BLIND</div>
                <div class="game-score-label">HIGH SCORE: ${this.highScore}</div>
                <button class="game-start-btn" onclick="RetroGame.startGame()">PRACTICE AIM</button>
                <p style="color: var(--ui-gray-500); font-family: var(--font-dot); font-size: 0.8rem; margin-top: 1rem;">
                    DESTROY THE LEERS <br> CLICK TO SHOOT
                </p>
            </div>
            <div class="game-overlay hidden" id="game-over-screen">
                <div class="game-title" style="color: var(--ui-red);">SESSION COMPLETE</div>
                <div class="game-score-label" id="final-score">SCORE: 0</div>
                <button class="game-start-btn" onclick="RetroGame.resetGame()">AGAIN</button>
            </div>
            <div class="game-hud">
                <div class="hud-item" id="hud-score">HITS: 0</div>
                 <div class="hud-item" style="color: var(--ui-red);" id="hud-misses">MISS: 0</div>
                <div class="hud-item" style="color: var(--ui-white);" id="hud-status">ACC: 100%</div>
            </div>
            <canvas id="game-canvas" style="cursor: none;"></canvas>
        `;

        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Handle Resize
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Inputs
        this.setupInputs();

        // Initial Render
        this.draw();
    },

    resize: function () {
        if (!this.canvas) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.width * (9 / 16);
        this.scale = this.canvas.width / this.width;

        // Ensure pixelated look
        this.ctx.imageSmoothingEnabled = false;
    },

    setupInputs: function () {
        const updatePos = (clientX, clientY) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = (clientX - rect.left) / (rect.width / this.width);
            this.mouse.y = (clientY - rect.top) / (rect.height / this.height);
        };

        window.addEventListener('mousemove', e => updatePos(e.clientX, e.clientY));

        this.canvas.addEventListener('mousedown', () => {
            this.mouse.click = true;
            this.shoot();
        });

        // Mobile touch
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const t = e.touches[0];
            updatePos(t.clientX, t.clientY);
            this.mouse.click = true;
            this.shoot();
        }, { passive: false });
    },

    startGame: function () {
        document.getElementById('game-start-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.add('hidden');
        this.resetState();
        this.running = true;
        this.loop();
    },

    resetGame: function () {
        this.startGame();
    },

    resetState: function () {
        this.score = 0;
        this.shots = 0;
        this.hits = 0;
        this.misses = 0;
        this.targets = [];
        this.particles = [];
        this.reyna = { x: 260, y: 130, active: true, timer: 0, scale: 5 }; // Persistent Reyna on right
        this.chat = { active: false, text: "", timer: 0 };
        this.spawnTimer = 0;
        this.updateScore();
    },

    updateScore: function () {
        const el = document.getElementById('hud-score');
        if (el) el.innerText = `HITS: ${this.score}`;

        const elMiss = document.getElementById('hud-misses');
        if (elMiss) elMiss.innerText = `MISS: ${this.misses}`;

        const acc = this.shots > 0 ? Math.floor((this.hits / this.shots) * 100) : 100;
        const el2 = document.getElementById('hud-status');
        if (el2) el2.innerText = `ACC: ${acc}%`;
    },

    triggerRoast: function () {
        if (this.chat.active) return; // Already roasting
        const txt = this.roasts[Math.floor(Math.random() * this.roasts.length)];
        this.chat.text = txt;
        this.chat.active = true;
        this.chat.timer = 90; // 1.5s
    },

    shoot: function () {
        if (!this.running) return;
        this.shots++;

        // Raycast / Hit check
        let hit = false;
        // Iterate backwards
        for (let i = this.targets.length - 1; i >= 0; i--) {
            let t = this.targets[i];
            const size = 20 * t.scale;

            if (this.mouse.x > t.x - size / 2 &&
                this.mouse.x < t.x + size / 2 &&
                this.mouse.y > t.y - size / 2 &&
                this.mouse.y < t.y + size / 2) {

                // HIT
                this.spawnParticles(t.x, t.y, '#9c27b0'); // Purple blood/magic
                this.targets.splice(i, 1);
                this.score++;
                this.hits++;
                hit = true;
                break; // One shot one kill
            }
        }

        if (!hit) {
            this.misses++;
            if (this.misses % 3 === 0) { // Roast every 3 misses
                this.triggerRoast();
            }
        }

        this.updateScore();
    },

    gameOver: function () {
        // Just a session end, no real 'death' in aim trainer typically?
        // Or maybe if you miss too many?
        // Let's keep it endless for now or until user stops.

        // For 'Shoot the Blind': If too many eyes on screen?
    },

    spawnTarget: function () {
        // Random side
        const side = Math.random() > 0.5 ? 'left' : 'right';
        const startX = side === 'left' ? -20 : this.width + 20;
        const destX = side === 'left' ? this.width + 20 : -20;

        this.targets.push({
            x: startX,
            y: Math.random() * (this.height - 40) + 20,
            vx: (side === 'left' ? 1 : -1) * (Math.random() * 1 + 0.5),
            vy: (Math.random() - 0.5) * 1,
            scale: Math.random() * 0.5 + 0.8, // Varied sizes
            life: 1000
        });
    },

    loop: function () {
        if (!this.running) return;
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    },

    update: function () {
        // Spawn
        this.spawnTimer++;
        if (this.spawnTimer > 60) { // Every second-ish
            this.spawnTarget();
            this.spawnTimer = 0;
        }

        // Targets
        for (let i = this.targets.length - 1; i >= 0; i--) {
            let t = this.targets[i];
            t.x += t.vx;
            t.y += t.vy;

            // Bounce Y (Floor at 160)
            if (t.y < 10 || t.y > 150) t.vy *= -1;

            // Remove if off screen far side
            if ((t.vx > 0 && t.x > this.width + 30) || (t.vx < 0 && t.x < -30)) {
                this.targets.splice(i, 1);
                this.misses++; // Missed target
                this.triggerRoast();
                this.updateScore();
            }
        }

        // Chat Timer
        if (this.chat.active) {
            this.chat.timer--;
            if (this.chat.timer <= 0) this.chat.active = false;
        }

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.life--;
            p.x += p.vx;
            p.y += p.vy;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    },

    triggerReyna: function () {
        // This function is no longer used as Reyna is persistent and roasts via triggerRoast
    },

    spawnParticles: function (x, y, color) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: 30,
                color: color
            });
        }
    },

    draw: function () {
        // Clear (Pitch Black)
        this.ctx.fillStyle = '#1B1D1F';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.scale(this.scale, this.scale);

        // Floor
        const floorY = 170;
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, floorY, this.width, this.height - floorY);
        this.ctx.strokeStyle = '#333';
        this.ctx.beginPath();
        this.ctx.moveTo(0, floorY); this.ctx.lineTo(this.width, floorY);
        this.ctx.stroke();

        // Targets (Eyes)
        this.targets.forEach(t => {
            this.drawSprite(this.sprites.eye, t.x, t.y, t.scale * 2);
        });

        // Reyna (Persistent on Right)
        if (this.reyna.active) {
            // Standing on floor (y approx 170)
            // Sprite is roughly 11 high. Scale 5 => 55px high.
            // Center Y should be 170 - 55/2 = 142.5
            this.drawSprite(this.sprites.reyna, this.reyna.x, 145, this.reyna.scale);

            // Chat Bubble
            if (this.chat.active) {
                this.drawChatBubble(this.chat.text, this.reyna.x - 20, 110);
            }
        }

        // Particles
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x, p.y, 2, 2);
        });

        // Crosshair
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(this.mouse.x, this.mouse.y, 5, 0, Math.PI * 2);
        this.ctx.moveTo(this.mouse.x - 8, this.mouse.y);
        this.ctx.lineTo(this.mouse.x + 8, this.mouse.y);
        this.ctx.moveTo(this.mouse.x, this.mouse.y - 8);
        this.ctx.lineTo(this.mouse.x, this.mouse.y + 8);
        this.ctx.stroke();

        this.ctx.restore();
    },

    drawChatBubble: function (text, x, y) {
        this.ctx.fillStyle = '#fff';
        const w = text.length * 6 + 10;
        const h = 14;
        this.ctx.fillRect(x - w, y, w, h);

        // Triangle tail
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + h - 4);
        this.ctx.lineTo(x + 5, y + h);
        this.ctx.lineTo(x, y + h);
        this.ctx.fill();

        this.ctx.fillStyle = '#000';
        this.ctx.font = '8px monospace';
        this.ctx.fillText(text, x - w + 5, y + 10);
    },

    drawSprite: function (matrix, cx, cy, s) {
        const h = matrix.length;
        const w = matrix[0].length;
        const startX = Math.floor(cx - (w * s) / 2);
        const startY = Math.floor(cy - (h * s) / 2);

        for (let r = 0; r < h; r++) {
            for (let c = 0; c < w; c++) {
                const colorIndex = matrix[r][c];
                if (colorIndex !== 0) {
                    this.ctx.fillStyle = this.colors[colorIndex];
                    this.ctx.fillRect(startX + c * s, startY + r * s, s, s);
                }
            }
        }
    }
};

// HOME RENDERER
function renderHomePage(agents) {
    const featured = agents.slice(0, 6);

    const categories = [
            { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 6V16L12 22L23 16V6L12 0L1 6Z"/><path d="M12 22V12"/><path d="M23 6L12 12L1 6"/></svg>', name: 'MAPS', page: 'maps' },
            { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12L7 2L12 12"/><path d="M12 12L17 2L22 12"/><circle cx="12" cy="18" r="4"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="18" x2="14" y2="18"/></svg>', name: 'WEAPONS', page: 'weapons' },
            { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><circle cx="12" cy="12" r="3"/><rect x="2" y="4" width="6" height="16" rx="1"/></svg>', name: 'CARDS', page: 'cards' },
            { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="5"/><path d="M12 13L12 22"/><path d="M5 22L7 13M19 22L17 13"/></svg>', name: 'BUDDIES', page: 'buddies' },
            { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>', name: 'SPRAYS', page: 'sprays' },
            { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41L12.59 21.41C12.21 21.79 11.66 22 11.09 22H6L2 18V12.91C2 12.35 2.22 11.8 2.59 11.41L10.59 3.41C11.37 2.63 12.63 2.63 13.41 3.41L20.59 10.59C21.37 11.37 21.37 12.63 20.59 13.41Z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>', name: 'TITLES', page: 'titles' },
            { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><path d="M12 6V12L16 14"/><path d="M9 2L12 6L15 2"/><path d="M9 22L12 18L15 22"/></svg>', name: 'CURRENCY', page: 'currency' },
            { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>', name: 'SEASONS', page: 'seasons' },
            { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9L12 3L18 9"/><path d="M12 3V15"/><path d="M20 21H4"/><path d="M16 21V17"/><path d="M8 21V19"/></svg>', name: 'RANKS', page: 'ranks' },
            { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>', name: 'ABOUT', page: 'about' },
        ];

    return `
        <div class="landing-container">
            <!-- HERO SECTION -->
            <section class="landing-hero hero-section">
                <div class="bg-deco-text" style="top: 2rem; left: 2rem;">VLT/01<br>PROTOCOL</div>
                <div class="bg-deco-text" style="bottom: 2rem; right: 2rem; text-align: right;">SEC/781<br>CLEARANCE</div>
                <div class="vertical-scroll">▸ SYSTEM ONLINE ▸ DATABASE LOADED ▸ ACCESS GRANTED ▸</div>
                <div class="floating-shape" style="top: 15%; left: 10%;"></div>
                <div class="floating-shape" style="bottom: 20%; right: 8%;"></div>
                <div class="floating-shape" style="top: 40%; right: 15%; width: 8px; height: 8px;"></div>
                
                <h1 class="hero-title glitch-text" data-text="VALORANT WIKI">VALORANT WIKI</h1>
                <p class="hero-subtitle">CLASSIFIED DATABASE // ACCESS GRANTED</p>
                <button class="cta-btn primary hero-cta" data-page="agents">ENTER DATABASE</button>
            </section>

            <!-- CATEGORY QUICK ACCESS GRID -->
            <section class="landing-feature">
                <div class="feature-header">
                    <h3 class="glitch-text" data-text="DATABASE">DATABASE</h3>
                    <div class="feature-line"></div>
                </div>
                <div class="category-grid">
                    ${categories.map(cat => `
                                            <div class="category-card" data-page="${cat.page}">
                                                <span class="category-icon">${cat.icon}</span>
                                                <span class="category-name">${cat.name}</span>
                                            </div>
                                        `).join('')}
                </div>
            </section>

            <!-- FEATURED AGENTS -->
            <section class="landing-feature">
                <div class="feature-header">
                    <h3 class="glitch-text" data-text="AGENTS">AGENTS</h3>
                    <div class="feature-line"></div>
                </div>
                <div class="new-agents-grid">
                    ${featured.map(agent => `
                        <div class="new-agent-card cta-btn" data-uuid="${agent.uuid}">
                            <div class="ag-img">
                                <img src="${agent.displayIcon}" alt="${agent.displayName}">
                            </div>
                            <span>${agent.displayName}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="landing-actions" style="text-align: center; margin-top: 2rem;">
                    <button class="cta-btn primary" data-page="agents">VIEW FULL ROSTER</button>
                </div>
            </section>

            <!-- AIM TRAINER MINI GAME -->
            <section class="landing-feature aim-trainer-section">
                <div class="feature-header">
                    <h3 class="glitch-text" data-text="AIM TRAINER">AIM TRAINER</h3>
                    <div class="feature-line"></div>
                </div>
                <div class="aim-trainer-preview" id="aim-trainer-preview">
                    <p class="aim-trainer-desc">SHOOT THE BLIND — DESTROY THE LEERS BEFORE THEY ESCAPE</p>
                    <p class="aim-trainer-highscore">HIGH SCORE: ${RetroGame.highScore}</p>
                    <button class="cta-btn primary" id="play-aim-trainer-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:middle;margin-right:6px"><polygon points="5,3 19,12 5,21"/></svg>PLAY AIM TRAINER</button>
                </div>
            </section>
        </div>
    `;
}

// AGENTS
function renderAgentCard(agent) {
    return `
        <div class="card agent-card" data-uuid="${agent.uuid}" style="cursor: pointer;">
            <img src="${agent.displayIcon}" alt="${agent.displayName}">
            <h3>${agent.displayName}</h3>
            <p>// ${agent.role ? agent.role.displayName : 'UNKNOWN'}</p>
        </div>
    `;
}

function renderAgentsPage(agents) {
    return `
        <div class="container">
            <div class="page-header">
                <h1>AGENTS</h1>
                <div class="filters">
                    <button class="filter-btn active" data-role="all">ALL</button>
                    <button class="filter-btn" data-role="Duelist">DUELIST</button>
                    <button class="filter-btn" data-role="Initiator">INITIATOR</button>
                    <button class="filter-btn" data-role="Sentinel">SENTINEL</button>
                    <button class="filter-btn" data-role="Controller">CONTROLLER</button>
                </div>
            </div>
            <div class="grid" id="agents-grid">
                ${agents.map(agent => renderAgentCard(agent)).join('')}
            </div>
        </div>
    `;
}

function renderAgentDetail(agent) {
    return `
        <div class="modal-detail" style="
            background-image: linear-gradient(to right, rgba(0,0,0,0.9), rgba(0,0,0,0.7)), url('${agent.background}');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
        ">
            <div class="detail-img">
                <img src="${agent.fullPortrait}" alt="${agent.displayName}">
            </div>
            <div class="detail-info">
                <h2>${agent.displayName}</h2>
                <div class="role-badge">${agent.role ? agent.role.displayName : 'UNKNOWN'}</div>
                <p>${agent.description}</p>
                
                <div class="abilities">
                    <h3>ABILITIES</h3>
                    ${agent.abilities.map(ability => `
                        <div class="ability-row">
                            ${ability.displayIcon ? `<img src="${ability.displayIcon}" class="ability-icon" alt="${ability.displayName}">` : ''}
                            <div>
                                <h4>${ability.displayName}</h4>
                                <p style="font-size: 0.8rem; color: var(--ui-gray-500);">${ability.description}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

// WEAPONS
function renderWeaponCard(weapon) {
    return `
        <div class="card weapon-card" data-uuid="${weapon.uuid}" style="cursor: pointer;">
            <img src="${weapon.displayIcon}" alt="${weapon.displayName}" style="object-fit: contain; aspect-ratio: 16/9;">
            <h3>${weapon.displayName}</h3>
            <p>${weapon.shopData ? weapon.shopData.category : 'Melee'}</p>
        </div>
    `;
}

function renderWeaponDetail(weapon) {
    return `
        <div class="modal-detail">
            <div class="detail-img">
                <img src="${weapon.displayIcon}" alt="${weapon.displayName}" style="object-fit: contain;">
            </div>
            <div class="detail-info">
                <h2>${weapon.displayName}</h2>
                <div class="role-badge">${weapon.shopData ? weapon.shopData.category : 'Melee'}</div>
                
                <div class="weapon-stats">
                    ${weapon.weaponStats ? `
                        <h3>STATS</h3>
                        <p><strong>Fire Rate:</strong> ${weapon.weaponStats.fireRate}</p>
                        <p><strong>Magazine Size:</strong> ${weapon.weaponStats.magazineSize}</p>
                        <p><strong>Run Speed:</strong> ${weapon.weaponStats.runSpeedMultiplier}</p>
                        
                        <h4 style="margin-top: 1rem;">DAMAGE (0-30m)</h4>
                        <p><strong>Head:</strong> ${weapon.weaponStats.damageRanges[0].headDamage}</p>
                        <p><strong>Body:</strong> ${weapon.weaponStats.damageRanges[0].bodyDamage}</p>
                        <p><strong>Leg:</strong> ${weapon.weaponStats.damageRanges[0].legDamage}</p>
                    ` : '<p>No stats available for this weapon.</p>'}
                </div>
            </div>
        </div>
        `;
}

function renderWeaponsPage(weapons) {
    return `
        <div class="container">
            <div class="page-header">
                <h1>WEAPONS</h1>
            </div>
            <div class="grid" id="weapons-grid">
                ${weapons.map(weapon => renderWeaponCard(weapon)).join('')}
            </div>
        </div>
        `;
}

// MAPS
function renderMapCard(map) {
    return `
        <div class="card map-card" data-uuid="${map.uuid}" style="cursor: pointer;">
            <img src="${map.splash}" alt="${map.displayName}" style=" object-fit: cover;">
                <h3>${map.displayName}</h3>
                <p>${map.coordinates || 'Unknown Coordinates'}</p>
            </div>
    `;
}

function renderMapDetail(map) {
    return `
        <div class="modal-detail" style="
            background-image: linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 100%), url('${map.splash}');
            background-size: cover;
            background-position: center;
        ">
            <!-- Splash is now background -->
            <div class="detail-info">
                <h2>${map.displayName}</h2>
                <div class="role-badge">COORDINATES: ${map.coordinates || 'N/A'}</div>
                
                ${map.tacticalDescription ? `<p style="color: var(--ui-red); margin-bottom: 0.5rem; font-family: var(--font-dot);">${map.tacticalDescription}</p>` : ''}
                
                <p style="margin-bottom: 1.5rem;">${map.narrativeDescription || 'Tactical map layout.'}</p>
                
                ${map.displayIcon ? `
                <div style="margin-top: auto; text-align: center;">
                    <img src="${map.displayIcon}" alt="Minimap for ${map.displayName}" style="width: 80%; opacity: 0.8; filter: invert(1);">
                </div>
                ` : ''}
            </div>
        </div>
    `;
}

function renderMapsPage(maps) {
    return `
        <div class="container">
            <div class="page-header">
                <h1>MAPS</h1>
            </div>
            <div class="grid" id="maps-grid">
                ${maps.map(map => renderMapCard(map)).join('')}
            </div>
        </div>
        `;
}

// CARDS (Collection)
function renderPlayerCard(card) {
    // Improved Grid Item: Square Icon only
    return `
        <div class="card card-icon" data-uuid="${card.uuid}" style="padding: 0; border: none; background: transparent; cursor: pointer;">
            <img src="${card.displayIcon}" alt="${card.displayName}" style="width: 100%; aspect-ratio: 1/1; object-fit: cover; margin: 0; border-radius: 4px; border: 1px solid var(--ui-gray-200);">
        </div>
    `;
}

function renderCardDetail(card) {
    // Modal Content for Card
    // Inline styles removed in favor of CSS classes for responsiveness
    return `
        <div class="modal-detail card-detail-view">
            <div class="detail-info card-detail-info">
                <h2 class="card-detail-title">${card.displayName}</h2>
                <div class="role-badge">PLAYER CARD</div>
            </div>
            <div class="detail-img card-detail-img-container">
                <img src="${card.largeArt}" alt="${card.displayName}" class="card-detail-img">
            </div>
        </div>
    `;
}

function renderCardsPage(cards) {
    return `
        <div class="container">
            <div class="page-header">
                <h1>PLAYER CARDS</h1>
            </div>
            <div class="grid" style="grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 0.5rem;">
                ${cards.slice(0, 300).map(card => renderPlayerCard(card)).join('')}  
            </div>
            <div style="text-align: center; margin-top: 2rem; color: var(--ui-gray-500); font-family: var(--font-dot);">
                SHOWING 300 / ${cards.length} CARDS
            </div>
        </div>
        `;
}

function attachCardClick(cards) {
    const cardElements = document.querySelectorAll('.card-icon');
    cardElements.forEach(el => {
        el.addEventListener('click', () => {
            const uuid = el.dataset.uuid;
            const card = cards.find(c => c.uuid === uuid);
            if (card) {
                openModal(renderCardDetail(card));
            }
        });
    });
}

// RANKS
function renderRank(tier) {
    return `
        <div class="card" style="text-align: center;">
            <img src="${tier.largeIcon}" alt="${tier.tierName}" style="width: 80px; margin: 0 auto; display: block;">
                <h3 style="font-size: 1rem; margin-top: 1rem;">${tier.tierName}</h3>
            </div>
    `;
}

function renderRanksPage(ranks) {
    return `
        <div class="container">
            <div class="page-header">
                <h1>COMPETITIVE RANKS</h1>
            </div>
            <div class="grid" style="grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));">
                ${ranks.map(rank => renderRank(rank)).join('')}
            </div>
        </div>
        `;
}

// NEW CATEGORIES
function renderBuddiesPage(buddies) {
    return `
        <div class="container">
            <div class="page-header">
                <h1>GUN BUDDIES</h1>
            </div>
            <div class="grid" style="grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));">
                ${buddies.slice(0, 200).map(buddy => `
                    <div class="card" style="text-align: center;">
                        <img src="${buddy.displayIcon}" alt="${buddy.displayName}" style="width: 80px; margin: 0 auto; display: block;">
                        <h3 style="font-size: 0.9rem; margin-top: 1rem;">${buddy.displayName}</h3>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderSpraysPage(sprays) {
    return `
        <div class="container">
            <div class="page-header">
                <h1>SPRAYS</h1>
            </div>
            <div class="grid" style="grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));">
                ${sprays.slice(0, 200).map(spray => `
                    <div class="card" style="text-align: center;">
                        <img src="${spray.displayIcon}" alt="${spray.displayName}" style="opacity: 0.9;">
                        <h3 style="font-size: 0.9rem; margin-top: 0.5rem;">${spray.displayName}</h3>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderTitlesPage(titles) {
    return `
        <div class="container">
            <div class="page-header">
                <h1>PLAYER TITLES</h1>
            </div>
            <div class="grid" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
                ${titles.slice(0, 300).map(title => `
                    <div class="card" style="padding: 1rem; text-align: center;">
                        <h3 style="font-size: 1rem; color: var(--ui-white); margin: 0;">${title.titleText}</h3>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderCurrencyPage(currencies) {
    return `
        <div class="container">
            <div class="page-header">
                <h1>CURRENCY</h1>
            </div>
            <div class="grid" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));">
                ${currencies.map(curr => `
                    <div class="card" style="text-align: center;">
                        <img src="${curr.displayIcon}" alt="${curr.displayName}" style="width: 64px; margin: 0 auto;">
                        <h3 style="margin-top: 1rem;">${curr.displayName}</h3>
                        <p>${curr.description || ''}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderSeasonsPage(seasons) {
    // Attempt to group by Episode/Act if possible
    const episodes = seasons.filter(s => s.type === "EAresSeasonType::Episode");
    const acts = seasons.filter(s => s.type === "EAresSeasonType::Act");

    // Fallback if types assume different values or generic list
    if (episodes.length === 0) {
        const sorted = [...seasons].reverse();
        return `
            <div class="container">
                <div class="page-header">
                    <h1>SEASONS & ACTS</h1>
                </div>
                <div class="grid" style="grid-template-columns: 1fr;">
                    ${sorted.map(s => `
                        <div class="card" style="display: flex; align-items: center; gap: 2rem;">
                             <div style="flex-shrink: 0;">
                                <h2 style="color: var(--ui-red); margin-bottom: 0;">${s.displayName}</h2>
                                <span style="color: var(--ui-gray-500); font-family: var(--font-dot);">${s.seasonUuid || 'Details'}</span>
                             </div>
                             <div>
                                <p>Start: ${s.startTime ? new Date(s.startTime).toLocaleDateString() : 'N/A'}</p>
                                <p>End: ${s.endTime ? new Date(s.endTime).toLocaleDateString() : 'N/A'}</p>
                             </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Sort Episodes Newest -> Oldest
    episodes.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

    return `
        <div class="container">
            <div class="page-header">
                <h1>SEASONS & ACTS</h1>
            </div>
            ${episodes.map(episode => {
        const episodeActs = acts.filter(act => act.parentUuid === episode.uuid);
        episodeActs.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

        return `
                <div class="episode-section" style="margin-bottom: 4rem;">
                    <div class="episode-header" style="border-bottom: 1px dashed var(--ui-red); margin-bottom: 2rem; padding-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: flex-end;">
                        <h2 style="font-size: 2.5rem; margin: 0; color: var(--ui-white);">${episode.displayName}</h2>
                        <span style="color: var(--ui-gray-500); font-family: var(--font-dot); text-align: right;">
                            ${new Date(episode.startTime).toLocaleDateString()} — ${new Date(episode.endTime).toLocaleDateString()}
                        </span>
                    </div>
                    <div class="grid" style="grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));">
                        ${episodeActs.length > 0 ? episodeActs.map(act => `
                            <div class="card" style="border: 1px solid var(--ui-gray-200);">
                                <h3 style="color: var(--ui-red); margin-bottom: 0.5rem;">${act.displayName}</h3>
                                <p style="color: var(--ui-gray-500); font-size: 0.9rem; margin-bottom: 0;">
                                    ${new Date(act.startTime).toLocaleDateString()} — ${new Date(act.endTime).toLocaleDateString()}
                                </p>
                            </div>
                        `).join('') : '<p style="color: var(--ui-gray-500);">No Acts found.</p>'}
                    </div>
                </div>
                `;
    }).join('')}
        </div>
    `;
}

// ABOUT
function renderAboutPage() {
    return `
        <div class="container">
            <div class="page-header">
                <h1>ABOUT SYSTEM</h1>
            </div>
            <div class="card" style="padding: 2rem; max-width: 800px; margin: 0 auto; text-align: center;">
                <h2 style="color: var(--ui-red); font-size: 2rem; margin-bottom: 1rem;">VALORANT WIKI</h2>
                <div style="font-family: var(--font-dot); margin-bottom: 2rem;">
                    <p>PROTOCOL_781-A // ACCESSING CLASSIFIED DATA</p>
                    <p>STATUS: ONLINE</p>
                </div>
                
                <p style="margin-bottom: 2rem; font-size: 1.2rem; color: var(--ui-white);">
                    This page is designed by <span style="color: var(--ui-red);">SRIHARI</span>
                </p>
                <p style="margin-bottom: 2rem;">
                    Designed with a retro-analog aesthetic inspired by tactical operating systems.
                </p>
                
                <div style="padding: 1rem; border: 1px dashed var(--ui-gray-500); display: inline-block;">
                    <p style="color: var(--ui-gray-500); font-size: 0.8rem; margin: 0;">
                        DISCLAIMER: This project is not affiliated with Riot Games.<br>
                        Valorant and all related assets are trademarks of Riot Games, Inc.
                    </p>
                </div>
            </div>
        </div>
    `;
}

// ===== Routing / Navigation Logic =====
async function navigateTo(page) {
    showLoader();
    setActiveNav(page);
    window.scrollTo(0, 0);

    // Clear Content
    app.innerHTML = '';

    try {
        switch (page) {
            case 'home':
                            const agentsHome = await getAgents();
                            app.innerHTML = renderHomePage(agentsHome);
                            break;
            case 'agents':
                const agents = await getAgents();
                app.innerHTML = renderAgentsPage(agents);
                attachAgentClick(agents);
                break;
            case 'weapons':
                const weapons = await getWeapons();
                app.innerHTML = renderWeaponsPage(weapons);
                attachWeaponClick(weapons);
                break;
            case 'maps':
                const maps = await getMaps();
                app.innerHTML = renderMapsPage(maps);
                attachMapClick(maps);
                break;
            case 'cards':
                const cards = await getPlayerCards();
                app.innerHTML = renderCardsPage(cards);
                attachCardClick(cards);
                break;
            case 'ranks':
                const ranks = await getRanks();
                app.innerHTML = renderRanksPage(ranks);
                break;

            // New Categories
            case 'buddies':
                const buddies = await getBuddies();
                app.innerHTML = renderBuddiesPage(buddies);
                break;
            case 'sprays':
                const sprays = await getSprays();
                app.innerHTML = renderSpraysPage(sprays);
                break;
            case 'titles':
                const titles = await getTitles();
                app.innerHTML = renderTitlesPage(titles);
                break;
            case 'currency':
                const currencies = await getCurrencies();
                app.innerHTML = renderCurrencyPage(currencies);
                break;
            case 'seasons':
                const seasons = await getSeasons();
                app.innerHTML = renderSeasonsPage(seasons);
                break;
            case 'about':
                app.innerHTML = renderAboutPage();
                break;

            case 'collection':
                // Default to cards for collection
                navigateTo('cards');
                return;
            default:
                navigateTo('home');
                return;
        }
    } catch (e) {
        console.error("Navigation Error", e);
        app.innerHTML = '<div class="container"><h1>ERROR LOADING CONTENT</h1></div>';
    } finally {
        // Re-attach listeners for new dynamic content
        attachEventListeners(page);
        hideLoader();
    }
}

function attachEventListeners(page) {
    // Navigate buttons
    document.querySelectorAll('.cta-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const p = e.currentTarget.dataset.page;
            if (p) {
                navigateTo(p);
                window.history.pushState({}, '', `#${p}`);
            }
        });
    });

    // Agent Filter
    if (page === 'agents') {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const role = btn.dataset.role;
                const agents = await getAgents();
                const filtered = role === 'all' ? agents : agents.filter(a => a.role?.displayName === role);

                document.getElementById('agents-grid').innerHTML = filtered.map(a => renderAgentCard(a)).join('');
                attachAgentClick(agents);
            });
        });
    }

    // Home Page Agent Clicks + Aim Trainer + Category Cards
        if (page === 'home') {
            getAgents().then(agents => attachAgentClick(agents));

            // Category card navigation
            document.querySelectorAll('.category-card').forEach(card => {
                card.addEventListener('click', () => {
                    const p = card.dataset.page;
                    if (p) {
                        navigateTo(p);
                        window.history.pushState({}, '', `#${p}`);
                    }
                });
            });

            // Aim trainer play button
            const playBtn = document.getElementById('play-aim-trainer-btn');
            if (playBtn) {
                playBtn.addEventListener('click', () => {
                    const section = document.querySelector('.aim-trainer-section');
                    if (!section) return;
                    // Replace preview with game container
                    section.innerHTML = `
                        <div class="feature-header">
                            <h3 class="glitch-text" data-text="AIM TRAINER">AIM TRAINER</h3>
                            <div class="feature-line"></div>
                        </div>
                        <div id="game-container-root" class="game-container"></div>
                        <div style="text-align: center; margin-top: 1rem;">
                            <button class="cta-btn" id="exit-aim-trainer-btn" style="font-size: 0.8rem;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="vertical-align:middle;margin-right:4px"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>EXIT TRAINER</button>
                        </div>
                    `;
                    // Initialize the game now that container exists
                    RetroGame.init();

                    // Exit button
                    const exitBtn = document.getElementById('exit-aim-trainer-btn');
                    if (exitBtn) {
                        exitBtn.addEventListener('click', () => {
                            RetroGame.running = false;
                            // Re-render home page to restore the preview
                            navigateTo('home');
                        });
                    }
                });
            }
        }

        // Mobile dropdown toggle (tap-friendly)
        document.querySelectorAll('.nav-dropdown > a').forEach(dropdownToggle => {
            dropdownToggle.addEventListener('click', (e) => {
                e.preventDefault();
                const parent = dropdownToggle.parentElement;
                // Close other dropdowns
                document.querySelectorAll('.nav-dropdown.open').forEach(other => {
                    if (other !== parent) other.classList.remove('open');
                });
                parent.classList.toggle('open');
            });
        });
    }

function attachWeaponClick(weapons) {
    const selector = '.weapon-card';
    document.querySelectorAll(selector).forEach(card => {
        card.addEventListener('click', () => {
            const uuid = card.dataset.uuid;
            const weapon = weapons.find(w => w.uuid === uuid);
            if (weapon) {
                openModal(renderWeaponDetail(weapon));
            }
        });
    });
}


function attachMapClick(maps) {
    const selector = '.map-card';
    document.querySelectorAll(selector).forEach(card => {
        card.addEventListener('click', () => {
            const uuid = card.dataset.uuid;
            const map = maps.find(m => m.uuid === uuid);
            if (map) {
                openModal(renderMapDetail(map), 'map-modal');
            }
        });
    });
}


function attachAgentClick(agents) {
    const selector = '.agent-card, .new-agent-card';
    document.querySelectorAll(selector).forEach(card => {
        card.addEventListener('click', () => {
            const uuid = card.dataset.uuid;
            const agent = agents.find(a => a.uuid === uuid);
            if (agent) {
                openModal(renderAgentDetail(agent));
            }
        });
    });
}

// Global Event Listeners
if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
        navContainer.classList.toggle('active');
    });
}

document.querySelector('.modal-close').addEventListener('click', () => {
    modal.classList.remove('active');
    document.querySelector('.modal-content').classList.remove('map-modal');
    document.body.style.overflow = 'auto';
});

// Logo click to go home
document.querySelector('.logo')?.addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo('home');
    window.history.pushState({}, '', '#home');
    if (window.innerWidth < 900) navContainer.classList.remove('active');
});

// Close dropdown when clicking outside (add once)
document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-dropdown')) {
        document.querySelectorAll('.nav-dropdown.open').forEach(d => {
            d.classList.remove('open');
        });
    }
});

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        // If it's a dropdown parent, don't navigate unless it has data-page
        if (page && page !== 'collection') {
            navigateTo(page);
            window.history.pushState({}, '', `#${page}`);
            if (window.innerWidth < 900) navContainer.classList.remove('active');
        }
    });
});

// Init
window.addEventListener('popstate', () => {
    const page = window.location.hash.replace('#', '') || 'home';
    navigateTo(page);
});

// Start
const startPage = window.location.hash.replace('#', '') || 'home';
navigateTo(startPage);
