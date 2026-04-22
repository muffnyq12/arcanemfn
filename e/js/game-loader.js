// FIREBASE CONFIGURATION (LIVE CLOUD)
const firebaseConfig = {
    apiKey: "AIzaSyB9NUH_4ThZJ1tJlmD0vF6HTMcpBsf3UCA",
    authDomain: "game-d6bf6.firebaseapp.com",
    databaseURL: "https://game-d6bf6-default-rtdb.firebaseio.com",
    projectId: "game-d6bf6",
    storageBucket: "game-d6bf6.firebasestorage.app",
    messagingSenderId: "458695680686",
    appId: "1:458695680686:web:459e8d3d101ddcfbe8033f",
    measurementId: "G-BLRLYYFYND"
};

// Import Firebase SDKs (CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// CLOUD SYNC (Real-Time Admin Control)
function syncWithCloud() {
    const configRef = ref(db, 'admin_config');
    
    // Real-time listener for any changes made in Admin Panel
    onValue(configRef, (snapshot) => {
        const config = snapshot.val();
        if (!config) {
            console.warn("Cloud config is empty. Using defaults.");
            return;
        }
        
        console.log("Cloud Config Updated:", config);

        // 1. Maintenance Mode Enforcement
        if (config.maintenanceMode && !window.location.href.includes('admin.html')) {
            document.body.innerHTML = `
                <div style="height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#0a0a0a; color:white; font-family:sans-serif; text-align:center; padding:20px; z-index:9999; position:fixed; top:0; left:0; width:100%;">
                    <h1 style="color:#ff0000; font-size:3rem; margin:0;">⛔ BAKIM MODU</h1>
                    <p style="font-size:1.2rem; color:#888; margin-top:10px;">Şu an sistem genelinde bir bakım çalışması var.<br>Lütfen daha sonra tekrar deneyiniz.</p>
                </div>
            `;
            return;
        }

        // 2. Global Event/Theme Sync
        if (config.event) {
            const themeClass = "theme-" + config.event;
            document.documentElement.className = themeClass;
            document.body.className = themeClass; // Double-safe
            localStorage.setItem('retroArcade_cachedTheme', config.event);
            console.info("🎨 Cloud Theme Applied:", config.event);
        }

        // 3. Live Announcement Sync
        const announcement = document.getElementById('announcement-bar');
        if (announcement) {
            if (config.announcementActive) {
                announcement.style.display = 'block';
                announcement.innerText = config.announcementText;
            } else {
                announcement.style.display = 'none';
            }
        }
        
        // 4. Update stats multiplier
        window.coinMultiplier = config.coinMultiplier || 1.0;
        
        // 5. Featured Game Sync
        if (config.featuredGame && config.featuredGame !== siteConfig.featuredGame) {
            siteConfig.featuredGame = config.featuredGame;
            if (document.getElementById('main-game-grid')) renderGames();
        }

        // 6. Leaderboard Sync Logic
        window.leaderboardActive = config.leaderboardActive !== false;
        const targetLeaderboard = config.leaderboardGame || config.featuredGame;

        if (!window.leaderboardActive) {
            // IF DISABLED: Show message and STOP everything else
            renderLeaderboard({}, null, true);
        } else {
            // IF ENABLED: Setup sync and render
            if (targetLeaderboard && targetLeaderboard !== window.currentLeaderboardGame) {
                window.currentLeaderboardGame = targetLeaderboard;
                setupLeaderboardSync(targetLeaderboard);
            } else if (window.lastLeaderboardData) {
                renderLeaderboard(window.lastLeaderboardData, window.currentLeaderboardGame);
            }
        }
        
    }, (error) => {
        console.error("Firebase Sync Error:", error);
    });
}

// Start Cloud Monitoring
syncWithCloud();

