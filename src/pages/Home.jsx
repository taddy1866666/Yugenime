import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Hero from '../components/Hero';
import AnimeCard from '../components/AnimeCard';
import AiringSchedule from '../components/AiringSchedule';
import { fetchAniList } from '../utils/api';

const fetchTrending = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth();
  let season;
  if (month >= 0 && month <= 1) season = 'WINTER';
  else if (month >= 2 && month <= 4) season = 'SPRING';
  else if (month >= 5 && month <= 7) season = 'SUMMER';
  else if (month >= 8 && month <= 10) season = 'FALL';
  else season = 'WINTER';

  const trendingQuery = `
    query ($season: MediaSeason, $year: Int) {
      Page (perPage: 30) {
        media (season: $season, seasonYear: $year, sort: TRENDING_DESC, type: ANIME, isAdult: false) {
          id idMal title { english romaji } bannerImage description
          coverImage { extraLarge } averageScore episodes status genres format
          nextAiringEpisode { airingAt episode }
          trailer { id site thumbnail }
        }
      }
    }
  `;
  const trendingData = await fetchAniList(trendingQuery, { season, year });
  return trendingData;
};

const fetchLatest = async () => {
  const now = Math.floor(Date.now() / 1000);
  const oneWeekAgo = now - (7 * 24 * 60 * 60);
  const buffer = now + 3600;

  const latestQuery = `
    query ($start: Int, $end: Int) {
      Page (perPage: 50) {
        airingSchedules (airingAt_greater: $start, airingAt_lesser: $end, sort: TIME_DESC) {
          episode
          airingAt
          media {
            id idMal title { english romaji } coverImage { extraLarge }
            averageScore description bannerImage episodes status format genres
            nextAiringEpisode { airingAt episode }
            trailer { id site thumbnail }
          }
        }
      }
    }
  `;
  const airingData = await fetchAniList(latestQuery, { start: oneWeekAgo, end: buffer });

  const uniqueMap = new Map();
  airingData.forEach(item => {
    if (!uniqueMap.has(item.media.id)) {
      uniqueMap.set(item.media.id, {
        ...item.media,
        latestEpisode: item.episode,
        airingAt: item.airingAt
      });
    }
  });

  return Array.from(uniqueMap.values());
};

const fetchAnimeById = async (animeId) => {
  const query = `
    query ($id: Int) {
      Media (id: $id, type: ANIME) {
        id idMal title { english romaji } description
        genres coverImage { extraLarge }
      }
    }
  `;
  const data = await fetchAniList(query, { id: animeId });
  return data;
};

