import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search as SearchIcon, Filter } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import AnimeCard from '../components/AnimeCard';
import { fetchAniList } from '../utils/api';
import './Search.css';

const fetchSearchResults = async (query, genre, format) => {
  if (!query && !genre && !format) return [];

  const searchQuery = `
    query ($search: String, $genre: String, $format: MediaFormat) {
      Page (perPage: 40) {
        media (search: $search, genre: $genre, format: $format, sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
          id idMal title { english romaji } bannerImage description
          coverImage { extraLarge } averageScore episodes status genres format
          nextAiringEpisode { airingAt episode }
          trailer { id site thumbnail }
        }
      }
    }
  `;

  const variables = {};
  if (query) variables.search = query;
  if (genre) variables.genre = genre;
  if (format) variables.format = format;

  const data = await fetchAniList(searchQuery, variables);
  return data || [];
};

const GENRES = ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mecha", "Music", "Mystery", "Psychological", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Thriller"];

function Search({ handleOpenAnime }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('');

  // Initialize search term from location state if coming from navbar suggestion
  useEffect(() => {
    if (location.state?.query) {
      setSearchTerm(location.state.query);
    }
  }, [location.state?.query]);

  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['anime', 'search', searchTerm, selectedGenre, selectedFormat],
    queryFn: () => fetchSearchResults(searchTerm, selectedGenre, selectedFormat),
    enabled: !!searchTerm || !!selectedGenre || !!selectedFormat,
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
      key="search-view"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container"
      style={{ paddingTop: '100px', paddingBottom: '100px', minHeight: '100vh' }}
    >
      <div className="section-header" style={{ marginBottom: '30px' }}>
        <h2 className="section-title">Discover Anime</h2>
      </div>

      <div className="search-filters" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '40px' }}>
        <div className="search-input-box" style={{ flex: '1 1 300px', position: 'relative' }}>
          <SearchIcon size={20} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search anime titles..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '15px 15px 15px 45px', borderRadius: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'white', fontSize: '1rem' }}
          />
        </div>

        <select 
          value={selectedGenre} 
          onChange={(e) => setSelectedGenre(e.target.value)}
          style={{ padding: '0 20px', borderRadius: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'white', fontSize: '1rem' }}
        >
          <option value="">All Genres</option>
          {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>

        <select 
          value={selectedFormat} 
          onChange={(e) => setSelectedFormat(e.target.value)}
          style={{ padding: '0 20px', borderRadius: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'white', fontSize: '1rem' }}
        >
          <option value="">All Formats</option>
          <option value="TV">TV Series</option>
          <option value="MOVIE">Movie</option>
          <option value="OVA">OVA</option>
        </select>
      </div>

      {isLoading ? (
        <div className="loader-container" style={{ height: '40vh' }}>
          <div className="loader-ring"></div>
        </div>
      ) : searchResults.length > 0 ? (
        <div className="anime-grid">
          {searchResults.map((anime) => (
            <AnimeCard
              key={anime.id}
              title={anime.title.english || anime.title.romaji}
              image={anime.coverImage.extraLarge}
              rating={anime.averageScore ? (anime.averageScore / 10).toFixed(1) : "N/A"}
              episode={getBadgeText(anime)}
              synopsis={anime.description}
              genres={anime.genres}
              onGenreClick={(g) => {
                setSelectedGenre(g);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onClick={() => handleOpenAnime(anime)}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state" style={{ textAlign: 'center', marginTop: '60px', opacity: 0.6 }}>
          <SearchIcon size={64} style={{ marginBottom: '20px' }} />
          <h3>No results found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      )}
    </motion.div>
  );
}

export default Search;
