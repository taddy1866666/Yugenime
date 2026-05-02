import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Filter } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import AnimeCard from '../components/AnimeCard';
import { fetchAniList } from '../utils/api';

const fetchGenreAnime = async (genre) => {
  const genreQuery = `
    query ($genre: String) {
      Page (perPage: 40) {
        media (genre_in: [$genre], sort: TRENDING_DESC, type: ANIME, isAdult: false) {
          id idMal title { english romaji } bannerImage description
          coverImage { extraLarge } averageScore episodes status genres format
          nextAiringEpisode { airingAt episode }
          trailer { id site thumbnail }
        }
      }
    }
  `;
  const data = await fetchAniList(genreQuery, { genre });
  return data || [];
};

function Genre({ handleOpenAnime }) {
  const { genreName } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [genreName]);

  const { data: genreAnime = [], isLoading: isGenreLoading } = useQuery({
    queryKey: ['anime', 'genre', genreName],
    queryFn: () => fetchGenreAnime(genreName),
    enabled: !!genreName,
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
      key="genre-view"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="container genre-view"
      style={{ paddingTop: '40px', paddingBottom: '100px' }}
    >
      <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: '30px', paddingLeft: 0 }}>
        <ArrowLeft size={20} />
        <span>Back</span>
      </button>

      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Filter size={24} color="var(--accent)" />
          <h2 className="section-title">{genreName} Anime</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{genreAnime.length} results found</p>
      </div>

      {isGenreLoading ? (
        <div className="loader-container" style={{ height: '40vh' }}>
          <div className="loader-ring"></div>
        </div>
      ) : (
        <div className="anime-grid" style={{ marginTop: '40px' }}>
          {genreAnime.map((anime) => (
            <AnimeCard
              key={anime.id}
              title={anime.title.english || anime.title.romaji}
              image={anime.coverImage.extraLarge}
              rating={anime.averageScore ? (anime.averageScore / 10).toFixed(1) : "N/A"}
              episode={getBadgeText(anime)}
              synopsis={anime.description}
              genres={anime.genres}
              onGenreClick={(g) => navigate(`/genre/${g}`)}
              onClick={() => handleOpenAnime(anime)}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default Genre;
