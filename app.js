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
function renderGameLanding(agents) {
    const jett = agents.find(a => a.displayName === 'Jett') || agents[0];
    const others = agents.filter(a => a.uuid !== jett.uuid).slice(0, 6); // Show top 6

    return `
        <div class="landing-container">
            <section class="landing-hero">
                <div class="hero-bg-text glitch-text" data-text="VALORANT">VALORANT</div>
                
                <div class="bg-deco-text top-left">PROTOCOL_781-A</div>
                <div class="bg-deco-text bottom-right">SYSTEM_READY</div>
                <div class="bg-deco-text vertical-scroll">01 00 11 01 01</div>
                
                <div class="floating-shape shape-1"></div>
                <div class="floating-shape shape-2"></div>
                
                <div class="jett-container">
                    <img src="${jett.fullPortrait}" alt="${jett.displayName}" class="jett-image">
                </div>
            </section>

            <section class="landing-feature">
                <div class="feature-header">
                    <h3 class="glitch-text" data-text="AGENTS">AGENTS</h3>
                    <div class="feature-line"></div>
                </div>
                
                <div class="new-agents-grid">
                    ${others.map(agent => `
                        <div class="new-agent-card cta-btn" data-uuid="${agent.uuid}" tabindex="0" role="button" aria-label="View details for ${agent.displayName}">
                            <div class="ag-img">
                                <img src="${agent.displayIcon}" alt="${agent.displayName}">
                            </div>
                            <span>${agent.displayName}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="landing-actions" style="text-align: center;">
                     <button class="cta-btn primary" data-page="agents">ROSTER</button>
                </div>
            </section>

            <!-- EXPLORE ALL CATEGORIES -->
            <section class="landing-feature" style="margin-top: 4rem;">
                <div class="feature-header">
                    <h3 class="glitch-text" data-text="DATABASE">DATABASE</h3>
                    <div class="feature-line"></div>
                </div>
                
                <div class="grid" style="grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1rem;">
                    <div class="card" style="text-align: center; cursor: pointer; border-radius: 50px;" onclick="navigateTo('maps')">
                        <h3 style="margin: 0; padding: 0.5rem; color: var(--ui-white); font-size: 1rem;">MAPS</h3>
                    </div>
                    <div class="card" style="text-align: center; cursor: pointer; border-radius: 50px;" onclick="navigateTo('weapons')">
                        <h3 style="margin: 0; padding: 0.5rem; color: var(--ui-white); font-size: 1rem;">WEAPONS</h3>
                    </div>
                    <div class="card" style="text-align: center; cursor: pointer; border-radius: 50px;" onclick="navigateTo('cards')">
                        <h3 style="margin: 0; padding: 0.5rem; color: var(--ui-white); font-size: 1rem;">CARDS</h3>
                    </div>
                    <div class="card" style="text-align: center; cursor: pointer; border-radius: 50px;" onclick="navigateTo('buddies')">
                        <h3 style="margin: 0; padding: 0.5rem; color: var(--ui-white); font-size: 1rem;">BUDDIES</h3>
                    </div>
                    <div class="card" style="text-align: center; cursor: pointer; border-radius: 50px;" onclick="navigateTo('sprays')">
                        <h3 style="margin: 0; padding: 0.5rem; color: var(--ui-white); font-size: 1rem;">SPRAYS</h3>
                    </div>
                    <div class="card" style="text-align: center; cursor: pointer; border-radius: 50px;" onclick="navigateTo('titles')">
                        <h3 style="margin: 0; padding: 0.5rem; color: var(--ui-white); font-size: 1rem;">TITLES</h3>
                    </div>
                    <div class="card" style="text-align: center; cursor: pointer; border-radius: 50px;" onclick="navigateTo('currency')">
                        <h3 style="margin: 0; padding: 0.5rem; color: var(--ui-white); font-size: 1rem;">CURRENCY</h3>
                    </div>
                    <div class="card" style="text-align: center; cursor: pointer; border-radius: 50px;" onclick="navigateTo('seasons')">
                        <h3 style="margin: 0; padding: 0.5rem; color: var(--ui-white); font-size: 1rem;">SEASONS</h3>
                    </div>
                    <div class="card" style="text-align: center; cursor: pointer; border-radius: 50px;" onclick="navigateTo('ranks')">
                        <h3 style="margin: 0; padding: 0.5rem; color: var(--ui-white); font-size: 1rem;">RANKS</h3>
                    </div>
                    <div class="card" style="text-align: center; cursor: pointer; border-radius: 50px;" onclick="navigateTo('about')">
                        <h3 style="margin: 0; padding: 0.5rem; color: var(--ui-white); font-size: 1rem;">ABOUT</h3>
                    </div>
                </div>
            </section>
        </div>
    `;
}

// AGENTS
function renderAgentCard(agent) {
    return `
        <div class="card agent-card" data-uuid="${agent.uuid}" style="cursor: pointer;" tabindex="0" role="button" aria-label="View details for ${agent.displayName}">
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
        <div class="card weapon-card" data-uuid="${weapon.uuid}" style="cursor: pointer;" tabindex="0" role="button" aria-label="View details for ${weapon.displayName}">
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
        </div >
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
        <div class="card map-card" data-uuid="${map.uuid}" style="cursor: pointer;" tabindex="0" role="button" aria-label="View details for ${map.displayName}">
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
    return `
        <div class="card">
            <img src="${card.largeArt}" alt="${card.displayName}">
                <h3>${card.displayName}</h3>
            </div>
    `;
}

