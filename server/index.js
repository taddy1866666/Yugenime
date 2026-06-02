import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'crypto';
import cluster from 'cluster';
import os from 'os';
import fs from 'fs';
import path from 'path';
import webpush from 'web-push';
import { ANIME, META } from '@consumet/extensions';

// Compatibility for older Node versions
// LOAD BALANCER: Only use Cluster in Local, disable in Vercel (Serverless)
const isPrimary = cluster.isPrimary || cluster.isMaster;
const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL;

const VAPID_FILE = path.join(process.cwd(), 'vapid.json');
let vapidKeys;

if (fs.existsSync(VAPID_FILE)) {
    vapidKeys = JSON.parse(fs.readFileSync(VAPID_FILE, 'utf-8'));
} else {
    vapidKeys = webpush.generateVAPIDKeys();
    fs.writeFileSync(VAPID_FILE, JSON.stringify(vapidKeys, null, 2), 'utf-8');
}

webpush.setVapidDetails(
    'mailto:admin@yugenime.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

const SUBS_FILE = path.join(process.cwd(), 'subscriptions.json');

const loadSubscriptions = () => {
    if (fs.existsSync(SUBS_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(SUBS_FILE, 'utf-8'));
        } catch (e) {
            return [];
        }
    }
    return [];
};

const saveSubscriptions = (subs) => {
    try {
        fs.writeFileSync(SUBS_FILE, JSON.stringify(subs, null, 2), 'utf-8');
    } catch (e) {
        console.error('Failed to save subscriptions:', e);
    }
};

// Track scheduled notifications to avoid duplicates
const scheduledNotifications = new Map();

const scheduleNotificationForRelease = (mediaId, airingAt, anime, sub) => {
    const scheduleKey = `${mediaId}-${sub.subscription.endpoint}`;
    
    // Avoid scheduling the same notification twice
    if (scheduledNotifications.has(scheduleKey)) {
        return;
    }

    const now = Date.now();
    const airingTime = airingAt * 1000; // Convert to milliseconds
    const delayMs = airingTime - now;

    // If episode is in the past or too close to now (within 5 seconds), send immediately
    if (delayMs <= 5000) {
        sendPushNotification(mediaId, anime, sub, scheduledNotifications, scheduleKey);
        return;
    }

    // Schedule notification for 60 seconds after release (to ensure episode is available)
    const scheduledTime = airingTime + 60000;
    const timeoutMs = scheduledTime - now;

    console.log(`[Push Scheduler] Scheduled notification for anime ${mediaId} (${anime.title.english || anime.title.romaji}) Episode ${anime.nextAiringEpisode.episode} at ${new Date(airingTime).toLocaleString()} (in ${Math.round(delayMs / 1000)} seconds)`);

    const timeoutId = setTimeout(() => {
        sendPushNotification(mediaId, anime, sub, scheduledNotifications, scheduleKey);
    }, timeoutMs);

    scheduledNotifications.set(scheduleKey, timeoutId);
};

const sendPushNotification = async (mediaId, anime, sub, scheduledMap, scheduleKey) => {
    try {
        const latestEpNum = anime.nextAiringEpisode.episode;
        const animeTitle = anime.title.english || anime.title.romaji;
        const payload = JSON.stringify({
            title: '🎬 New Episode Release!',
            body: `"${animeTitle}" Episode ${latestEpNum} is now available.`,
            icon: anime.coverImage.extraLarge || '/favicon.svg',
            url: `/?openAnimeId=${mediaId}`
        });

        await webpush.sendNotification(sub.subscription, payload);
        console.log(`[Push Sent] ${animeTitle} Ep ${latestEpNum} → ${sub.subscription.endpoint.substring(0, 50)}...`);

        // Update lastNotified in subscription
        const subs = loadSubscriptions();
        const updatedSub = subs.find(s => s.subscription.endpoint === sub.subscription.endpoint);
        if (updatedSub) {
            const watchItem = updatedSub.watchlist.find(w => w.id === mediaId);
            if (watchItem) {
                watchItem.lastNotified = latestEpNum;
                saveSubscriptions(subs);
            }
        }

        // Clean up scheduled notification tracker
        scheduledMap.delete(scheduleKey);
    } catch (err) {
        console.error(`[Push Error] Failed to send notification:`, err.message);
        if (err.statusCode === 410 || err.statusCode === 404) {
            // Remove dead subscription
            const subs = loadSubscriptions();
            const filtered = subs.filter(s => s.subscription.endpoint !== sub.subscription.endpoint);
            saveSubscriptions(filtered);
            console.log(`[Push] Removed dead subscription`);
        }
        scheduledMap.delete(scheduleKey);
    }
};