const gamesData = {
    'slots-pro': { 
        title: 'Slots Beach: Tropical Pro', 
        subtitle: 'Güneş, Kum ve Büyük İkramiye', 
        instructions: '<ul><li><b>GO Butonu:</b> Çarkları döndürmek için sağ alttaki sarı GO butonuna bas</li><li><b>Görev:</b> Tropikal sembolleri (Ahtapot, Çapa, Deniz Kabuğu) eşleştirerek sahilin en zengini ol!</li></ul>', 
        file: 'js/games/slots-pro.js', 
        desc: 'Tropikal bir adada, palmiye ağaçları altında şansını dene. Slots Beach dünyasında ahtapotlar ve yengeçler sana büyük ikramiyeyi getirecek!', 
        tag: 'ŞANS' 
    },
    'jewels-pro': { 
        title: 'Jewels Master: Match 3', 
        subtitle: 'Mücevher Eşleştirme Efsanesi', 
        instructions: '<ul><li><b>Fare / Dokunmatik:</b> Mücevherleri seç ve yanındakilerle yer değiştir</li><li><b>Görev:</b> 3 veya daha fazla aynı mücevheri yan yana getirerek patlat, süre dolmadan en yüksek skora ulaş!</li></ul>', 
        file: 'js/games/jewels-pro.js', 
        desc: 'Klasik Match-3 deneyimi, neon parıltılı mücevherler ve profesyonel arcade tasarımıyla geri döndü. Kombolar yap, ekranı sars ve liderlik tablosunu fethet!', 
        tag: 'PRO PUZZLE' 
    },
    'tetris-pro': { 
        title: 'Tetris Pro: Neon Edition', 
        subtitle: 'Profesyonel Blok Stratejisi', 
        instructions: '<ul><li><b>Klavye:</b> Ok Tuşları (Hareket/Döndür), Space (Sert Düşüş), Shift/C (Sakla)</li><li><b>Mobil:</b> Ekran altındaki dokunmatik butonları kullan</li><li><b>Görev:</b> Satırları tamamlayarak temizle, ghost piece yardımıyla stratejini kur ve en yüksek seviyeye ulaş!</li></ul>', 
        file: 'js/games/tetris-pro.js', 
        desc: 'Klasik Tetris deneyimi, neon estetiği ve pro özelliklerle yeniden doğdu. Ghost piece, saklama sistemi ve dinamik zorluk seviyeleriyle gerçek bir arcade efsanesi.', 
        tag: 'PRO PUZZLE' 
    },
    'asteroid-pro': { 
        title: 'Asteroids: Neon Strike', 
        subtitle: 'Pro Vektörel Uzay Savaşı', 
        instructions: '<ul><li><b>Yön Tuşları:</b> Gemiyi döndür ve ilerle</li><li><b>Boşluk (Space):</b> Neon mermileri ateşle</li><li><b>Görev:</b> Asteroidleri parçala ve hayatta kal!</li></ul>', 
        file: 'js/games/asteroid-pro.js', 
        desc: 'Derin uzayın karanlığında neon ışıkları altında amansız bir mücadele. Parçala, yok et ve liderlik tablosuna adını yazdır!', 
        tag: 'PRO ARCADE' 
    }
};

// QUEST POOL
const questPool = [
    { id: 'play_time_short', type: 'time', goal: 60, desc: 'Toplam 60 saniye oyun oyna.', reward: 50 },
    { id: 'play_time_long', type: 'time', goal: 180, desc: 'Toplam 180 saniye oyun oyna.', reward: 150 },
    { id: 'game_starts', type: 'starts', goal: 3, desc: '3 farklı oyun başlat.', reward: 75 },
    { id: 'stay_active', type: 'active', goal: 300, desc: 'Sitede 5 dakika (300 sn) vakit geçir.', reward: 100 },
    { id: 'marathon', type: 'time', goal: 600, desc: 'Gerçek bir maratoncu gibi 10 dk oyna!', reward: 500 }
];

let siteConfig = {
    event: 'normal',
    featuredGame: 'slots-pro',
    coinName: 'Token',
    coinMultiplier: 1.0,
    maintenanceMode: false,
    announcementText: '',
    announcementActive: false,
    disabledGames: [],
    quest: { id: 'play-time', goal: 120, reward: 100 }
};

let userStats = {
    xp: 0, level: 1, tokens: 0, lastReward: null, inventory: [],
    activeQuests: [], // Now an array of 2 quests
    lastQuestDate: null
};

