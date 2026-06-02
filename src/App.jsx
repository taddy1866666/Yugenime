import { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useToast } from './components/ToastProvider';
import DOMPurify from 'dompurify';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowUp, Play, Info, Star, Clock, Plus, Check, ListTodo, CheckCircle2, Bookmark } from 'lucide-react';
import { fetchAniList, consumetApi } from './utils/api';
import Button from './components/Button';

import Navbar from './components/Navbar';
import AccountView from './components/AccountView';
import Dropdown from './components/Dropdown';
import Home from './pages/Home';
import Genre from './pages/Genre';
import Search from './pages/Search';
import TopAnime from './pages/TopAnime';
import Footer from './components/Footer';
import VideoPlayer from './components/VideoPlayer';

import './App.css';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function App() {
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const [playingVideo, setPlayingVideo] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [consumetAnime, setConsumetAnime] = useState(null);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [videoSources, setVideoSources] = useState(null);
  const [activeProvider, setActiveProvider] = useState('hianime');

  // Initialize progress from localStorage
  const [userProgress, setUserProgress] = useState(() => {
    try {
      const saved = localStorage.getItem('yugenime_progress');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const navigate = useNavigate();

  const { addToast } = useToast();
  const [notifiedReleases, setNotifiedReleases] = useState(() => {
    try {
      const saved = localStorage.getItem('yugenime_notified_releases');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const notifiedReleasesRef = useRef(notifiedReleases);
  notifiedReleasesRef.current = notifiedReleases;

  const userProgressRef = useRef(userProgress);
  userProgressRef.current = userProgress;

  const handleOpenAnimeRef = useRef(null);
  const pushSetupInitiatedRef = useRef(false);

  useEffect(() => {
    const checkAnimeReleases = async () => {
      const watching = Object.values(userProgressRef.current)
        .filter(item => !item.status || item.status === 'watching');
      
      if (watching.length === 0) return;

      const ids = watching.map(item => item.id);
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
        const data = await fetchAniList(query, { ids });
        if (!data || data.length === 0) return;

        const currentNotified = { ...notifiedReleasesRef.current };
        let updatedAny = false;

        data.forEach((anime) => {
          const animeIdStr = String(anime.id);
          const progressItem = userProgressRef.current[animeIdStr];
          if (!progressItem) return;

          const watchedEp = progressItem.episode || 0;
          
          let latestEpAvailable = 0;
          if (anime.nextAiringEpisode) {
            latestEpAvailable = anime.nextAiringEpisode.episode - 1;
          } else if (anime.status === 'FINISHED') {
            latestEpAvailable = anime.episodes || 0;
          }

          if (latestEpAvailable === 0) return;

          const lastNotifiedEp = currentNotified[animeIdStr];

          if (lastNotifiedEp === undefined) {
            // First check for this anime: record current release state to avoid retrospective notifications
            currentNotified[animeIdStr] = latestEpAvailable;
            updatedAny = true;
          } else if (latestEpAvailable > watchedEp && latestEpAvailable > lastNotifiedEp) {
            // A new episode has released since the last check!
            const animeTitle = anime.title.english || anime.title.romaji;
            
            // Show anime card notification
            addToast(
              'New Episode Available!',
              'premium',
              10000,
              {
                title: animeTitle,
                episode: latestEpAvailable,
                coverImage: anime.coverImage?.extraLarge,
                genres: anime.genres,
                airingAt: null, // Already released
                onClick: () => {
                  if (handleOpenAnimeRef.current) {
                    handleOpenAnimeRef.current(anime);
                  }
                }
              }
            );

            currentNotified[animeIdStr] = latestEpAvailable;
            updatedAny = true;
          }
        });

        if (updatedAny) {
          setNotifiedReleases(currentNotified);
          localStorage.setItem('yugenime_notified_releases', JSON.stringify(currentNotified));
        }
      } catch (e) {
        console.error('[ReleaseCheck] Failed to check for releases:', e);
      }
    };

    // Run check immediately on mount/load
    const runCheck = () => {
      checkAnimeReleases();
    };

    const timeoutId = setTimeout(runCheck, 3000);

    // Set interval for every 15 minutes
    const intervalId = setInterval(runCheck, 15 * 60 * 1000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, []);

  // Save to localStorage whenever userProgress changes
  useEffect(() => {
    localStorage.setItem('yugenime_progress', JSON.stringify(userProgress));
  }, [userProgress]);

  const [pushSubscription, setPushSubscription] = useState(null);
  const [csrfToken, setCsrfToken] = useState(null);

  // Fetch CSRF token on mount
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const res = await fetch('/api/csrf-token', { credentials: 'include' });
        const data = await res.json();
        setCsrfToken(data.csrfToken);
      } catch (e) {
        console.error('[CSRF] Failed to fetch token:', e);
      }
    };
    fetchCsrfToken();
  }, []);

  // Sync watchlist with server when it changes or when subscribed
  useEffect(() => {
    const syncWatchlistWithServer = async () => {
      if (!pushSubscription || !csrfToken) return;
      const watching = Object.values(userProgress)
        .filter(item => !item.status || item.status === 'watching')
        .map(item => ({
          id: item.id,
          episode: item.episode || 0
        }));

      try {
        await fetch('/api/push-update-watchlist', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken
          },
          credentials: 'include',
          body: JSON.stringify({
            endpoint: pushSubscription.endpoint,
            watchlist: watching
          })
        });
      } catch (e) {
        console.error('[Push] Failed to sync watchlist with server:', e);
      }
    };

    syncWatchlistWithServer();
  }, [userProgress, pushSubscription, csrfToken]);

  // Service Worker and Push Notification subscription setup
  useEffect(() => {
    if (pushSetupInitiatedRef.current || !csrfToken) return;
    pushSetupInitiatedRef.current = true;

    if (!('serviceWorker' in navigator && 'PushManager' in window)) {
      console.warn('[Push] Browser does not support Service Workers or Push API');
      return;
    }

    const registerAndSubscribe = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        console.log('[ServiceWorker] Registered:', reg.scope);

        if (Notification.permission === 'denied') {
          console.warn('[Notification] Permission denied');
          return;
        }

        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            console.warn('[Notification] Permission not granted:', permission);
            return;
          }
        }

        const keyRes = await fetch('/api/push-public-key');
        if (!keyRes.ok) {
          const isDev = window.location.hostname === 'localhost';
          throw new Error(isDev 
            ? 'Server not running. Start backend with: cd server && npm start'
            : 'Push notification service unavailable. Please try again later.');
        }
        
        const { publicKey } = await keyRes.json();
        if (!publicKey) throw new Error('No VAPID public key returned');

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        });

        setPushSubscription(sub);

        const subRes = await fetch('/api/push-subscribe', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken
          },
          credentials: 'include',
          body: JSON.stringify({ subscription: sub })
        });

        if (!subRes.ok) throw new Error('Failed to register subscription');

        console.log('[Push] ✅ Setup complete');
        addToast('✅ Push notifications enabled!', 'success', 3000);
      } catch (err) {
        console.error('[Push] Setup failed:', err.message);
        const isDev = window.location.hostname === 'localhost';
        const message = isDev 
          ? '⚠️ Notifications disabled: Backend server not running'
          : '⚠️ Push notifications temporarily unavailable';
        addToast(message, 'warning', 5000);
      }
    };

    if (document.readyState === 'complete') {
      registerAndSubscribe();
    } else {
      window.addEventListener('load', registerAndSubscribe, { once: true });
    }
  }, [csrfToken]);

  // Check URL query parameters to open anime from background push notifications
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const openAnimeId = params.get('openAnimeId');
    if (openAnimeId) {
      handleOpenAnimeFromProgress({ id: parseInt(openAnimeId, 10) });
      navigate('/', { replace: true });
    }
  }, [location.search, navigate]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 500) setShowScrollTop(true);
      else setShowScrollTop(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    handleOpenAnimeRef.current = handleOpenAnime;
  }, [handleOpenAnime]);

  async function handleOpenAnime(anime) {
    // Standardize anime data for consistent rendering
    const standardizedAnime = {
      ...anime,
      title: typeof anime.title === 'string'
        ? { english: anime.title, romaji: anime.title }
        : anime.title
    };

    setSelectedAnime(standardizedAnime);
    setEpisodes([]);
    setIsLoadingEpisodes(true);
    setConsumetAnime(null);
    setVideoSources(null);
    setSelectedEpisode(null);

    // Set Video Trailer (AniList Primary)
    if (anime.trailer && anime.trailer.site === 'youtube') {
      setPlayingVideo(`https://www.youtube.com/embed/${anime.trailer.id}?autoplay=1`);
    } else {
      setPlayingVideo("");
    }

    try {
      // 1. Fetch Trailer Fallbacks (Jikan)
      const detailRes = await fetch(`https://api.jikan.moe/v4/anime/${anime.idMal}`);
      const detailData = await detailRes.json();

      if (!anime.trailer && detailData.data?.trailer?.youtube_id) {
        setPlayingVideo(`https://www.youtube.com/embed/${detailData.data.trailer.youtube_id}?autoplay=1`);
      }

      // 2. Search & Fetch Real Episodes from Consumet (Using Meta-Anilist)
      let foundInfo = null;

      try {
        console.log(`[Smart Match] Trying direct ID Sync: ${standardizedAnime.id}`);
        // The new Meta-Anilist backend can fetch info using the ID directly!
        const directInfo = await consumetApi.getInfo(standardizedAnime.id, 'anilist');
        if (directInfo && directInfo.episodes && directInfo.episodes.length > 0) {
          foundInfo = directInfo;
        }
      } catch (e) {
        console.warn("Direct ID match failed, falling back to title search.");
      }

      if (!foundInfo) {
        const titlesToTry = [
          standardizedAnime.title.english,
          standardizedAnime.title.romaji
        ].filter(Boolean);

        for (const t of titlesToTry) {
          if (foundInfo) break;
          const searchResults = await consumetApi.search(t);
          if (searchResults && searchResults.results?.length > 0) {
            const bestMatch = searchResults.results[0];
            const fullInfo = await consumetApi.getInfo(bestMatch.id, 'anilist');
            if (fullInfo && fullInfo.episodes && fullInfo.episodes.length > 0) {
              foundInfo = fullInfo;
              break;
            }
          }
        }
      }

      if (foundInfo) {
        setConsumetAnime(foundInfo);
        setActiveProvider('anilist');
        const sortedEps = [...foundInfo.episodes].sort((a, b) => b.number - a.number);
        setEpisodes(sortedEps);
      } else {
        console.warn("No real episodes found, using placeholders.");
        const totalEpisodes = anime.latestEpisode || (anime.nextAiringEpisode ? anime.nextAiringEpisode.episode - 1 : anime.episodes) || 1;
        const fallbackEps = [];
        for (let i = totalEpisodes; i >= 1; i--) {
          fallbackEps.push({ number: i, id: i, title: `Episode ${i}` });
        }
        setEpisodes(fallbackEps);
      }

    } catch (error) {
      console.error("Error in handleOpenAnime:", error);
    } finally {
      setIsLoadingEpisodes(false);
      setIsModalLoading(false);
    }
  }

  async function handleOpenAnimeFromProgress(progressItem) {
    setIsModalLoading(true);
    const query = `
      query ($id: Int) {
        Page {
          media (id: $id) {
            id idMal title { english romaji } bannerImage description
            coverImage { extraLarge } averageScore episodes status genres format
            nextAiringEpisode { airingAt episode }
            trailer { id site thumbnail }
          }
        }
      }
    `;
    const data = await fetchAniList(query, { id: progressItem.id });
    if (data && data[0]) {
      handleOpenAnime(data[0]);
    }
    setIsModalLoading(false);
  }
  const playEpisode = async (episode, targetServer = null) => {
    // Guard: Check if episode and anime are valid
    if (!episode || !selectedAnime) {
      console.warn('[Playback] Cannot play: episode or anime is null');
      return;
    }

    setSelectedEpisode(episode);
    setIsModalLoading(true);
    const animeId = selectedAnime.id;
    const malId = selectedAnime.idMal || selectedAnime.id;
    const epNum = episode.number || 1;
    const animeTitle = selectedAnime.title.english || selectedAnime.title.romaji;

    try {
      console.log(`[Playback] ${targetServer || 'Auto'} mode for Ep ${epNum}`);

      if (targetServer === 'vidlink') {
        // Correct Vidlink Format: /anilist/ID?episode=NUMBER
        const url = `https://vidlink.pro/anime/anilist/${animeId}?episode=${epNum}&primaryColor=ff0000`;
        setPlayingVideo(url);
        setVideoSources({ sources: [{ url, isEmbed: true }] });
      } else if (targetServer === 'vidsrc') {
        // Vidsrc.xyz is the new stable alternative
        const url = `https://vidsrc.xyz/embed/anime/${animeId}/${epNum}`;
        setPlayingVideo(url);
        setVideoSources({ sources: [{ url, isEmbed: true }] });
      } else if (targetServer === 'animepahe') {
        const url = `https://animepahe.pw/?search=${encodeURIComponent(animeTitle)}`;
        setPlayingVideo(url);
        setVideoSources({ sources: [{ url, isEmbed: true, quality: 'animepahe' }] });
      } else {
        // Auto logic: Try Vidlink first then Vidsrc.xyz
        try {
          // Try local API first
          let sources = await consumetApi.getSources(episode.id, epNum, animeId);
          if (sources && sources.sources && sources.sources.length > 0 && !sources.isFallback) {
            setVideoSources(sources);
            const mainSource = sources.sources.find(s => s.quality === 'default' || s.quality === 'auto') || sources.sources[0];
            setPlayingVideo(mainSource.url);
          } else {
            throw new Error("Local API Down");
          }
        } catch (e) {
          console.warn("Switching to Vidlink God-mode...");
          const url = `https://vidlink.pro/anime/anilist/${animeId}?episode=${epNum}&primaryColor=ff0000`;
          setPlayingVideo(url);
          setVideoSources({ sources: [{ url, isEmbed: true }] });
        }
      }

      setUserProgress(prev => ({
        ...prev,
        [String(animeId)]: {
          id: selectedAnime.id,
          idMal: selectedAnime.idMal,
          title: selectedAnime.title.english || selectedAnime.title.romaji,
          episode: epNum,
          image: selectedAnime.coverImage?.extraLarge,
          updatedAt: Date.now(),
          status: 'watching'
        }
      }));
    } catch (e) {
      console.error("Playback error, trying Vidsrc.me fallback:", e);
      const vidsrc = `https://vidsrc.me/embed/anime?anilist=${animeId}&episode=${epNum}&color=ff0000`;
      setPlayingVideo(vidsrc);
      setVideoSources({ sources: [{ url: vidsrc, isEmbed: true }] });
    } finally {
      setIsModalLoading(false);
    }
  }

  const getCurrentServer = () => {
    if (playingVideo?.includes('vidlink')) return 'vidlink';
    if (playingVideo?.includes('vidsrc')) return 'vidsrc';
    return 'auto';
  };

  const closeModal = () => {
    setSelectedAnime(null);
    setEpisodes([]);
    setPlayingVideo("");
    setShowStatusMenu(false);
  }

  const addToWatchlist = (status = 'watching') => {
    const animeId = String(selectedAnime.id);
    setUserProgress(prev => ({
      ...prev,
      [animeId]: {
        id: selectedAnime.id,
        idMal: selectedAnime.idMal,
        title: selectedAnime.title.english || selectedAnime.title.romaji,
        episode: status === 'plan_to_watch' ? 0 : 1,
        image: selectedAnime.coverImage?.extraLarge,
        synopsis: selectedAnime.description,
        genres: selectedAnime.genres,
        updatedAt: Date.now(),
        status: status
      }
    }));
    setShowStatusMenu(false);
  };

  const removeFromWatchlist = () => {
    const animeId = String(selectedAnime.id);
    setUserProgress(prev => {
      const copy = { ...prev };
      delete copy[animeId];
      return copy;
    });
  };

  const updateStatus = (status) => {
    const animeId = String(selectedAnime.id);
    setUserProgress(prev => ({
      ...prev,
      [animeId]: {
        ...prev[animeId],
        status: status,
        updatedAt: Date.now()
      }
    }));
  };

  return (
    <div className="app">
      <Navbar />

      {isModalLoading && (
        <div className="loader-container" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.9)' }}>
          <div className="loader-ring" style={{ borderTopColor: 'var(--accent)' }}></div>
        </div>
      )}

      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Home userProgress={userProgress} handleOpenAnime={handleOpenAnime} handleOpenAnimeFromProgress={handleOpenAnimeFromProgress} />} />
          <Route path="/genre/:genreName" element={<Genre handleOpenAnime={handleOpenAnime} />} />
          <Route path="/account" element={<AccountView progress={userProgress} setProgress={setUserProgress} onBack={() => navigate(-1)} onAnimeClick={handleOpenAnimeFromProgress} />} />
          <Route path="/search" element={<Search handleOpenAnime={handleOpenAnime} />} />
          <Route path="/top-anime" element={<TopAnime handleOpenAnime={handleOpenAnime} />} />
          <Route path="*" element={<Home userProgress={userProgress} handleOpenAnime={handleOpenAnime} handleOpenAnimeFromProgress={handleOpenAnimeFromProgress} />} />
        </Routes>
      </AnimatePresence>

      <Footer />

      <AnimatePresence>
        {selectedAnime && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="modal-content"
            >
              <button onClick={closeModal} className="modal-close">✕</button>
              <div className="modal-body">
                <div className="modal-main">
                  <div className="video-container" style={{ minHeight: '450px' }}>
                    {playingVideo ? (
                      playingVideo.includes('.m3u8') || playingVideo.includes('.mp4') ? (
                        <VideoPlayer
                          sources={videoSources?.sources || [{ url: playingVideo, quality: 'default' }]}
                          poster={selectedAnime.bannerImage || selectedAnime.coverImage?.extraLarge}
                          onEnded={() => {
                            const currentIndex = episodes.findIndex(e => (e.number || e.mal_id) === selectedEpisode.number);
                            if (currentIndex > 0) playEpisode(episodes[currentIndex - 1]);
                          }}
                        />
                      ) : (
                        <iframe
                          src={playingVideo}
                          width="100%"
                          height="450px"
                          frameBorder="0"
                          allowFullScreen
                          style={{ borderRadius: '16px', backgroundColor: '#000' }}
                          title="Anime Player"
                        ></iframe>
                      )
                    ) : (
                      <div className="no-video-placeholder">
                        <img src={selectedAnime.bannerImage || selectedAnime.coverImage?.extraLarge} alt="Placeholder" />
                        <div className="no-video-overlay">
                          <button
                            className="btn btn-primary"
                            onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(selectedAnime.title.english || selectedAnime.title.romaji)}+trailer`, '_blank')}
                          >
                            Watch Trailer on YouTube
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
 
                  <div className="server-selector" style={{ display: 'flex', gap: '10px', marginTop: '15px', padding: '0 5px', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', marginRight: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Server:</span>
                    {[
                      { id: 'auto', label: 'Primary (Auto)', active: !playingVideo?.includes('vidlink') && !playingVideo?.includes('vidsrc') && !playingVideo?.includes('localhost') },
                      { id: 'vidlink', label: 'Vidlink (MAL)', active: playingVideo?.includes('vidlink') },
                      { id: 'vidsrc', label: 'Vidsrc (AniList)', active: playingVideo?.includes('vidsrc') },
                      { id: 'animepahe', label: 'AnimePahe', active: playingVideo?.includes('animepahe.pw') }
                    ].map(server => (
                      <button 
                        key={server.id}
                        className={`server-btn ${server.active ? 'active' : ''}`}
                        onClick={() => {
                          playEpisode(selectedEpisode, server.id);
                        }}
                      >
                        {server.label}
                      </button>
                    ))}
                  </div>


                  {videoSources?.sources && videoSources.sources.length > 1 && (
                    <div className="quality-selector" style={{ display: 'flex', gap: '8px', marginTop: '12px', padding: '0 5px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quality:</span>
                      {videoSources.sources.map((source, idx) => (
                        <button 
                          key={idx}
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.8rem',
                            borderRadius: '6px',
                            border: `1px solid ${playingVideo === source.url ? 'var(--primary)' : 'var(--border-color)'}`,
                            backgroundColor: playingVideo === source.url ? 'var(--primary)' : 'var(--bg-secondary)',
                            color: playingVideo === source.url ? '#fff' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontWeight: playingVideo === source.url ? 600 : 400,
                            transition: 'all 0.2s'
                          }}
                          onClick={() => {
                            setPlayingVideo(source.url);
                          }}
                        >
                          {source.quality || 'Source'}
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedEpisode && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          className="btn btn-secondary"
                          disabled={episodes.findIndex(e => (e.number || e.mal_id) === selectedEpisode.number) === episodes.length - 1}
                          onClick={() => {
                            const currentIndex = episodes.findIndex(e => (e.number || e.mal_id) === selectedEpisode.number);
                            if (currentIndex < episodes.length - 1) playEpisode(episodes[currentIndex + 1], getCurrentServer());
                          }}
                          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                        >
                          Previous
                        </button>
                        <button
                          className="btn btn-secondary"
                          disabled={episodes.findIndex(e => (e.number || e.mal_id) === selectedEpisode.number) === 0}
                          onClick={() => {
                            const currentIndex = episodes.findIndex(e => (e.number || e.mal_id) === selectedEpisode.number);
                            if (currentIndex > 0) playEpisode(episodes[currentIndex - 1], getCurrentServer());
                          }}
                          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                        >
                          Next
                        </button>
                      </div>
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem', fontWeight: 600 }}>
                        Episode {selectedEpisode.number}
                      </span>
                    </div>
                  )}
                  <h2 style={{ marginTop: '25px', fontSize: '2.2rem', fontWeight: 800 }}>
                    {selectedAnime.title?.english || selectedAnime.title?.romaji || 'Unknown Title'}
                  </h2>
                  <div style={{ display: 'flex', gap: '8px', margin: '20px 0' }}>
                    {selectedAnime.genres?.map(g => (
                      <span
                        key={g}
                        className="hero-badge"
                        style={{ margin: 0, cursor: 'pointer' }}
                        onClick={() => {
                          closeModal();
                          navigate(`/genre/${g}`);
                        }}
                      >
                        {g}
                      </span>
                    ))}
                  </div>

                  <div style={{ margin: '20px 0', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {!userProgress[String(selectedAnime.id)] ? (
                      <Dropdown
                        currentStatus={null}
                        onStatusChange={(status) => addToWatchlist(status)}
                        triggerButton={
                          <Button
                            variant="primary"
                            size="medium"
                            icon={Plus}
                            glow
                          >
                            Add to Watchlist
                          </Button>
                        }
                      />
                    ) : (
                      <>
                        <Button
                          variant="success"
                          size="medium"
                          icon={Bookmark}
                          onClick={removeFromWatchlist}
                        >
                          In Watchlist
                        </Button>

                        <Dropdown
                          currentStatus={userProgress[String(selectedAnime.id)].status || 'watching'}
                          onStatusChange={(status) => updateStatus(status)}
                          triggerButton={
                            <select
                              className="status-select-premium"
                              value={userProgress[String(selectedAnime.id)].status || 'watching'}
                              onChange={(e) => updateStatus(e.target.value)}
                              style={{
                                padding: '12px 20px',
                                borderRadius: '12px',
                                background: 'rgba(255, 255, 255, 0.08)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                color: 'white',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                outline: 'none',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                              }}
                            >
                              <option value="watching" style={{ background: '#1a1a1a' }}>Watching</option>
                              <option value="plan_to_watch" style={{ background: '#1a1a1a' }}>Plan to Watch</option>
                              <option value="finished" style={{ background: '#1a1a1a' }}>Completed</option>
                            </select>
                          }
                        />
                      </>
                    )}
                  </div>
                  <p
                    style={{ color: 'var(--text-muted)', lineHeight: '1.8', fontSize: '1.05rem' }}
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedAnime.description || 'No description available.') }}
                  ></p>
                </div>

                <div className="modal-aside">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Episodes</h3>
                  </div>
                  <div className="episodes-grid">
                    {isLoadingEpisodes ? (
                      Array.from({ length: 12 }).map((_, i) => (
                        <div
                          key={i}
                          className="skeleton-shimmer"
                          style={{
                            height: '42px',
                            borderRadius: '8px',
                            opacity: 0.8
                          }}
                        />
                      ))
                    ) : episodes.length > 0 ? (
                      episodes.map((ep) => {
                        const epNum = ep.number || ep.mal_id;
                        const progress = userProgress[String(selectedAnime.id)];
                        const isWatched = progress?.status === 'finished' || (progress?.episode >= epNum);
                        const isCurrent = selectedEpisode?.number === epNum;

                        return (
                          <button
                            key={ep.id || ep.mal_id}
                            className={`episode-num-btn ${isWatched ? 'watched' : ''} ${isCurrent ? 'current' : ''}`}
                            style={{
                              background: isCurrent ? 'white' : (isWatched ? 'var(--accent)' : 'var(--surface-light)'),
                              color: isCurrent ? 'black' : (isWatched ? 'white' : 'inherit'),
                              border: isCurrent ? 'none' : '1px solid rgba(255,255,255,0.1)'
                            }}
                            onClick={() => playEpisode(ep)}
                          >
                            {epNum}
                          </button>
                        );
                      })
                    ) : (
                      <p style={{ color: 'var(--text-dim)', textAlign: 'center', marginTop: '40px' }}>No episodes available.</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="btn btn-primary scroll-top-btn"
            onClick={scrollToTop}
          >
            <ArrowUp size={24} strokeWidth={3} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
