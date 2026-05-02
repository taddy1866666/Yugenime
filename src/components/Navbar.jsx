import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ListVideo } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchAniList } from '../utils/api';
import './Navbar.css';

function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Debounce search: wait 400ms after user stops typing, min 2 chars
  useEffect(() => {
    if (searchTerm.trim().length < 1) {
      setDebouncedTerm('');
      return;
    }
    const timer = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Scrolled state for background opacity
      if (currentScrollY > 50) setIsScrolled(true);
      else setIsScrolled(false);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchSearchSuggestions = async (query) => {
    if (!query || query.trim().length === 0) return [];

    const searchQuery = `
      query ($search: String) {
        Page (perPage: 8) {
          media (search: $search, sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
            id idMal title { english romaji } coverImage { extraLarge }
            averageScore episodes status genres format
            nextAiringEpisode { airingAt episode }
          }
        }
      }
    `;
    const data = await fetchAniList(searchQuery, { search: query });
    return data || [];
  };

  const { data: suggestions = [], isLoading: isLoadingSuggestions } = useQuery({
    queryKey: ['anime', 'search-suggestions', debouncedTerm],
    queryFn: () => fetchSearchSuggestions(debouncedTerm),
    enabled: debouncedTerm.length >= 1,
    staleTime: 1000 * 60 * 5, // Cache suggestions for 5 mins
  });

  // Sort results: prioritize those starting with the query, then keep API popularity sort
  const filteredSuggestions = [...suggestions].sort((a, b) => {
    const aTitle = (a.title.english || a.title.romaji || '').toLowerCase();
    const bTitle = (b.title.english || b.title.romaji || '').toLowerCase();
    const query = debouncedTerm.toLowerCase();

    const aStarts = aTitle.startsWith(query);
    const bStarts = bTitle.startsWith(query);

    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return 0;
  }).slice(0, 8);
  // Show dropdown only when debounced term is ready
  const showSuggestions = isSearchOpen && debouncedTerm.length >= 1;

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && e.target.value.trim() !== '') {
      navigate(`/search?q=${encodeURIComponent(e.target.value.trim())}`);
      setIsSearchOpen(false);
      setSearchTerm('');
      setDebouncedTerm('');
    } else if (e.key === 'Enter') {
      navigate('/search');
      setIsSearchOpen(false);
      setSearchTerm('');
      setDebouncedTerm('');
    }
  };

  const handleSearchClick = () => {
    setIsSearchOpen(true);
  };

  const handleSuggestionClick = (anime) => {
    const title = anime.title.english || anime.title.romaji;
    navigate(`/search?q=${encodeURIComponent(title)}`);
    setIsSearchOpen(false);
    setSearchTerm('');
    setDebouncedTerm('');
  };

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    setSearchTerm('');
    setDebouncedTerm('');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    if (isSearchOpen) setIsSearchOpen(false);
  };

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container nav-content">
        <div className="navbar-logo">
          <Link to="/">
            <h1>Yugen<span>ime</span></h1>
          </Link>
        </div>

        <ul className="navbar-links">
          <li>
            <Link to="/" className={location.pathname === '/' ? "active" : ""}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Home
            </Link>
          </li>
          <li>
            <Link to="/top-anime" className={location.pathname === '/top-anime' ? "active" : ""}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
              </svg>
              Top 100
            </Link>
          </li>
        </ul>

        <div className="navbar-actions">
          <div className={`search-container ${isSearchOpen ? 'active' : ''}`}>
            {isSearchOpen ? (
              <motion.div 
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '250px', opacity: 1 }}
                className="search-input-wrapper"
              >
                <Search size={18} className="search-icon-inner" />
                <input 
                  type="text" 
                  placeholder="Search or Discover" 
                  autoFocus 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchSubmit}
                />
                <X size={18} className="close-search" onClick={handleCloseSearch} />
              </motion.div>
            ) : (
              <button className="search-trigger" onClick={handleSearchClick} title="Search & Discover">
                <Search size={20} />
              </button>
            )}

            <AnimatePresence>
              {showSuggestions && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="search-suggestions-modal"
                >
                  {isLoadingSuggestions ? (
                    <div className="search-loading">
                      <div className="search-spinner"></div>
                      <span>Finding anime...</span>
                    </div>
                  ) : filteredSuggestions.length > 0 ? (
                    <div className="search-suggestions-list">
                      <div className="search-suggestions-header">
                        <span className="search-results-count">Found {filteredSuggestions.length} anime</span>
                      </div>
                      {filteredSuggestions.map((anime, index) => (
                        <motion.div
                          key={anime.id}
                          className="search-suggestion-item"
                          onClick={() => handleSuggestionClick(anime)}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.12)', x: 4 }}
                        >
                          <img 
                            src={anime.coverImage.extraLarge} 
                            alt={anime.title.english || anime.title.romaji}
                            className="suggestion-image"
                          />
                          <div className="suggestion-info">
                            <h4 className="suggestion-title">
                              {anime.title.english || anime.title.romaji}
                            </h4>
                            <div className="suggestion-meta">
                              <span className="suggestion-rating">
                                {anime.averageScore ? (anime.averageScore / 10).toFixed(1) : 'N/A'} ★
                              </span>
                              <span className="suggestion-format">
                                {anime.format === 'MOVIE' ? 'Movie' : anime.episodes ? `${anime.episodes} ep` : 'Ongoing'}
                              </span>
                            </div>
                          </div>
                          <div className="suggestion-arrow">→</div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="search-no-results">
                      <span>No results found for "{searchTerm}"</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="navbar-auth">
            <Link to="/account" className="watchlist-btn">
              <ListVideo size={18} />
              <span>Watchlist</span>
            </Link>
          </div>

          <button className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`} onClick={toggleMobileMenu}>
            {isMobileMenuOpen ? <X size={24} /> : (
              <div className="hamburger">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mobile-menu"
          >
            <div className="mobile-menu-links">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className={location.pathname === '/' ? "active" : ""}>Home</Link>
              <Link to="/top-anime" onClick={() => setIsMobileMenuOpen(false)} className={location.pathname === '/top-anime' ? "active" : ""}>Top 100</Link>
              <Link to="/account" onClick={() => setIsMobileMenuOpen(false)} className={location.pathname === '/account' ? "active" : ""}>Watchlist</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default Navbar;