const checkServerReleases = async () => {
    console.log('[Push Server] Checking for upcoming anime releases...');
    const subs = loadSubscriptions();
    if (subs.length === 0) return;

    const allIds = new Set();
    subs.forEach(sub => {
        (sub.watchlist || []).forEach(item => {
            allIds.add(item.id);
        });
    });

    if (allIds.size === 0) return;

    const idsArray = Array.from(allIds);
    const query = `
      query ($ids: [Int]) {
        Page (perPage: 50) {
          media (id_in: $ids) {
            id
            title {
              english
              romaji
            }
            coverImage {
              extraLarge
            }
            status
            episodes
            nextAiringEpisode {
              airingAt
              episode
            }
          }
        }
      }
    `;

    try {
        const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables: { ids: idsArray } })
        });
        const result = await response.json();
        const mediaList = result.data?.Page?.media || [];

        if (mediaList.length === 0) return;

        for (const media of mediaList) {
            const mediaId = media.id;
            
            // For upcoming episodes: use nextAiringEpisode.airingAt
            if (media.nextAiringEpisode && media.nextAiringEpisode.airingAt) {
                for (const sub of subs) {
                    const watchItem = (sub.watchlist || []).find(w => w.id === mediaId);
                    if (!watchItem) continue;

                    const watched = watchItem.episode || 0;
                    const nextEpisode = media.nextAiringEpisode.episode;

                    // Schedule if there's an unwatched upcoming episode
                    if (nextEpisode > watched) {
                        scheduleNotificationForRelease(mediaId, media.nextAiringEpisode.airingAt, media, sub);
                    }
                }
            }
            // For finished anime: check if we have unreleased episodes
            else if (media.status === 'FINISHED') {
                const latestEpAvailable = media.episodes || 0;
                for (const sub of subs) {
                    const watchItem = (sub.watchlist || []).find(w => w.id === mediaId);
                    if (!watchItem) continue;

                    const watched = watchItem.episode || 0;
                    const lastNotified = watchItem.lastNotified || 0;

                    if (latestEpAvailable > watched && latestEpAvailable > lastNotified) {
                        sendPushNotification(mediaId, media, sub, scheduledNotifications, `${mediaId}-${sub.subscription.endpoint}`);
                    }
                }
            }
        }
    } catch (e) {
        console.error('[Push Checker] Failed check:', e.message);
    }
};