function renderCardsPage(cards) {
    return `
        <div class="container">
            <div class="page-header">
                <h1>PLAYER CARDS</h1>
            </div>
            <div class="grid" style="grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));">
                ${cards.slice(0, 200).map(card => renderPlayerCard(card)).join('')} 
                <!-- Limit to 200 for performance -->
            </div>
        </div>
        `;
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
                app.innerHTML = renderGameLanding(agentsHome);
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
                window.history.pushState({}, '', `#${p} `);
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

    // Home Page Agent Clicks
    if (page === 'home') {
        getAgents().then(agents => attachAgentClick(agents));
    }
}

function attachWeaponClick(weapons) {
    const selector = '.weapon-card';
    document.querySelectorAll(selector).forEach(card => {
        const handler = () => {
            const uuid = card.dataset.uuid;
            const weapon = weapons.find(w => w.uuid === uuid);
            if (weapon) {
                modalContent.innerHTML = renderWeaponDetail(weapon);
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        };
        card.addEventListener('click', handler);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handler();
            }
        });
    });
}


function attachMapClick(maps) {
    const selector = '.map-card';
    document.querySelectorAll(selector).forEach(card => {
        const handler = () => {
            const uuid = card.dataset.uuid;
            const map = maps.find(m => m.uuid === uuid);
            if (map) {
                const content = document.querySelector('.modal-content');
                content.classList.add('map-modal');
                modalContent.innerHTML = renderMapDetail(map);
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        };
        card.addEventListener('click', handler);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handler();
            }
        });
    });
}


function attachAgentClick(agents) {
    const selector = '.agent-card, .new-agent-card';
    document.querySelectorAll(selector).forEach(card => {
        const handler = () => {
            const uuid = card.dataset.uuid;
            const agent = agents.find(a => a.uuid === uuid);
            if (agent) {
                // Remove map modal class if present (cleanup)
                document.querySelector('.modal-content').classList.remove('map-modal');
                modalContent.innerHTML = renderAgentDetail(agent);
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        };
        card.addEventListener('click', handler);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handler();
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

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        // If it's a dropdown parent, don't navigate unless it has data-page
        if (page && page !== 'collection') {
            navigateTo(page);
            window.history.pushState({}, '', `#${page} `);
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