function loadAll() {
    const savedConfig = localStorage.getItem('retroArcade_config');
    if (savedConfig) siteConfig = JSON.parse(savedConfig);

    if (siteConfig.maintenanceMode && !window.location.pathname.includes('admin.html')) {
        showMaintenanceScreen();
        return;
    }

    applyTheme(siteConfig.event);
    setupAnnouncement();

    const savedStats = localStorage.getItem('retroArcade_stats');
    if (savedStats) {
        userStats = JSON.parse(savedStats);
        if (!userStats.inventory) userStats.inventory = [];
        if (!userStats.activeQuests) userStats.activeQuests = [];
    }
    
    checkDailyQuestReset();
    updateUI();
    applyInventoryEffects();
    
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('game');
    
    if (gameId && (siteConfig.disabledGames || []).includes(gameId)) {
        alert('Bu oyun şu an bakımdadır. Ana sayfaya yönlendiriliyorsunuz.');
        window.location.href = 'index.html';
        return;
    }

    if (document.getElementById('main-game-grid')) renderGames();
}

function checkDailyQuestReset() {
    const today = new Date().toDateString();
    if (userStats.lastQuestDate !== today) {
        userStats.lastQuestDate = today;
        
        // Pick 2 random unique quests from pool
        const shuffled = [...questPool].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 2);
        
        userStats.activeQuests = selected.map(q => ({
            ...q,
            progress: 0,
            claimed: false
        }));
        
        saveStats();
    }
}

function setupAnnouncement() {
    const bar = document.getElementById('announcement-bar');
    const textEl = document.getElementById('announcement-text');
    if (bar && textEl) {
        if (siteConfig.announcementActive && siteConfig.announcementText) {
            textEl.innerText = siteConfig.announcementText;
            bar.style.display = 'block';
        } else {
            bar.style.display = 'none';
        }
    }
}

function showMaintenanceScreen() {
    document.body.innerHTML = `
        <div style="height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #050505; color: white; text-align: center; font-family: 'Inter', sans-serif;">
            <h1 style="font-size: 3rem; color: #ff0000; margin-bottom: 1rem;">⛔ SİSTEM BAKIMDA</h1>
            <p style="color: #888; font-size: 1.2rem;">Daha iyi bir deneyim için şu an çalışıyoruz.<br>Lütfen kısa süre sonra tekrar deneyin.</p>
            <div style="margin-top: 2rem; padding: 10px 20px; border: 1px solid #ff0000; color: #ff0000; border-radius: 8px;">RETRO ARCADE HUB</div>
        </div>
    `;
}

function applyTheme(event) {
    document.body.className = "theme-" + event;
    applyEventTheme();
}

function applyEventTheme() {
    const root = document.documentElement;
    root.style.removeProperty('--neon-blue');
    root.style.removeProperty('--neon-purple');
    switch(siteConfig.event) {
        case 'halloween':
            root.style.setProperty('--neon-blue', '#ff6600');
            root.style.setProperty('--neon-purple', '#9900ff');
            break;
        case 'easter':
            root.style.setProperty('--neon-blue', '#57ffde');
            root.style.setProperty('--neon-purple', '#ffb3ff');
            break;
        case 'christmas':
            root.style.setProperty('--neon-blue', '#ff0000');
            root.style.setProperty('--neon-purple', '#00ff44');
            break;
        default: break;
    }
}

function renderGames() {
    const grid = document.getElementById('main-game-grid');
    const featuredCard = document.querySelector('.featured-card');
    if (!grid) return;
    grid.innerHTML = '';

    const fGame = gamesData[siteConfig.featuredGame];
    const isFeaturedActive = !(siteConfig.disabledGames || []).includes(siteConfig.featuredGame);

    if (fGame && featuredCard && isFeaturedActive) {
        featuredCard.style.display = 'flex';
        featuredCard.style.cursor = 'pointer';
        featuredCard.setAttribute('onclick', `loadGame('${siteConfig.featuredGame}')`);
        featuredCard.querySelector('img').src = `assets/${siteConfig.featuredGame}.webp`;
        featuredCard.querySelector('h2').innerText = fGame.title;
        featuredCard.querySelector('p').innerText = fGame.desc;
    } else if (featuredCard) {
        featuredCard.style.display = 'none';
    }

    Object.keys(gamesData).forEach(id => {
        if ((siteConfig.disabledGames || []).includes(id)) return;
        const g = gamesData[id];
        const card = document.createElement('div');
        card.className = 'game-card';
        card.style.cursor = 'pointer';
        card.setAttribute('onclick', `loadGame('${id}')`);
        card.innerHTML = `
            <img src="assets/${id}.webp" alt="${g.title}" loading="lazy">
            <div class="game-info">
                <span class="game-tag">${g.tag}</span>
                <h3>${g.title}</h3>
                <p>${g.subtitle}</p>
            </div>
        `;
        grid.appendChild(card);
    });
}

