import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Play, Trash2, ArrowLeft, Bookmark, Download, Upload, ListTodo, BarChart3, Share2, TrendingUp, Star, X, CheckCircle2 } from 'lucide-react';
import AnimeCard from './AnimeCard';
import Dropdown from './Dropdown';
import './AccountView.css';

function AccountView({ progress, setProgress, onBack, onAnimeClick }) {
  const [activeTab, setActiveTab] = useState('watching');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const fileInputRef = useRef(null);

  const sortedProgress = Object.values(progress).sort((a, b) => b.updatedAt - a.updatedAt);
  
  const filteredProgress = sortedProgress.filter(item => {
    if (activeTab === 'finished') return item.status === 'finished';
    if (activeTab === 'plan_to_watch') return item.status === 'plan_to_watch';
    return !item.status || item.status === 'watching';
  });

  const removeProgress = (animeId) => {
    setProgress(prev => {
      const updated = { ...prev };
      delete updated[animeId];
      return updated;
    });
  };

  const setStatus = (animeId, status) => {
    setProgress(prev => ({
      ...prev,
      [animeId]: { ...prev[animeId], status, updatedAt: Date.now() }
    }));
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(progress));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "yugenime_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          setProgress(importedData);
          alert("Watchlist imported successfully!");
        } catch (error) {
          alert("Invalid backup file.");
        }
      };
      reader.readAsText(file);
    }
  };

  // Calculate statistics
  const watching = Object.values(progress).filter(item => !item.status || item.status === 'watching').length;
  const planToWatch = Object.values(progress).filter(item => item.status === 'plan_to_watch').length;
  const finished = Object.values(progress).filter(item => item.status === 'finished').length;
  const totalAnime = watching + planToWatch + finished;
  const totalEpisodes = Object.values(progress).reduce((sum, item) => sum + (item.episode || 0), 0);

  // ANALYTICS: Calculate advanced statistics
  const avgRating = totalAnime > 0 ? (Object.values(progress).reduce((sum, item) => sum + (item.rating || 0), 0) / totalAnime).toFixed(1) : 0;
  const estimatedHours = Math.round(totalEpisodes * 0.4); // 24 min per episode
  const mostWatchedGenre = Object.values(progress).reduce((acc, item) => {
    const genre = item.genre || 'Unknown';
    acc[genre] = (acc[genre] || 0) + 1;
    return acc;
  }, {});
  const topGenre = Object.entries(mostWatchedGenre).sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

  // SMART RECOMMENDATIONS: Get anime rated 4+ stars
  const getSmartRecommendations = () => {
    const highRated = Object.values(progress)
      .filter(item => (item.rating || 0) >= 4 && item.status === 'finished')
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5);
    return highRated;
  };

  // SOCIAL: Share watchlist function
  const shareWatchlist = () => {
    const stats = `Check out my Yugenime watchlist! 🎬\n${watching} watching • ${planToWatch} planned • ${finished} completed\n${totalEpisodes} episodes watched • ${avgRating}⭐ avg rating`;
    
    if (navigator.share) {
      navigator.share({
        title: 'My Yugenime Watchlist',
        text: stats
      });
    } else {
      navigator.clipboard.writeText(stats);
      alert('Watchlist stats copied to clipboard! Share with friends.');
    }
  };

  // Set rating for anime
  const setRating = (animeId, rating) => {
    setProgress(prev => ({
      ...prev,
      [animeId]: { ...prev[animeId], rating, updatedAt: Date.now() }
    }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="container account-view-container"
    >
      <div className="account-header">
        <div className="account-header-left">
          <button className="btn btn-ghost back-btn" onClick={onBack}>
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </button>
          
          <div className="user-info-large">
            <div className="avatar-wrapper">
              <Bookmark size={32} color="white" />
            </div>
            <div className="user-info-text">
              <h2>Your Watchlist</h2>
              <p className="watchlist-stats">
                {totalAnime === 0 ? 'Start building your watchlist' : `${totalAnime} ${totalAnime === 1 ? 'anime' : 'anime'} tracked • ${totalEpisodes} ${totalEpisodes === 1 ? 'episode' : 'episodes'} watched`}
              </p>
              <div className="status-badges">
                <div className="status-badge-item">
                  <Clock size={16} color="var(--accent)" />
                  <span><strong>{watching}</strong> Ongoing</span>
                </div>
                <div className="status-badge-item">
                  <ListTodo size={16} color="var(--accent)" />
                  <span><strong>{planToWatch}</strong> Planned</span>
                </div>
                <div className="status-badge-item">
                  <Play size={16} color="var(--accent)" />
                  <span><strong>{finished}</strong> Completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="account-actions">
          <button className="btn btn-secondary action-btn" onClick={() => setShowAnalytics(true)}>
            <BarChart3 size={18} />
            <span>Analytics</span>
          </button>
          <button className="btn btn-secondary action-btn" onClick={() => setShowRecommendations(true)}>
            <TrendingUp size={18} />
            <span>Recs</span>
          </button>
          <button className="btn btn-secondary action-btn" onClick={shareWatchlist}>
            <Share2 size={18} />
            <span>Share</span>
          </button>
          <button className="btn btn-secondary action-btn" onClick={handleExport}>
            <Download size={18} />
            <span>Backup</span>
          </button>
          <button className="btn btn-secondary action-btn" onClick={() => fileInputRef.current.click()}>
            <Upload size={18} />
            <span>Restore</span>
            <input 
              type="file" 
              accept=".json" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleImport} 
            />
          </button>
        </div>
      </div>

      <div className="account-tabs" style={{ marginBottom: '30px' }}>
        <button 
          className={`tab-btn ${activeTab === 'watching' ? 'active' : ''}`}
          onClick={() => setActiveTab('watching')}
        >
          Ongoing
        </button>
        <button 
          className={`tab-btn ${activeTab === 'plan_to_watch' ? 'active' : ''}`}
          onClick={() => setActiveTab('plan_to_watch')}
        >
          Plan to Watch
        </button>
        <button 
          className={`tab-btn ${activeTab === 'finished' ? 'active' : ''}`}
          onClick={() => setActiveTab('finished')}
        >
          Finished
        </button>
      </div>

      <section className="progress-section">
        <div className="section-header">
          <div className="section-title-group">
            {activeTab === 'plan_to_watch' ? <ListTodo size={24} color="var(--accent)" /> : <Clock size={24} color="var(--accent)" />}
            <h3 className="section-title">
              {activeTab === 'watching' ? 'Currently Watching' : activeTab === 'finished' ? 'Completed Anime' : 'Plan to Watch'}
            </h3>
          </div>
          <span className="count-badge">{filteredProgress.length} Anime</span>
        </div>

        {filteredProgress.length > 0 ? (
          <div className="anime-grid">
            {filteredProgress.map((item) => (
              <motion.div 
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
              >
                <AnimeCard
                  title={item.title}
                  image={item.image}
                  rating="N/A"
                  episode={activeTab === 'plan_to_watch' ? 'Not started' : `EP ${item.episode}`}
                  synopsis={item.synopsis || 'No description available.'}
                  genres={item.genres || []}
                  onGenreClick={() => {}}
                  onClick={() => onAnimeClick(item)}
                  isProgress={true}
                />

                {/* Star Rating */}
                <div className="star-rating-container">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      size={18}
                      onClick={() => setRating(item.id, star)}
                      className={`star-icon ${star <= (item.rating || 0) ? 'active' : ''}`}
                    />
                  ))}
                </div>
                
                <div className="anime-card-actions">
                  <div style={{ flex: 1 }}>
                    <Dropdown
                      currentStatus={item.status || 'watching'}
                      onStatusChange={(status) => setStatus(item.id, status)}
                      triggerButton={
                        <button className="status-trigger-premium">
                          <span>
                            {item.status === 'watching' ? 'Watching' : item.status === 'plan_to_watch' ? 'Plan to Watch' : 'Completed'}
                          </span>
                          <span className="trigger-arrow">▼</span>
                        </button>
                      }
                    />
                  </div>
                  
                  <button 
                    className="btn btn-secondary remove-from-list-btn" 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Remove "${item.title}" from watchlist?`)) removeProgress(item.id);
                    }}
                    title="Remove from list"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ textAlign: 'center', marginTop: '60px', opacity: 0.6 }}>
            <Bookmark size={64} style={{ marginBottom: '20px' }} />
            <h3>You haven't added anything here yet.</h3>
            <p>Go explore some anime and add them to your watchlist!</p>
            <button className="btn btn-primary" onClick={onBack} style={{ marginTop: '20px' }}>Explore Anime</button>
          </div>
        )}
      </section>

      {/* ANALYTICS MODAL */}
      <AnimatePresence>
        {showAnalytics && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
             className="modal-overlay-custom"
            onClick={() => setShowAnalytics(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal-content-custom"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>📊 Watchlist Analytics</h3>
                <button className="modal-close-btn" onClick={() => setShowAnalytics(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <p className="stat-label">Total Anime</p>
                  <p className="stat-value">{totalAnime}</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Episodes Watched</p>
                  <p className="stat-value">{totalEpisodes}</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Estimated Hours</p>
                  <p className="stat-value">{estimatedHours}h</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Avg Rating</p>
                  <p className="stat-value">{avgRating}⭐</p>
                </div>
              </div>

              <div style={{ marginBottom: '20px', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <h4 style={{ marginBottom: '16px', fontWeight: 700 }}>📈 Status Breakdown</h4>
                <div className="status-grid">
                  <div className="status-stat-item" style={{ background: 'rgba(46, 213, 115, 0.08)' }}>
                    <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2ed573' }}>{watching}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Watching</p>
                  </div>
                  <div className="status-stat-item" style={{ background: 'rgba(255, 165, 0, 0.08)' }}>
                    <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffa500' }}>{planToWatch}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Planned</p>
                  </div>
                  <div className="status-stat-item" style={{ background: 'rgba(100, 200, 255, 0.08)' }}>
                    <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#64c8ff' }}>{finished}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Completed</p>
                  </div>
                </div>
              </div>

              <div style={{ padding: '20px', background: 'rgba(var(--accent-rgb), 0.05)', borderRadius: '16px', border: '1px solid rgba(var(--accent-rgb), 0.1)' }}>
                <h4 style={{ marginBottom: '8px', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-muted)' }}>🎬 TOP GENRE</h4>
                <p style={{ fontSize: '1.4rem', color: 'var(--accent)', fontWeight: 800 }}>{topGenre}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RECOMMENDATIONS MODAL */}
      <AnimatePresence>
        {showRecommendations && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
             className="modal-overlay-custom"
            onClick={() => setShowRecommendations(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal-content-custom"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>🔥 Smart Recommendations</h3>
                <button className="modal-close-btn" onClick={() => setShowRecommendations(false)}>
                  <X size={20} />
                </button>
              </div>

              {getSmartRecommendations().length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '10px' }}>Based on your 4+ rated anime:</p>
                  {getSmartRecommendations().map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      style={{
                        padding: '15px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border)',
                        borderRadius: '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <p style={{ fontWeight: 700, marginBottom: '4px' }}>{item.title}</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Status: {item.status === 'finished' ? '✅ Completed' : item.status === 'watching' ? '🎬 Watching' : '📌 Planned'}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            fill={i < (item.rating || 0) ? 'var(--accent)' : 'transparent'}
                            color={i < (item.rating || 0) ? 'var(--accent)' : 'var(--text-muted)'}
                          />
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <Star size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
                  <p>Rate your completed anime to get personalized recommendations!</p>
                  <p style={{ fontSize: '0.85rem', marginTop: '10px' }}>Give 4+ stars to your favorites and come back here.</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default AccountView;
