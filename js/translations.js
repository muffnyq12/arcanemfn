const translations = {
    tr: {
        hero_title: "RETRO ARCADE HUB",
        hero_main: "Sınırları Zorla, Rekorları Alt Üst Et!",
        hero_sub: "Retro Arcade Hub ile nostaljik oyunların büyüsüne kapıl, rakiplerini geride bırak.",
        start_btn: "ŞİMDİ OYNAMAYA BAŞLA 🕹️",
        home: "Ana Sayfa",
        about: "Hakkımızda",
        search_placeholder: "Oyun ara...",
        loading_system: "Sistem Yükleniyor...",
        loading_game: "Oyun Yükleniyor...",
        please_wait: "Lütfen bekleyin...",
        daily_reward: "Giriş Ödülü:",
        claim: "AL",
        weekly_fav: "Haftanın Favorisi",
        popular_games: "Diğer Popüler Oyunlar",
        neon_market: "🛒 Neon Market",
        market_desc: "Oyunlardan kazandığın Tokenlar ile deneyimini güçlendir.",
        newsletter_title: "🚀 Yeni Oyunları Kaçırma!",
        newsletter_sub: "Haftalık en iyi oyunları e-postana gönderelim.",
        subscribe: "Abone Ol",
        score: "SKOR",
        level: "SEVİYE",
        lines: "SATIR",
        target: "HEDEF",
        game_over: "OYUN BİTTİ",
        paused: "DURAKLATILDI",
        next: "SIRADAKİ",
        rotate_warning: "LÜTFEN EKRANI YAN ÇEVİRİN",
        rotate_warning_portrait: "LÜTFEN EKRANI DİK TUTUN",
        rotate_warning_sub: "Bu oyun en iyi deneyim için yatay modda çalışır.",
        magic_swap: "DEĞİŞTİR",
        high_score: "EN YÜKSEK SKOR",
        how_to_play: "🕹️ Nasıl Oynanır?",
        daily_quests: "🎯 Günün Görevleri",
        related_games: "🔥 Benzer Oyunlar",
        restart: "🔄 Yeniden Başlat"
    },
    en: {
        hero_title: "RETRO ARCADE HUB",
        hero_main: "Push the Limits, Break the Records!",
        hero_sub: "Experience the magic of nostalgic games and outperform your rivals.",
        start_btn: "START PLAYING NOW 🕹️",
        home: "Home",
        about: "About Us",
        search_placeholder: "Search games...",
        loading_system: "System Loading...",
        loading_game: "Game Loading...",
        please_wait: "Please wait...",
        daily_reward: "Login Reward:",
        claim: "GET",
        weekly_fav: "Favorite of the Week",
        popular_games: "Other Popular Games",
        neon_market: "🛒 Neon Market",
        market_desc: "Enhance your experience with the tokens you earn from games.",
        newsletter_title: "🚀 Don't Miss New Games!",
        newsletter_sub: "We'll send the best weekly games to your email.",
        subscribe: "Subscribe",
        score: "SCORE",
        level: "LEVEL",
        lines: "LINES",
        target: "TARGET",
        game_over: "GAME OVER",
        paused: "PAUSED",
        next: "NEXT",
        rotate_warning: "PLEASE ROTATE TO LANDSCAPE",
        rotate_warning_portrait: "PLEASE ROTATE TO PORTRAIT",
        rotate_warning_sub: "This game works best in landscape mode.",
        magic_swap: "MAGIC SWAP",
        high_score: "HIGH SCORE",
        how_to_play: "🕹️ How to Play?",
        daily_quests: "🎯 Daily Quests",
        related_games: "🔥 Related Games",
        restart: "🔄 Restart"
    },
    id: {
        hero_title: "RETRO ARCADE HUB",
        hero_main: "Melampaui Batas, Pecahkan Rekor!",
        hero_sub: "Rasakan keajaiban game nostalgia dan kalahkan rival Anda.",
        start_btn: "MULAI BERMAIN SEKARANG 🕹️",
        home: "Beranda",
        about: "Tentang Kami",
        search_placeholder: "Cari game...",
        loading_system: "Sistem Memuat...",
        loading_game: "Memuat Game...",
        please_wait: "Harap tunggu...",
        daily_reward: "Hadiah Login:",
        claim: "AMBIL",
        weekly_fav: "Favorit Minggu Ini",
        popular_games: "Game Populer Lainnya",
        neon_market: "🛒 Neon Market",
        market_desc: "Tingkatkan pengalaman Anda dengan token yang Anda peroleh.",
        newsletter_title: "🚀 Jangan Lewatkan Game Baru!",
        newsletter_sub: "Kami akan mengirimkan game mingguan terbaik ke email Anda.",
        subscribe: "Berlangganan",
        score: "SKOR",
        level: "LEVEL",
        lines: "BARIS",
        target: "TARGET",
        game_over: "PERMAINAN BERAKHIR",
        paused: "BERHENTI SEJENAK",
        next: "BERIKUTNYA",
        rotate_warning: "HARAP PUTAR LAYAR",
        rotate_warning_portrait: "HARAP POSISI POTRET",
        rotate_warning_sub: "Game ini paling baik dimainkan dalam mode lanskap.",
        magic_swap: "TUKAR AJAIB",
        high_score: "SKOR TERTINGGI",
        how_to_play: "🕹️ Cara Bermain?",
        daily_quests: "🎯 Quest Harian",
        related_games: "🔥 Game Terkait",
        restart: "🔄 Mulai Ulang"
    }
};

function getLanguage() {
    const saved = localStorage.getItem('hub_lang');
    if (saved) return saved;
    const browserLang = navigator.language.split('-')[0];
    return translations[browserLang] ? browserLang : 'en';
}

function updateUILanguage() {
    const lang = getLanguage();
    const t = translations[lang];

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = t[key];
            } else {
                el.innerText = t[key];
            }
        }
    });
}

window.i18n = {
    get: (key) => translations[getLanguage()][key] || key,
    update: updateUILanguage,
    setLanguage: (lang) => {
        localStorage.setItem('hub_lang', lang);
        updateUILanguage();
        window.location.reload();
    }
};

document.addEventListener('DOMContentLoaded', updateUILanguage);