// ANALYTICS TRACKER
function trackPlay(gameId) {
    const saved = localStorage.getItem('retroArcade_analytics');
    const analytics = saved ? JSON.parse(saved) : { plays: {}, time: {} };
    analytics.plays[gameId] = (analytics.plays[gameId] || 0) + 1;
    localStorage.setItem('retroArcade_analytics', JSON.stringify(analytics));
    
    // QUEST PROGRESS: Starts
    userStats.activeQuests.forEach(q => {
        if (q.type === 'starts' && q.progress < q.goal) q.progress++;
    });
    saveStats();
}

function trackTime(gameId) {
    const saved = localStorage.getItem('retroArcade_analytics');
    const analytics = saved ? JSON.parse(saved) : { plays: {}, time: {} };
    analytics.time[gameId] = (analytics.time[gameId] || 0) + 1;
    localStorage.setItem('retroArcade_analytics', JSON.stringify(analytics));
}

function saveStats() {
    localStorage.setItem('retroArcade_stats', JSON.stringify(userStats));
    updateUI();
}

function applyInventoryEffects() {
    if (userStats.inventory.includes('theme-pink')) {
        document.documentElement.style.setProperty('--neon-blue', '#ff00ff');
        document.documentElement.style.setProperty('--neon-purple', '#ff0077');
    }
}

function updateUI() {
    const xpFills = document.querySelectorAll('.xp-bar-fill');
    const levelLabels = document.querySelectorAll('.level-label');
    const tokenDisplays = document.querySelectorAll('.tokens');
    const rewardBtn = document.querySelector('.reward-btn');
    const xpHint = document.getElementById('xp-hint');
    const progress = (userStats.xp % 100);
    xpFills.forEach(el => el.style.width = progress + '%');
    levelLabels.forEach(el => el.innerText = `LVL ${userStats.level}`);
    tokenDisplays.forEach(el => el.innerText = `🪙 ${userStats.tokens} ${siteConfig.coinName}`);
    if (xpHint) xpHint.style.display = (progress > 80) ? 'block' : 'none';

    if (rewardBtn) {
        const today = new Date().toDateString();
        if (userStats.lastReward === today) {
            rewardBtn.innerText = 'ALINDI! ✅';
            rewardBtn.disabled = true;
            rewardBtn.style.background = '#222';
        }
    }

    // MULTI-QUEST UI
    const questList = document.getElementById('quest-list');
    if (questList) {
        questList.innerHTML = '';
        userStats.activeQuests.forEach((q, idx) => {
            const qProgress = (q.progress / q.goal) * 100;
            const isDone = q.progress >= q.goal;
            const questItem = document.createElement('div');
            questItem.className = 'quest-item-mini';
            questItem.style.marginBottom = '15px';
            questItem.innerHTML = `
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 5px;">
                    <span>${q.desc}</span>
                    <span style="color: var(--neon-blue); font-weight: bold;">${Math.min(q.progress, q.goal)}/${q.goal}</span>
                </div>
                <div class="quest-progress-container">
                    <div class="quest-bar-fill" style="width: ${Math.min(qProgress, 100)}%; height: 6px; background: var(--neon-blue); box-shadow: 0 0 10px var(--neon-blue); border-radius: 3px; transition: 0.3s;"></div>
                </div>
                ${isDone && !q.claimed ? `<button onclick="claimQuest(${idx})" class="buy-btn" style="margin-top: 8px; width: 100%; padding: 5px; font-size: 0.7rem;">${q.reward} ${siteConfig.coinName} AL 🪙</button>` : ''}
                ${q.claimed ? `<div style="color: var(--neon-green); font-size: 0.7rem; margin-top: 5px; text-align: center; font-weight: bold;">TAMAMLANDI ✅</div>` : ''}
            `;
            questList.appendChild(questItem);
        });
    }

    const marketItems = document.querySelectorAll('.market-item');
    marketItems.forEach(item => {
        const id = item.getAttribute('data-id');
        const price = parseInt(item.getAttribute('data-price'));
        const btn = item.querySelector('.buy-btn');
        if (userStats.inventory.includes(id)) {
            btn.innerText = 'SAHİPSİN ✅';
            btn.disabled = true;
        } else {
            btn.innerText = `${price} ${siteConfig.coinName}`;
            btn.disabled = (userStats.tokens < price);
            btn.style.opacity = (userStats.tokens < price) ? '0.5' : '1';
        }
    });
}

