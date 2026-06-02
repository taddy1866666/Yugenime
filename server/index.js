import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
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

const checkServerReleases = async () => {
    console.log('[Push Server] Checking for new anime releases...');
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

        let subsUpdated = false;

        for (const media of mediaList) {
            const mediaId = media.id;
            let latestEpAvailable = 0;
            if (media.nextAiringEpisode) {
                latestEpAvailable = media.nextAiringEpisode.episode - 1;
            } else if (media.status === 'FINISHED') {
                latestEpAvailable = media.episodes || 0;
            }

            if (latestEpAvailable === 0) continue;

            for (const sub of subs) {
                const watchItem = (sub.watchlist || []).find(w => w.id === mediaId);
                if (!watchItem) continue;

                const watched = watchItem.episode || 0;
                const lastNotified = watchItem.lastNotified || 0;

                if (latestEpAvailable > watched && latestEpAvailable > lastNotified) {
                    const animeTitle = media.title.english || media.title.romaji;
                    const payload = JSON.stringify({
                        title: 'New Episode Release! 🎬',
                        body: `"${animeTitle}" Episode ${latestEpAvailable} is now available.`,
                        icon: media.coverImage.extraLarge || '/favicon.svg',
                        url: `/?openAnimeId=${mediaId}`
                    });

                    try {
                        await webpush.sendNotification(sub.subscription, payload);
                        console.log(`[Push Server] Sent notification for anime ${mediaId} Ep ${latestEpAvailable}`);
                    } catch (err) {
                        console.error(`[Push Server] Failed to send push notification:`, err.message);
                        if (err.statusCode === 410 || err.statusCode === 404) {
                            sub.remove = true;
                        }
                    }

                    watchItem.lastNotified = latestEpAvailable;
                    subsUpdated = true;
                }
            }
        }

        const validSubs = subs.filter(s => !s.remove);
        if (validSubs.length !== subs.length || subsUpdated) {
            saveSubscriptions(validSubs);
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
    setTimeout(checkServerReleases, 10000);
    setInterval(checkServerReleases, 10 * 60 * 1000);
} else {
    const app = express();
    const PORT = process.env.PORT || 3000;

    // LOGGING: Track all requests in terminal
    app.use(morgan('dev'));

    // SECURITY: Relaxed Helmet for streaming (Disabled CSP to allow external video sources)
    app.use(helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false
    }));

    // SECURITY: Permissive CORS for development and production
    app.use(cors({
        origin: '*', // Temporarily allow all to rule out CORS issues
        methods: ['GET', 'POST'],
        credentials: true
    }));
    
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

    apiRouter.post('/push-subscribe', (req, res) => {
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

    apiRouter.post('/push-update-watchlist', (req, res) => {
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

    app.use((err, req, res, next) => {
        console.error(`[ERROR] ${err.message}`);
        res.status(500).json({ error: 'An unexpected error occurred.' });
    });

    app.listen(PORT, () => {
        console.log(`👷 Worker ${process.pid} is handling requests on port ${PORT}`);
    });
}
