import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cluster from 'cluster';
import os from 'os';
import { ANIME, META } from '@consumet/extensions';

// Compatibility for older Node versions
// LOAD BALANCER: Only use Cluster in Local, disable in Vercel (Serverless)
const isPrimary = cluster.isPrimary || cluster.isMaster;
const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL;

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

    app.use((err, req, res, next) => {
        console.error(`[ERROR] ${err.message}`);
        res.status(500).json({ error: 'An unexpected error occurred.' });
    });

    app.listen(PORT, () => {
        console.log(`👷 Worker ${process.pid} is handling requests on port ${PORT}`);
    });
}