// GLOBAL CLAIM FUNCTION
window.claimQuest = (idx) => {
    const q = userStats.activeQuests[idx];
    if (q.progress >= q.goal && !q.claimed) {
        userStats.tokens += q.reward * siteConfig.coinMultiplier;
        q.claimed = true;
        saveStats();
        alert(`Tebrikler! ${q.reward} ${siteConfig.coinName} kazandın! 🎉`);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    loadAll();

    // GLOBAL 24H RESET TIMER (Next 00:00)
    setInterval(() => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setHours(24, 0, 0, 0);
        const diff = tomorrow - now;
        
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        
        const timerEl = document.getElementById('quest-reset-timer');
        if (timerEl) timerEl.innerText = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        
        // EVENT TIMER
        const eventTimer = document.getElementById('event-timer');
        if (eventTimer) eventTimer.innerText = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }, 1000);

    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('game');
    const game = gamesData[gameId];
    if (game && document.getElementById('game-canvas-container')) {
        document.getElementById('game-title').innerText = game.title;
        document.getElementById('game-subtitle').innerText = game.subtitle;
        document.getElementById('instructions-content').innerHTML = game.instructions;
        loadGame(game.file);
        loadRelated(gameId);
        
        setInterval(() => {
            if (!window.isPaused && window.gameStarted) {
                trackTime(gameId);
                
                // XP LOGIC
                const day = new Date().getDay();
                const isWeekend = (day === 6 || day === 0);
                let multiplier = userStats.inventory.includes('xp-booster') ? 3 : 1;
                if (isWeekend) multiplier *= 2;
                multiplier *= siteConfig.coinMultiplier;
                userStats.xp += 1 * multiplier;
                if (userStats.xp >= userStats.level * 100) userStats.level++;
                
                // QUEST PROGRESS: Time
                userStats.activeQuests.forEach(q => {
                    if (q.type === 'time' && q.progress < q.goal) q.progress++;
                });

                saveStats();
            }
        }, 1000);

        // QUEST PROGRESS: Active on site
        setInterval(() => {
            userStats.activeQuests.forEach(q => {
                if (q.type === 'active' && q.progress < q.goal) q.progress++;
            });
            saveStats();
        }, 1000);
    }

    window.isPaused = false;
    window.gameStarted = false;
    const startBtn = document.getElementById('start-game-btn');
    const playOverlay = document.getElementById('play-overlay');
    const pauseBtn = document.getElementById('pause-game-btn');
    if (startBtn) {
        startBtn.addEventListener('click', async () => {
            window.gameStarted = true;
            
            // LANDSCAPE LOCK FOR MOBILE
            if (window.innerWidth <= 768) {
                try {
                    if (screen.orientation && screen.orientation.lock) {
                        await screen.orientation.lock('landscape');
                    }
                } catch (e) { console.log("Orientation lock not supported or failed."); }
                
                checkOrientation(); // İlk kontrol
            }

            playOverlay.style.opacity = '0';
            setTimeout(() => playOverlay.style.display = 'none', 500);
            pauseBtn.style.display = 'block';
            if (gameId) trackPlay(gameId);
        });
    }

    // ORIENTATION TRACKER
    function checkOrientation() {
        if (!window.gameStarted || window.innerWidth > 768) return;
        
        const rotateOverlay = document.getElementById('rotate-overlay');
        if (!rotateOverlay) return;

        if (window.innerHeight > window.innerWidth) {
            // PORTRAIT MODE - SHOW OVERLAY
            rotateOverlay.style.display = 'flex';
        } else {
            // LANDSCAPE MODE - HIDE OVERLAY
            rotateOverlay.style.display = 'none';
        }
    }

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    // MOBILE STICKY HEADER SHRINK
    const navbar = document.querySelector('nav');
    window.addEventListener('scroll', () => {
        if (window.innerWidth <= 768) {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    });
    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            window.isPaused = !window.isPaused;
            pauseBtn.innerText = window.isPaused ? 'DEVAM ET' : 'DURDUR';
        });
    }

    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.game-card, .featured-card');
            cards.forEach(card => {
                const title = card.querySelector('h2, h3')?.innerText.toLowerCase() || "";
                card.style.display = title.includes(term) ? (card.classList.contains('featured-card') ? 'flex' : 'block') : 'none';
            });
        });
    }

    const rewardBtn = document.querySelector('.reward-btn');
    if (rewardBtn) {
        rewardBtn.addEventListener('click', () => {
            const today = new Date().toDateString();
            if (userStats.lastReward !== today) {
                userStats.tokens += 50 * siteConfig.coinMultiplier;
                userStats.lastReward = today;
                saveStats();
            }
        });
    }
});