function Home({ userProgress, handleOpenAnime, handleOpenAnimeFromProgress }) {
  const navigate = useNavigate();
  const [showAllLatest, setShowAllLatest] = useState(false);
  const [showAllTrending, setShowAllTrending] = useState(false);
  const [enrichedProgress, setEnrichedProgress] = useState(userProgress);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const displayLimit = isMobile ? 4 : 10;

  // Auto-fetch missing synopsis and genres for old watchlist items
  useEffect(() => {
    const enrichData = async () => {
      const needsEnrichment = Object.values(userProgress).some(
        anime => !anime.synopsis || !anime.genres || anime.genres?.length === 0
      );

      if (!needsEnrichment) {
        setEnrichedProgress(userProgress);
        return;
      }

      const enriched = { ...userProgress };
      let hasChanges = false;

      for (const [key, anime] of Object.entries(enriched)) {
        if ((!anime.synopsis || !anime.genres || anime.genres?.length === 0) && anime.id) {
          try {
            const fullData = await fetchAnimeById(anime.id);
            if (fullData) {
              enriched[key] = {
                ...anime,
                synopsis: fullData.description || 'No description available.',
                genres: fullData.genres || []
              };
              hasChanges = true;
            }
          } catch (err) {
            console.error(`Failed to enrich anime ${anime.id}:`, err);
          }
        }
      }

      if (hasChanges) {
        setEnrichedProgress(enriched);
        localStorage.setItem('yugenime_progress', JSON.stringify(enriched));
      }
    };

    if (Object.keys(userProgress || {}).length > 0) {
      enrichData();
    }
  }, [userProgress]);

  const { data: trendingKitsu = [], isLoading: isLoadingTrending } = useQuery({
    queryKey: ['anime', 'trending'],
    queryFn: fetchTrending,
  });

  const { data: latestAnime = [], isLoading: isLoadingLatest } = useQuery({
    queryKey: ['anime', 'latest'],
    queryFn: fetchLatest,
  });

  const isLoading = isLoadingTrending || isLoadingLatest;
  const heroAnime = trendingKitsu.filter(m => m.bannerImage).slice(0, 5);

  const getBadgeText = (anime) => {
    if (anime.format === 'MOVIE') return 'Movie';
    if (anime.latestEpisode) return `EP ${anime.latestEpisode}`;
    if (anime.nextAiringEpisode) return `EP ${anime.nextAiringEpisode.episode - 1}`;
    if (anime.episodes) return `EP ${anime.episodes}`;
    return 'Ongoing';
  };

  if (isLoading) {
    return (
      <div className="loader-container">
        <div className="loader-ring"></div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Initializing Yugenime...</p>
      </div>
    );
  }

  return (
    <motion.div
      key="home"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Hero
        trendingAnime={heroAnime}
        onPlay={(anime) => handleOpenAnime(anime)}
      />

      <div className="container">
        {/* Continue Watching (Inline) */}
        {Object.keys(enrichedProgress || {}).length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ marginTop: '40px' }}
          >
            <div className="section-header">
              <h2 className="section-title">Continue Watching</h2>
              <button className="btn btn-ghost" onClick={() => navigate('/account')}>
                View All <ChevronRight size={16} />
              </button>
            </div>
            <div className="anime-grid">
              {Object.values(enrichedProgress)
                .filter(item => item.status !== 'finished')
                .sort((a, b) => b.updatedAt - a.updatedAt)
                .slice(0, isMobile ? 4 : 5)
                .map((anime) => (
                  <AnimeCard
                    key={anime.id}
                    title={anime.title}
                    image={anime.image}
                    rating="N/A"
                    episode={`EP ${anime.episode}`}
                    synopsis={anime.synopsis || 'No description available.'}
                    genres={anime.genres || []}
                    isProgress={true}
                    onGenreClick={(genre) => navigate(`/genre/${genre}`)}
                    onClick={() => handleOpenAnimeFromProgress(anime)}
                  />
                ))}
            </div>
          </motion.section>
        )}

        {/* Latest Releases */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          style={{ marginTop: '60px' }}
        >
          <div className="section-header">
            <h2 className="section-title">Latest Releases</h2>
            <button className="btn btn-ghost" onClick={() => setShowAllLatest(!showAllLatest)}>
              {showAllLatest ? 'Show Less' : 'View All'} <ChevronRight size={16} style={{ transform: showAllLatest ? 'rotate(90deg)' : 'none', transition: '0.3s' }} />
            </button>
          </div>
          <div className="anime-grid">
            {(showAllLatest ? latestAnime : latestAnime.slice(0, isMobile ? 4 : 10)).map((anime) => (
              <AnimeCard
                key={anime.id}
                title={anime.title.english || anime.title.romaji}
                image={anime.coverImage.extraLarge}
                rating={anime.averageScore ? (anime.averageScore / 10).toFixed(1) : "N/A"}
                episode={getBadgeText(anime)}
                synopsis={anime.description}
                genres={anime.genres}
                onGenreClick={(genre) => navigate(`/genre/${genre}`)}
                onClick={() => handleOpenAnime(anime)}
              />
            ))}
          </div>
        </motion.section>

        {/* Trending Now */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          style={{ marginTop: '80px', marginBottom: '100px' }}
        >
          <div className="section-header">
            <h2 className="section-title">Trending Now</h2>
            <button className="btn btn-ghost" onClick={() => setShowAllTrending(!showAllTrending)}>
              {showAllTrending ? 'Show Less' : 'View All'} <ChevronRight size={16} style={{ transform: showAllTrending ? 'rotate(90deg)' : 'none', transition: '0.3s' }} />
            </button>
          </div>
          <div className="anime-grid">
            {(showAllTrending ? trendingKitsu : trendingKitsu.slice(0, isMobile ? 4 : 10)).map((anime) => (
              <AnimeCard
                key={anime.id}
                title={anime.title.english || anime.title.romaji}
                image={anime.coverImage.extraLarge}
                rating={anime.averageScore ? (anime.averageScore / 10).toFixed(1) : "N/A"}
                episode={getBadgeText(anime)}
                synopsis={anime.description}
                genres={anime.genres}
                onGenreClick={(genre) => navigate(`/genre/${genre}`)}
                onClick={() => handleOpenAnime(anime)}
              />
            ))}
          </div>
        </motion.section>

        <AiringSchedule onAnimeClick={handleOpenAnime} />
      </div>
    </motion.div>
  );
}

export default Home;