// LOAD BALANCER: Only use Cluster in Local, disable in Vercel (Serverless)
if (isPrimary && !isVercel) {
    const numCPUs = os.cpus().length;
    console.log(`🚀 Primary process ${process.pid} is running`);
    console.log(`⚡ Spawning ${numCPUs} workers for Load Balancing...`);

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`⚠️ Worker ${worker.process.pid} died. Restarting...`);
        cluster.fork();
    });

    // Start push checker in primary process
    setTimeout(checkServerReleases, 5000);
    setInterval(checkServerReleases, 5 * 60 * 1000);
    console.log('🔔 [Push Server] Release notification scheduler started');
} else {
    const app = express();
    const PORT = process.env.PORT || 3000;

    // LOGGING: Track all requests in terminal
    app.use(morgan('dev'));

    // SECURITY: Enhanced Helmet configuration
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'", 'https://graphql.anilist.co', 'https://api.jikan.moe'],
                frameSrc: ['https://www.youtube.com', 'https://vidlink.pro', 'https://vidsrc.xyz', 'https://vidsrc.me', 'https://animepahe.pw'],
                mediaSrc: ["'self'", 'https:', 'blob:'],
            },
        },
        crossOriginEmbedderPolicy: false, // Required for external video embeds
        crossOriginResourcePolicy: { policy: 'cross-origin' }
    }));

    // SECURITY: Restrict CORS to trusted origins
    const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://yugenime.vercel.app',
        process.env.FRONTEND_URL
    ].filter(Boolean);

    app.use(cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, Postman, etc.)
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST'],
        credentials: true
    }));
    
    app.use(cookieParser());
    app.use(express.json());

    // RATE LIMIT: Protect API from abuse
    const globalLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100, 
        message: { error: 'Too many requests, please try again later.' },
        standardHeaders: true,
        legacyHeaders: false,
    });

    const searchLimiter = rateLimit({
        windowMs: 10 * 60 * 1000,
        max: 20,
        message: { error: 'Search limit reached. Please wait.' },
    });

    app.use(globalLimiter);

    // CACHING: In-memory storage for performance
    const cache = new Map();
    const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

    const getFromCache = (key) => {
        const cached = cache.get(key);
        if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) return cached.data;
        if (cached) cache.delete(key); // Cleanup expired
        return null;
    };

    const setToCache = (key, data) => {
        if (cache.size > 500) cache.clear(); 
        cache.set(key, { data, timestamp: Date.now() });
    };

    // Providers (Keeping only the stable ones)
    const anilist = new META.Anilist();
    const hianime = new ANIME.Hianime();
    const pahe = new ANIME.AnimePahe();

    const providers = { anilist, hianime, pahe };

    const cleanTitle = (title) => {
        if (!title) return "";
        return title.split(':')[0].split(' - ')[0].replace(/Season \d+/gi, '').trim();
    };

    // INPUT SANITIZATION HELPER
    const sanitize = (text) => {
        if (typeof text !== 'string') return '';
        return text.replace(/[^\w\s\-\:\.\!\?]/gi, '').substring(0, 100).trim();
    };
    // API Router setup to match frontend expectations
    const apiRouter = express.Router();
    app.use('/api', apiRouter);

    // CSRF Protection Middleware
    const csrfProtection = (req, res, next) => {
        // Skip CSRF for GET requests and cron jobs
        if (req.method === 'GET' || req.path === '/push-check-releases') {
            return next();
        }
        
        const token = req.headers['x-csrf-token'];
        const cookieToken = req.cookies['csrf-token'];
        
        if (!token || !cookieToken || token !== cookieToken) {
            return res.status(403).json({ error: 'Invalid CSRF token' });
        }
        next();
    };

    // CSRF token endpoint
    apiRouter.get('/csrf-token', (req, res) => {
        const token = randomUUID();
        res.cookie('csrf-token', token, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 3600000 // 1 hour
        });
        res.json({ csrfToken: token });
    });

    app.get('/', (req, res) => res.json({ status: 'online', worker: process.pid }));

    apiRouter.get('/search/:query', searchLimiter, async (req, res) => {
        const query = sanitize(req.params.query);
        if (!query) return res.status(400).json({ error: 'Invalid query' });

        const cached = getFromCache(`search-${query}`);
        if (cached) return res.json(cached);

        const variations = [query, cleanTitle(query)].filter((v, i, a) => a.indexOf(v) === i);
        const pList = [hianime, pahe];

        for (const v of variations) {
            for (const p of pList) {
                try {
                    const results = await p.search(v);
                    if (results?.results?.length > 0) {
                        const data = { ...results, provider: 'direct' };
                        setToCache(`search-${query}`, data);
                        return res.json(data);
                    }
                } catch (e) { /* silent fail */ }
            }
        }

        try {
            const results = await anilist.search(query);
            if (results?.results?.length > 0) {
                const data = { ...results, provider: 'anilist' };
                setToCache(`search-${query}`, data);
                return res.json(data);
            }
        } catch (e) { }

        res.status(404).json({ error: 'No results' });
    });

    apiRouter.get('/info/:id', async (req, res) => {
        const id = sanitize(req.params.id);
        const providerId = sanitize(req.query.provider) || 'anilist';
        const cacheKey = `info-${id}-${providerId}`;
        
        const cached = getFromCache(cacheKey);
        if (cached) return res.json(cached);

        try {
            const p = providers[providerId] || hianime;
            const info = await p.fetchAnimeInfo(id);
            if (!info) return res.status(404).json({ error: 'Not found' });
            setToCache(cacheKey, info);
            res.json(info);
        } catch (e) {
            res.status(500).json({ error: 'Error fetching info' });
        }
    });

    apiRouter.get('/watch/:episodeId', async (req, res) => {
        const episodeId = sanitize(req.params.episodeId);
        const providerId = sanitize(req.query.provider) || 'anilist';
        try {
            const p = providers[providerId] || hianime;
            const sources = await p.fetchEpisodeSources(episodeId);
            res.json(sources);
        } catch (e) {
            res.status(500).json({ error: 'Error fetching sources' });
        }
    });

    // --- RESTORED ANIMEPAHE ENDPOINTS ---
    apiRouter.get('/pahe/search/:query', async (req, res) => {
        const query = sanitize(req.params.query);
        try {
            const results = await pahe.search(query);
            res.json(results);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    apiRouter.get('/pahe/info/:id', async (req, res) => {
        const id = sanitize(req.params.id);
        try {
            const info = await pahe.fetchAnimeInfo(id);
            res.json(info);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    apiRouter.get('/pahe/watch/:episodeId', async (req, res) => {
        const episodeId = sanitize(req.params.episodeId);
        try {
            const sources = await pahe.fetchEpisodeSources(episodeId);
            const formatted = {
                sources: (sources?.sources || []).map(s => ({
                    url: s.url,
                    quality: s.quality || 'auto',
                    header: s.header || {}
                })),
                subtitles: sources?.subtitles || [],
                download: sources?.download || null
            };
            res.json(formatted);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });
    // ------------------------------------

    // --- PUSH NOTIFICATION ENDPOINTS ---
    apiRouter.get('/push-public-key', (req, res) => {
        res.json({ publicKey: vapidKeys.publicKey });
    });

    apiRouter.post('/push-subscribe', csrfProtection, (req, res) => {
        const { subscription } = req.body;
        if (!subscription) return res.status(400).json({ error: 'Missing subscription' });

        const subs = loadSubscriptions();
        const existingIdx = subs.findIndex(s => s.subscription.endpoint === subscription.endpoint);
        if (existingIdx === -1) {
            subs.push({ subscription, watchlist: [] });
            saveSubscriptions(subs);
        }
        res.json({ success: true });
    });

    apiRouter.post('/push-update-watchlist', csrfProtection, (req, res) => {
        const { endpoint, watchlist } = req.body;
        if (!endpoint) return res.status(400).json({ error: 'Missing endpoint' });

        const subs = loadSubscriptions();
        const sub = subs.find(s => s.subscription.endpoint === endpoint);
        if (sub) {
            sub.watchlist = (watchlist || []).map(item => {
                const existingItem = sub.watchlist.find(w => w.id === item.id);
                return {
                    id: item.id,
                    episode: item.episode || 0,
                    lastNotified: existingItem ? (existingItem.lastNotified || 0) : (item.episode || 0)
                };
            });
            saveSubscriptions(subs);
            return res.json({ success: true });
        }
        res.status(404).json({ error: 'Subscription not found' });
    });

    // Manual trigger for notification check (for Vercel Cron)
    apiRouter.get('/push-check-releases', async (req, res) => {
        try {
            await checkServerReleases();
            res.json({ success: true, message: 'Release check completed' });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.use((err, req, res, next) => {
        console.error(`[ERROR] ${err.message}`);
        res.status(500).json({ error: 'An unexpected error occurred.' });
    });

    app.listen(PORT, () => {
        console.log(`👷 Worker ${process.pid} is handling requests on port ${PORT}`);
    });
}