function loadGame(scriptPath) {
    const container = document.getElementById('game-canvas-container');
    if (!container) return;
    
    // 1. CLEAR PREVIOUS GAME (Canvas & Script)
    container.innerHTML = '';
    const oldScript = document.getElementById('game-script');
    if (oldScript) oldScript.remove();
    
    // 2. CREATE NEW CANVAS
    const canvas = document.createElement('canvas');
    canvas.id = 'gameCanvas';
    
    // Force dimensions based on visible container
    canvas.width = container.offsetWidth || 800; 
    canvas.height = container.offsetHeight || 600;
    
    container.appendChild(canvas);
    
    // 3. LOAD NEW SCRIPT
    const script = document.createElement('script');
    script.id = 'game-script';
    script.src = scriptPath + "?v=" + Date.now();
    document.body.appendChild(script);
}

function loadRelated(currentGameId) {
    const relatedList = document.getElementById('related-list');
    if (!relatedList) return;
    Object.keys(gamesData).forEach(id => {
        if (id !== currentGameId && !(siteConfig.disabledGames || []).includes(id)) {
            const g = gamesData[id];
            const item = document.createElement('div');
            item.className = 'game-card';
            item.style.cursor = 'pointer';
            item.setAttribute('onclick', `loadGame('${id}')`);
            item.innerHTML = `
                <div style="display: flex; align-items: center; padding: 10px; gap: 15px;">
                    <img src="assets/${id}.webp" style="width: 60px; height: 45px; border-radius: 6px; object-fit: cover;" loading="lazy">
                    <div style="font-size: 0.8rem;">
                        <h4 style="margin: 0;">${g.title}</h4>
                        <p style="font-size: 0.6rem; color: var(--text-dim); margin: 0;">${g.subtitle}</p>
                    </div>
                </div>
            `;
            relatedList.appendChild(item);
        }
    });
}

// GLOBAL LEADERBOARD LOGIC (Cloud Driven)
let currentFeaturedGame = 'space-shooter';

function setupLeaderboardSync(featuredId) {
    const leaderboardRef = ref(db, `leaderboards/${featuredId}`);
    onValue(leaderboardRef, (snapshot) => {
        window.lastLeaderboardData = snapshot.val() || {};
        if (window.leaderboardActive) {
            renderLeaderboard(window.lastLeaderboardData, featuredId);
        }
    });
}

