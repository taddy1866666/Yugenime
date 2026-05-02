import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search as SearchIcon } from 'lucide-react';
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

  // Get initial query from URL (?q=...) or from router state — read once on mount
  const getInitialQuery = () => {
    const params = new URLSearchParams(location.search);
    return params.get('q') || location.state?.query || '';
  };

  const [inputValue, setInputValue] = useState(getInitialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(getInitialQuery);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('');
  const debounceRef = useRef(null);

  // When navigating from navbar to search page, sync the URL query
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    if (q && q !== inputValue) {
      setInputValue(q);
      setDebouncedQuery(q);
    }
  }, [location.search]);

  // Debounce: update debouncedQuery 500ms after user stops typing
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(val.trim());
    }, 500);
  };

  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['search', debouncedQuery, selectedGenre, selectedFormat],
    queryFn: () => fetchSearchResults(debouncedQuery, selectedGenre, selectedFormat),
    enabled: !!debouncedQuery || !!selectedGenre || !!selectedFormat,
    staleTime: 1000 * 60 * 5,
  });

  const sortedResults = [...searchResults].sort((a, b) => {
    if (!debouncedQuery) return 0;
    const aTitle = (a.title.english || a.title.romaji || '').toLowerCase();
    const bTitle = (b.title.english || b.title.romaji || '').toLowerCase();
    const query = debouncedQuery.toLowerCase();

    const aStarts = aTitle.startsWith(query);
    const bStarts = bTitle.startsWith(query);

    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return 0;
  });

  const getBadgeText = (anime) => {
    if (anime.format === 'MOVIE') return 'Movie';
    if (anime.nextAiringEpisode) return `EP ${anime.nextAiringEpisode.episode - 1}`;
    if (anime.episodes) return `EP ${anime.episodes}`;
    return 'Ongoing';
  };

  const hasSearch = !!debouncedQuery || !!selectedGenre || !!selectedFormat;

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

      <div className="search-filters" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '40px' }}>
        <div className="search-input-box" style={{ flex: '1 1 260px', position: 'relative', minWidth: 0 }}>
          <SearchIcon size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search anime titles..."
            value={inputValue}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '13px 14px 13px 42px',
              borderRadius: '12px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'white',
              fontSize: '0.95rem',
              outline: 'none',
              fontFamily: 'inherit',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        <select
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
          style={{ padding: '0 16px', borderRadius: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'white', fontSize: '0.9rem', cursor: 'pointer', minWidth: '130px' }}
        >
          <option value="">All Genres</option>
          {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>

        <select
          value={selectedFormat}
          onChange={(e) => setSelectedFormat(e.target.value)}
          style={{ padding: '0 16px', borderRadius: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'white', fontSize: '0.9rem', cursor: 'pointer', minWidth: '130px' }}
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
      ) : hasSearch && sortedResults.length > 0 ? (
        <div className="anime-grid">
          {sortedResults.map((anime) => (
            <AnimeCard
              key={anime.id}
              title={anime.title.english || anime.title.romaji}
              image={anime.coverImage.extraLarge}
              rating={anime.averageScore ? (anime.averageScore / 10).toFixed(1) : 'N/A'}
              episode={getBadgeText(anime)}
              synopsis={anime.description}
              genres={anime.genres}
              onGenreClick={(g) => { setSelectedGenre(g); setInputValue(''); setDebouncedQuery(''); }}
              onClick={() => handleOpenAnime(anime)}
            />
          ))}
        </div>
      ) : hasSearch ? (
        <div style={{ textAlign: 'center', marginTop: '80px', opacity: 0.5 }}>
          <SearchIcon size={56} style={{ marginBottom: '16px' }} />
          <h3>No results found</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Try a different title or filter.</p>
        </div>
      ) : (
        <div style={{ textAlign: 'center', marginTop: '80px', opacity: 0.4 }}>
          <SearchIcon size={56} style={{ marginBottom: '16px' }} />
          <h3>Search for anything</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Type an anime title or pick a genre.</p>
        </div>
      )}
    </motion.div>
  );
}

export default Search;
