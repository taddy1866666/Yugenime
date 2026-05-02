import React from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import AnimeCard from '../components/AnimeCard';
import { fetchAniList } from '../utils/api';

const fetchTopAnime = async () => {
  const makeQuery = (page) => `
    query {
      Page (page: ${page}, perPage: 50) {
        media (sort: SCORE_DESC, type: ANIME, isAdult: false) {
          id idMal title { english romaji } bannerImage description
          coverImage { extraLarge } averageScore episodes status genres format
          nextAiringEpisode { airingAt episode }
          trailer { id site thumbnail }
        }
      }
    }
  `;
  try {
    const [page1, page2] = await Promise.all([
      fetchAniList(makeQuery(1)),
      fetchAniList(makeQuery(2)),
    ]);
    return [...(page1 || []), ...(page2 || [])];
  } catch (e) {
    return [];
  }
};

function TopAnime({ handleOpenAnime }) {
  const navigate = useNavigate();

  const { data: topAnime = [], isLoading } = useQuery({
    queryKey: ['anime', 'top'],
    queryFn: fetchTopAnime,
    staleTime: 1000 * 60 * 60 * 24, // Cache for 24 hours
  });

  const getBadgeText = (anime) => {
    if (anime.format === 'MOVIE') return 'Movie';
    if (anime.latestEpisode) return `EP ${anime.latestEpisode}`;
    if (anime.nextAiringEpisode) return `EP ${anime.nextAiringEpisode.episode - 1}`;
    if (anime.episodes) return `EP ${anime.episodes}`;
    return 'Ongoing';
  };

  return (
    <motion.div
      key="top-anime-view"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container"
      style={{ paddingTop: '100px', paddingBottom: '100px', minHeight: '100vh' }}
    >
      <div className="section-header" style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Trophy size={32} color="#fbbf24" />
          <h2 className="section-title">Top 100 Anime of All Time</h2>
        </div>
        <p style={{ color: 'var(--text-muted)' }}>Highest rated anime on AniList</p>
      </div>

      {isLoading ? (
        <div className="loader-container" style={{ height: '40vh' }}>
          <div className="loader-ring"></div>
        </div>
      ) : (
        <div className="anime-grid">
          {topAnime.map((anime, index) => (
            <div key={anime.id} style={{ position: 'relative' }}>
              <div 
                style={{
                  position: 'absolute',
                  top: '-15px',
                  left: '-10px',
                  background: index < 3 ? '#fbbf24' : 'var(--surface-light)',
                  color: index < 3 ? '#000' : 'white',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '1.2rem',
                  zIndex: 2,
                  boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                }}
              >
                #{index + 1}
              </div>
              <AnimeCard
                title={anime.title.english || anime.title.romaji}
                image={anime.coverImage.extraLarge}
                rating={anime.averageScore ? (anime.averageScore / 10).toFixed(1) : "N/A"}
                episode={getBadgeText(anime)}
                synopsis={anime.description}
                genres={anime.genres}
                onGenreClick={(g) => navigate(`/genre/${g}`)}
                onClick={() => handleOpenAnime(anime)}
              />
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default TopAnime;