function renderLeaderboard(scores, gameId, isDisabled = false) {
    const lists = [document.getElementById('leaderboard-list'), document.getElementById('leaderboard-list-mobile')];
    const titles = [document.getElementById('leaderboard-title-pc'), document.getElementById('leaderboard-title-mobile')];
    
    if (isDisabled) {
        titles.forEach(t => { if(t) t.innerHTML = `🏆 LİDERLİK TABLOSU`; });
        const disabledHtml = `
            <div style="text-align:center; padding:30px 20px; color:var(--text-dim); font-size:0.8rem; border:1px dashed #333; border-radius:12px; background:rgba(255,255,255,0.02); margin: 10px 0;">
                <div style="font-size:1.5rem; margin-bottom:10px;">⚠️</div>
                Şu an kullanılamıyor.
            </div>
        `;
        lists.forEach(l => { if(l) l.innerHTML = disabledHtml; });
        return;
    }

    const gameTitle = gamesData[gameId]?.title || "Günün Oyunu";
    titles.forEach(t => {
        if (!t) return;
        if (t.id === 'leaderboard-title-mobile') {
            t.innerHTML = `🏆 ${gameTitle.toUpperCase()} <span class="toggle-icon">▼</span>`;
        } else {
            t.innerHTML = `🏆 ${gameTitle.toUpperCase()}`;
        }
    });

    const sortedScores = Object.entries(scores)
        .map(([name, score]) => ({ name, score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);

    const html = sortedScores.length > 0 
        ? sortedScores.map((entry, index) => `
            <div class="leader-item">
                <span>${index + 1}. ${entry.name}</span>
                <strong>${entry.score.toLocaleString()}</strong>
            </div>
        `).join('')
        : '<div style="text-align:center; padding:10px; color:#666; font-size:0.7rem;">Henüz rekor kırılmadı!</div>';

    lists.forEach(l => { if(l) l.innerHTML = html; });
}

// NICKNAME SYSTEM
function checkUserNickname() {
    const savedName = localStorage.getItem('retroArcade_username');
    const modal = document.getElementById('nickname-modal');
    
    // If no nickname, show modal on ANY page where it exists
    if (!savedName && modal) {
        modal.style.display = 'flex';
    }
}

window.saveNickname = function() {
    const input = document.getElementById('user-nickname-input');
    const name = input.value.trim();
    
    if (name.length >= 2) {
        localStorage.setItem('retroArcade_username', name);
        document.getElementById('nickname-modal').style.display = 'none';
        console.log("Nickname saved:", name);
    } else {
        alert("Lütfen en az 2 karakterlik bir isim gir kral!");
    }
};

// Update Global Save Score Function to use real name
window.saveUserScore = function(score) {
    const username = localStorage.getItem('retroArcade_username');
    const targetGame = window.currentLeaderboardGame;
    
    console.log("Saving Score:", { username, targetGame, score });

    if (!username) {
        alert("Hata: Nickname bulunamadı! Lütfen sayfayı yenileyip isim seç.");
        return;
    }
    if (!targetGame) {
        alert("Hata: Hangi oyuna skor kaydedileceği buluttan alınamadı! Admin panelinden bir 'Leaderboard Oyunu' seçip kaydedin.");
        return;
    }
    
    const scoreRef = ref(db, `leaderboards/${targetGame}/${username}`);
    
    set(scoreRef, score)
        .then(() => {
            console.log("Skor BAŞARIYLA kaydedildi!");
        })
        .catch((err) => {
            alert("Firebase Kayıt Hatası: " + err.message);
        });
};

// Initial Checks
document.addEventListener('DOMContentLoaded', () => {
    checkUserNickname();
    syncWithCloud(); // Ensure cloud is started
    
    // Auto-hide Splash Screen after 2 seconds
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.style.opacity = '0';
            splash.style.visibility = 'hidden';
            
            // WAIT ANOTHER 2 SECONDS AFTER SPLASH IS GONE TO UNLOCK SCROLL
            setTimeout(() => {
                document.documentElement.style.setProperty('overflow', 'auto', 'important');
                document.body.style.setProperty('overflow', 'auto', 'important');
                console.log("🔓 Scroll Unlocked (2 seconds after splash)");
            }, 2000); 
        }
    }, 2000);
});

// Update loadGame to show splash before leaving
window.loadGame = function(gameId) {
    const splash = document.getElementById('splash-screen');
    if (splash) {
        splash.style.visibility = 'visible';
        splash.style.opacity = '1';
        splash.querySelector('p').innerText = "OYUN HAZIRLANIYOR...";
        
        // LOCK SCROLL (Preventing jitters during transition)
        document.documentElement.style.setProperty('overflow', 'hidden', 'important');
        document.body.style.setProperty('overflow', 'hidden', 'important');
    }
    
    setTimeout(() => {
        window.location.href = `game.html?game=${gameId}`;
    }, 1000); // Wait 1 second before redirect
};
