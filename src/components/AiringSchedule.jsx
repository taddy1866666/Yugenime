import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar, ChevronRight, ChevronLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { SkeletonScheduleGrid } from './Skeleton';
import './AiringSchedule.css';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const fetchSchedule = async (weekOffset) => {
  // Calculate the start of the current week (Sunday)
  const now = new Date();
  const currentDayIndex = now.getDay();
  
  // Move to the week we want
  const targetDate = new Date(now);
  targetDate.setDate(targetDate.getDate() + (weekOffset * 7));
  const targetDayIndex = targetDate.getDay();
  
  // Calculate Sunday of the targeted week
  const startOfWeek = new Date(targetDate);
  startOfWeek.setDate(targetDate.getDate() - targetDayIndex);
  startOfWeek.setHours(0, 0, 0, 0);
  
  // Calculate end of Saturday (start of next Sunday)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  endOfWeek.setHours(0, 0, 0, 0);
  
  const start = Math.floor(startOfWeek.getTime() / 1000);
  const end = Math.floor(endOfWeek.getTime() / 1000);

  console.log(`[Schedule] Fetching for week offset ${weekOffset}, ${startOfWeek.toDateString()} to ${endOfWeek.toDateString()}`);

  const query = `
    query ($start: Int, $end: Int) {
      Page (perPage: 50) {
        airingSchedules (airingAt_greater: $start, airingAt_lesser: $end, sort: TIME_ASC) {
          airingAt
          episode
          media {
            id idMal title { english romaji } coverImage { extraLarge }
            genres description averageScore episodes status format
            trailer { id site thumbnail }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { start, end } })
    });

    const result = await response.json();
    let airing = result.data?.Page?.airingSchedules || [];

    // Filter to only include anime with valid images and titles
    airing = airing.filter(item => 
      item.media && 
      item.media.coverImage?.extraLarge && 
      item.media.title?.english &&
      item.airingAt
    );

    console.log(`[Schedule] Found ${airing.length} valid airing schedules for this week`);

    if (airing.length > 0) {
      // Grouping by day of week
      const grouped = {};
      DAYS.forEach(d => grouped[d] = []);

      airing.forEach(item => {
        if (!item.media) return;
        const date = new Date(item.airingAt * 1000);
        const dayName = DAYS[date.getDay()];
        if (grouped[dayName]) {
          grouped[dayName].push(item);
        }
      });

      // Sort each day by time
      Object.keys(grouped).forEach(day => {
        grouped[day].sort((a, b) => a.airingAt - b.airingAt);
      });

      return grouped;
    }

    if (weekOffset === 0) {
      console.log('[Schedule] No schedules found, trying fallback 1...');
    }
  } catch (error) {
    console.warn('[Schedule] Primary query failed:', error.message);
    if (weekOffset === 0) {
      console.log('[Schedule] Trying fallback 1...');
    }
  }

  // Fallback 1: Fetch trending RELEASING anime (for current week only)
  if (weekOffset === 0) {
    try {
      console.log('[Schedule] Fetching fallback 1: trending RELEASING anime...');
      const fallbackQuery1 = `
        query {
          Page (perPage: 50) {
            media (status: RELEASING, sort: TRENDING_DESC, type: ANIME, isAdult: false) {
              id idMal title { english romaji } coverImage { extraLarge }
              genres description averageScore episodes status format
              nextAiringEpisode { airingAt episode }
              trailer { id site thumbnail }
            }
          }
        }
      `;
      const fbRes1 = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: fallbackQuery1 })
      });
      const fbData1 = await fbRes1.json();
      let releasing = fbData1.data?.Page?.media || [];
      
      releasing = releasing.filter(m => 
        m.nextAiringEpisode && 
        m.coverImage?.extraLarge && 
        m.title?.english
      );

      if (releasing.length > 0) {
        const airing = releasing.map(m => ({
          airingAt: m.nextAiringEpisode.airingAt,
          episode: m.nextAiringEpisode.episode,
          media: m
        }));

        const grouped = {};
        DAYS.forEach(d => grouped[d] = []);
        airing.forEach(item => {
          const date = new Date(item.airingAt * 1000);
          const dayName = DAYS[date.getDay()];
          if (grouped[dayName]) {
            grouped[dayName].push(item);
          }
        });
        Object.keys(grouped).forEach(day => {
          grouped[day].sort((a, b) => a.airingAt - b.airingAt);
        });

        console.log(`[Schedule] Fallback 1 loaded ${releasing.length} results`);
        return grouped;
      }
      console.log('[Schedule] Fallback 1 returned 0 results, trying fallback 2...');
    } catch (e) {
      console.warn('[Schedule] Fallback 1 failed:', e.message);
      console.log('[Schedule] Trying fallback 2...');
    }

    // Fallback 2: Fetch any RELEASING anime globally
    try {
      console.log('[Schedule] Fetching fallback 2: all RELEASING anime...');
      const fallbackQuery2 = `
        query {
          Page (perPage: 50) {
            media (status: RELEASING, type: ANIME, isAdult: false) {
              id idMal title { english romaji } coverImage { extraLarge }
              genres description averageScore episodes status format
              nextAiringEpisode { airingAt episode }
              trailer { id site thumbnail }
            }
          }
        }
      `;
      const fbRes2 = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: fallbackQuery2 })
      });
      const fbData2 = await fbRes2.json();
      let releasing2 = fbData2.data?.Page?.media || [];

      releasing2 = releasing2.filter(m => 
        m.nextAiringEpisode && 
        m.coverImage?.extraLarge && 
        m.title?.english
      );

      if (releasing2.length > 0) {
        const airing = releasing2.map(m => ({
          airingAt: m.nextAiringEpisode.airingAt,
          episode: m.nextAiringEpisode.episode,
          media: m
        }));

        const grouped = {};
        DAYS.forEach(d => grouped[d] = []);
        airing.forEach(item => {
          const date = new Date(item.airingAt * 1000);
          const dayName = DAYS[date.getDay()];
          if (grouped[dayName]) {
            grouped[dayName].push(item);
          }
        });
        Object.keys(grouped).forEach(day => {
          grouped[day].sort((a, b) => a.airingAt - b.airingAt);
        });

        console.log(`[Schedule] Fallback 2 loaded ${releasing2.length} results`);
        return grouped;
      }
    } catch (e) {
      console.warn('[Schedule] Fallback 2 failed:', e.message);
    }
  }

  // Return empty schedule if all attempts fail
  console.error('[Schedule] All fetch attempts failed');
  const emptyGrouped = {};
  DAYS.forEach(d => emptyGrouped[d] = []);
  return emptyGrouped;
};



const AiringSchedule = ({ onAnimeClick }) => {
  const [activeDay, setActiveDay] = useState(() => DAYS[new Date().getDay()]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update timer every minute to refresh countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Update every 60 seconds (1 minute)

    return () => clearInterval(interval);
  }, []);

  const { data: schedule = {}, isLoading } = useQuery({
    queryKey: ['schedule', weekOffset],
    queryFn: () => fetchSchedule(weekOffset),
    staleTime: 1000 * 60 * 5, // Keep schedule cached for 5 minutes
  });

  const getDayDate = (dayName) => {
    const now = new Date();
    const currentDayIndex = now.getDay();
    const targetDayIndex = DAYS.indexOf(dayName);
    
    // Calculate the start of current week (Sunday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDayIndex);
    
    // Add the week offset
    startOfWeek.setDate(startOfWeek.getDate() + (weekOffset * 7));
    
    // Get the date for the target day
    const targetDate = new Date(startOfWeek);
    targetDate.setDate(startOfWeek.getDate() + targetDayIndex);
    
    return targetDate.getDate();
  };

  const getMonthYear = () => {
    const now = new Date();
    const currentDayIndex = now.getDay();
    
    // Calculate the start of current week (Sunday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDayIndex);
    
    // Add the week offset
    startOfWeek.setDate(startOfWeek.getDate() + (weekOffset * 7));
    
    return startOfWeek.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return null;
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <section className="airing-schedule-section">
      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Calendar size={28} color="var(--accent)" strokeWidth={2.5} />
          <h2 className="section-title">Airing Schedule</h2>
        </div>
        <div className="current-month-display">
          <span>{getMonthYear()}</span>
        </div>
      </div>

      <div className="day-selector-wrapper">
        <button className="nav-btn-main" onClick={() => setWeekOffset(prev => prev - 1)}>
          <ChevronLeft size={24} />
        </button>

        <div className="day-selector">
          {DAYS.map((day) => (
            <button
              key={day}
              className={`day-tab ${activeDay === day ? 'active' : ''}`}
              onClick={() => setActiveDay(day)}
            >
              <span style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '2px', textTransform: 'uppercase' }}>
                {day.substring(0, 3)}
              </span>
              <span style={{ fontSize: '1.2rem' }}>{getDayDate(day)}</span>
            </button>
          ))}
        </div>

        <button className="nav-btn-main" onClick={() => setWeekOffset(prev => prev + 1)}>
          <ChevronRight size={24} />
        </button>
      </div>

      <div className="schedule-content">
        {isLoading ? (
          <SkeletonScheduleGrid count={6} />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeDay}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="schedule-grid"
            >
              {schedule[activeDay]?.length > 0 ? (
                schedule[activeDay].map((item, idx) => (
                  <motion.div 
                    key={item.media.id + idx} 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="schedule-card"
                    onClick={() => onAnimeClick(item.media)}
                  >
                    <div className="card-image">
                      <img src={item.media.coverImage.extraLarge} alt={item.media.title.english} />
                    </div>
                    <div className="card-content">
                      <h3 className="card-title">{item.media.title.english || item.media.title.romaji}</h3>
                      
                      <div className="card-info">
                        <div className="info-item">
                          <Clock size={14} />
                          <span>
                            {item.broadcastTime !== 'TBA' ? item.broadcastTime : formatTime(item.airingAt) || 'TBA'}
                            {item.airingAt > currentTime / 1000 && (() => {
                              const nowSec = Math.floor(currentTime / 1000);
                              const diff = item.airingAt - nowSec;
                              return (
                                <span style={{ color: 'var(--accent)', marginLeft: '8px', fontSize: '0.75rem', opacity: 0.8 }}>
                                  • In {Math.floor(diff / 3600)}h {Math.floor((diff % 3600) / 60)}m
                                </span>
                              );
                            })()}
                          </span>
                        </div>
                        <div className="info-item">
                          <span className="badge-ep">Episode {item.episode}</span>
                        </div>
                      </div>

                      <div className="card-footer">
                        {item.media.genres?.slice(0, 2).map(g => (
                          <span key={g} className="genre-small">{g}</span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="empty-schedule" style={{ gridColumn: '1/-1', height: '300px' }}>
                  <div style={{ textAlign: 'center', opacity: 0.5 }}>
                    <Calendar size={48} style={{ marginBottom: '20px' }} />
                    <p>No releases found for this day.</p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </section>
  );
};

export default AiringSchedule;
