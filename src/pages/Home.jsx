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
  console.log('[Home] Fetching trending anime...');
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
  try {
    const trendingData = await fetchAniList(trendingQuery, { season, year });
    console.log('[Home] Trending loaded:', trendingData?.length || 0, 'results');
    return trendingData;
  } catch (e) {
    console.error('[Home] Trending fetch failed:', e);
    return [];
  }
};

const fetchLatest = async () => {
  console.log('[Home] Fetching latest airing anime...');
  const now = Math.floor(Date.now() / 1000);
  const oneWeekAgo = now - (7 * 24 * 60 * 60);
  const buffer = now + 3600;

  const latestQuery = `
    query ($start: Int, $end: Int) {
      Page (perPage: 30) {
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
  try {
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

    const result = Array.from(uniqueMap.values());
    console.log('[Home] Latest loaded:', result?.length || 0, 'results');
    return result;
  } catch (e) {
    console.error('[Home] Latest fetch failed:', e);
    return [];
  }
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

const EMERGENCY_TRENDING = [
  { id: 16498, idMal: 16498, title: { english: "Attack on Titan", romaji: "Shingeki no Kyojin" }, coverImage: { extraLarge: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-7396ak9vJX9h.png" }, bannerImage: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/16498-8987ak9vJX9h.jpg", averageScore: 85, episodes: 25, status: "FINISHED", genres: ["Action", "Drama", "Fantasy"] },
  { id: 11061, idMal: 11061, title: { english: "Hunter x Hunter", romaji: "Hunter x Hunter" }, coverImage: { extraLarge: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11061-s9edZ9edZ9ed.png" }, bannerImage: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/11061-s9edZ9edZ9ed.jpg", averageScore: 90, episodes: 148, status: "FINISHED", genres: ["Action", "Adventure", "Fantasy"] },
  { id: 21087, idMal: 21087, title: { english: "One Punch Man", romaji: "One Punch Man" }, coverImage: { extraLarge: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21087-7396ak9vJX9h.png" }, bannerImage: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/21087-8987ak9vJX9h.jpg", averageScore: 83, episodes: 12, status: "FINISHED", genres: ["Action", "Comedy", "Sci-Fi"] }
];

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

  // Fetch data
  const { data: trendingData = [], isLoading: isLoadingTrending } = useQuery({
    queryKey: ['anime', 'trending'],
    queryFn: fetchTrending,
    retry: 1,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  const { data: latestRaw = [], isLoading: isLoadingLatest } = useQuery({
    queryKey: ['anime', 'latest'],
    queryFn: fetchLatest,
    retry: 1,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Normalize Data
  const trendingAnime = trendingData.length > 0 ? trendingData : EMERGENCY_TRENDING;
  const latestAnime = latestRaw.length > 0 ? latestRaw : EMERGENCY_TRENDING;

  // Show loading only if BOTH are still loading and NO data yet
  const isLoading = (isLoadingTrending || isLoadingLatest) && trendingData.length === 0 && latestRaw.length === 0;
  const heroAnime = trendingAnime.filter(m => m.bannerImage).slice(0, 5);

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
        {/* Latest Releases */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px" }}
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
          viewport={{ once: true, margin: "0px" }}
          style={{ marginTop: '80px', marginBottom: '100px' }}
        >
          <div className="section-header">
            <h2 className="section-title">Trending Now</h2>
            <button className="btn btn-ghost" onClick={() => setShowAllTrending(!showAllTrending)}>
              {showAllTrending ? 'Show Less' : 'View All'} <ChevronRight size={16} style={{ transform: showAllTrending ? 'rotate(90deg)' : 'none', transition: '0.3s' }} />
            </button>
          </div>
          <div className="anime-grid">
            {(showAllTrending ? trendingAnime : trendingAnime.slice(0, isMobile ? 4 : 10)).map((anime) => (
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
