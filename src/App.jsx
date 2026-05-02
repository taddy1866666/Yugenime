import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowUp, Plus, Check, Clock, ListTodo, CheckCircle2, Bookmark } from 'lucide-react';
import { fetchAniList } from './utils/api';
import Button from './components/Button';

import Navbar from './components/Navbar';
import AccountView from './components/AccountView';
import Dropdown from './components/Dropdown';
import Home from './pages/Home';
import Genre from './pages/Genre';
import Search from './pages/Search';
import TopAnime from './pages/TopAnime';

import './App.css';

function App() {
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const [playingVideo, setPlayingVideo] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

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

  // Save to localStorage whenever userProgress changes
  useEffect(() => {
    localStorage.setItem('yugenime_progress', JSON.stringify(userProgress));
  }, [userProgress]);

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

  const handleOpenAnime = async (anime) => {
    setSelectedAnime(anime);
    setEpisodes([]);
    setIsLoadingEpisodes(true);

    // Set Video Trailer (AniList Primary)
    if (anime.trailer && anime.trailer.site === 'youtube') {
      setPlayingVideo(`https://www.youtube.com/embed/${anime.trailer.id}?autoplay=1`);
    } else {
      setPlayingVideo(""); // Reset, we will try Jikan fallback below
    }

    try {
      // 1. Fetch Anime Details (Jikan) for backup trailer
      const detailRes = await fetch(`https://api.jikan.moe/v4/anime/${anime.idMal}`);
      const detailData = await detailRes.json();

      if (!anime.trailer && detailData.data?.trailer?.youtube_id) {
        setPlayingVideo(`https://www.youtube.com/embed/${detailData.data.trailer.youtube_id}?autoplay=1`);
      }

      // If still no video, check Jikan Video Gallery (PVs)
      if (!anime.trailer && !detailData.data?.trailer?.youtube_id) {
        const videoRes = await fetch(`https://api.jikan.moe/v4/anime/${anime.idMal}/videos`);
        const videoData = await videoRes.json();
        const promoVid = videoData.data?.promo?.[0]?.trailer?.youtube_id;
        if (promoVid) {
          setPlayingVideo(`https://www.youtube.com/embed/${promoVid}?autoplay=1`);
        }
      }

      // 2. Generate Episodes Instantly (Zero API Calls)
      const totalEpisodes = anime.latestEpisode || (anime.nextAiringEpisode ? anime.nextAiringEpisode.episode - 1 : anime.episodes) || 1;
      
      const allEpisodes = [];
      for (let i = totalEpisodes; i >= 1; i--) {
        allEpisodes.push({ mal_id: i });
      }

      setEpisodes(allEpisodes);
    } catch (error) {
      console.error("Error in handleOpenAnime:", error);
    } finally {
      setIsLoadingEpisodes(false);
    }
  }

  const handleOpenAnimeFromProgress = async (progressItem) => {
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

  const playEpisode = (episodeNumber) => {
    const title = selectedAnime.title.english || selectedAnime.title.romaji;
    const animeId = String(selectedAnime.id);

    // Update Progress
    setUserProgress(prev => ({
      ...prev,
      [animeId]: {
        id: selectedAnime.id,
        idMal: selectedAnime.idMal,
        title: title,
        episode: episodeNumber,
        image: selectedAnime.coverImage?.extraLarge,
        synopsis: selectedAnime.synopsis,
        genres: selectedAnime.genres,
        updatedAt: Date.now(),
        status: 'watching'
      }
    }));

    // Directly open GogoAnime Search for convenience
    const url = `https://gogoanime3.co/search.html?keyword=${encodeURIComponent(title)}`;
    window.open(url, '_blank');
  }

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
      const copy = {...prev};
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
        <div className="loader-container" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)' }}>
          <div className="loader-ring"></div>
        </div>
      )}

      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Home userProgress={userProgress} handleOpenAnime={handleOpenAnime} handleOpenAnimeFromProgress={handleOpenAnimeFromProgress} />} />
          <Route path="/genre/:genreName" element={<Genre handleOpenAnime={handleOpenAnime} />} />
          <Route path="/account" element={<AccountView progress={userProgress} setProgress={setUserProgress} onBack={() => navigate(-1)} onAnimeClick={handleOpenAnimeFromProgress} />} />
          <Route path="/search" element={<Search handleOpenAnime={handleOpenAnime} />} />
          <Route path="/top-anime" element={<TopAnime handleOpenAnime={handleOpenAnime} />} />
        </Routes>
      </AnimatePresence>

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
                  <div className="video-container">
                    {playingVideo ? (
                      <iframe src={playingVideo} width="100%" height="450px" frameBorder="0" allowFullScreen style={{ borderRadius: '16px', backgroundColor: '#000' }}></iframe>
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
                  <h2 style={{ marginTop: '25px', fontSize: '2.2rem', fontWeight: 800 }}>
                    {selectedAnime.title.english || selectedAnime.title.romaji}
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
                    dangerouslySetInnerHTML={{ __html: selectedAnime.description || 'No description available.' }}
                  ></p>
                </div>

                <div className="modal-aside">
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Episodes</h3>
                  <div className="episodes-grid">
                    {isLoadingEpisodes ? (
                      <div className="loader-ring" style={{ margin: '40px auto' }}></div>
                    ) : episodes.length > 0 ? (
                      episodes.map((ep) => {
                        const progress = userProgress[String(selectedAnime.id)];
                        const isWatched = progress?.status === 'finished' || (progress?.episode >= ep.mal_id);
                        
                        return (
                          <button
                            key={ep.mal_id}
                            className={`episode-num-btn ${isWatched ? 'watched' : ''}`}
                            style={{ 
                              background: isWatched ? 'var(--accent)' : 'var(--surface-light)',
                              color: isWatched ? 'white' : 'inherit' 
                            }}
                            onClick={() => playEpisode(ep.mal_id)}
                          >
                            {ep.mal_id}
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
