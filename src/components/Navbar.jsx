import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ListVideo } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchAniList, LOCAL_API_URL } from '../utils/api';
import './Navbar.css';

function Navbar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (searchTerm.trim().length < 1) { setDebouncedTerm(''); return; }
    const timer = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchSearchSuggestions = async (query) => {
    if (!query || query.trim().length === 0) return [];
    try {
      const response = await fetch(`${LOCAL_API_URL}/search/${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.results) return data.results;
      }
    } catch (e) { /* silent */ }
    const gql = `query ($search: String) { Page (perPage: 8) { media (search: $search, sort: POPULARITY_DESC, type: ANIME, isAdult: false) { id idMal title { english romaji } coverImage { extraLarge } } } }`;
    return (await fetchAniList(gql, { search: query })) || [];
  };

  const { data: suggestions = [], isLoading: isLoadingSuggestions } = useQuery({
    queryKey: ['navbar-suggestions', debouncedTerm],
    queryFn: () => fetchSearchSuggestions(debouncedTerm),
    enabled: debouncedTerm.length >= 2,
    staleTime: 1000 * 60 * 5,
  });

  const showSuggestions = debouncedTerm.length >= 2 && searchFocused;

  const handleKey = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      navigate(`/search?q=${encodeURIComponent(e.target.value.trim())}`);
      setSearchTerm(''); setDebouncedTerm(''); setSearchFocused(false);
    } else if (e.key === 'Escape') {
      setSearchTerm(''); setSearchFocused(false);
    }
  };

  const handleSuggestionClick = (anime) => {
    navigate(`/search?q=${encodeURIComponent(anime.title.english || anime.title.romaji)}`);
    setSearchTerm(''); setDebouncedTerm(''); setSearchFocused(false);
  };

  const genres = [
    'Action','Adventure','Comedy','Drama','Fantasy',
    'Horror','Mecha','Mystery','Psychological','Romance',
    'Sci-Fi','Slice of Life','Sports','Supernatural','Thriller',
  ];

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="nav-content">

        {/* Logo */}
        <Link to="/" className="navbar-logo">
          Yugen<span>ime</span>
        </Link>

        {/* Desktop Links */}
        <ul className="navbar-links">
          <li><Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link></li>
          <li><Link to="/top-anime" className={location.pathname === '/top-anime' ? 'active' : ''}>Top</Link></li>
          <li className="nav-dropdown-item">
            <span className="nav-dropdown-trigger">Genres</span>
            <div className="nav-dropdown">
              <div className="nav-dropdown-grid">
                {genres.map(g => (
                  <Link key={g} to={`/genre/${g}`} className="nav-dropdown-link">{g}</Link>
                ))}
              </div>
            </div>
          </li>
        </ul>

        {/* Actions */}
        <div className="navbar-actions">
          {/* Search */}
          {location.pathname !== '/search' && (
            <div className="navbar-search-v2">
              <div 
                className={`search-pill ${searchFocused || searchTerm ? 'expanded' : ''}`}
                onClick={(e) => {
                  const input = e.currentTarget.querySelector('input');
                  if (input && !searchFocused) input.focus();
                }}
                style={{ cursor: searchFocused || searchTerm ? 'text' : 'pointer' }}
              >
                <Search size={15} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search anime…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKey}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                />
                {searchTerm && <X size={13} className="clear-search" onClick={(e) => { e.stopPropagation(); setSearchTerm(''); }} />}
              </div>

              <AnimatePresence>
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="suggestions-dropdown"
                  >
                    {isLoadingSuggestions
                      ? <div className="dropdown-loading">Searching…</div>
                      : suggestions.slice(0, 7).map(anime => (
                        <div key={anime.id} className="dropdown-item" onClick={() => handleSuggestionClick(anime)}>
                          <img src={anime.coverImage?.extraLarge || anime.image} alt="" />
                          <span>{anime.title?.english || anime.title?.romaji || anime.title}</span>
                        </div>
                      ))
                    }
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Watchlist */}
          <div className="navbar-auth">
            <Link to="/account" className="watchlist-btn">
              <ListVideo size={15} />
              <span>Watchlist</span>
            </Link>
          </div>

          {/* Hamburger */}
          <button
            className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(v => !v)}
          >
            {isMobileMenuOpen ? <X size={20} /> : (
              <div className="hamburger"><span/><span/><span/></div>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mobile-menu"
          >
            <div className="mobile-menu-links">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className={location.pathname === '/' ? 'active' : ''}>Home</Link>
              <Link to="/top-anime" onClick={() => setIsMobileMenuOpen(false)} className={location.pathname === '/top-anime' ? 'active' : ''}>Top Anime</Link>
              <Link to="/account" onClick={() => setIsMobileMenuOpen(false)} className={location.pathname === '/account' ? 'active' : ''}>Watchlist</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default Navbar;
