import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar, ChevronRight, ChevronLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { SkeletonScheduleGrid } from './Skeleton';
import './AiringSchedule.css';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const fetchSchedule = async (weekOffset) => {
  const now = new Date();
  now.setDate(now.getDate() + (weekOffset * 7));
  const currentDayIndex = now.getDay();
  
  // Calculate Sunday of the targeted week
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - currentDayIndex);
  startOfWeek.setHours(0, 0, 0, 0);
  
  // Calculate Saturday of the targeted week
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  
  const start = Math.floor(startOfWeek.getTime() / 1000);
  const end = Math.floor(endOfWeek.getTime() / 1000);

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

    // Fallback: If no schedules found for this exact range (API might be paginated heavily),
    // fetch trending releasing anime instead to simulate a schedule.
    if (airing.length === 0) {
      const fallbackQuery = `
        query {
          Page (perPage: 30) {
            media (status: RELEASING, sort: TRENDING_DESC, type: ANIME, isAdult: false) {
              id idMal title { english romaji } coverImage { extraLarge }
              genres description averageScore episodes status format
              nextAiringEpisode { airingAt episode }
              trailer { id site thumbnail }
            }
          }
        }
      `;
      const fbRes = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: fallbackQuery })
      });
      const fbData = await fbRes.json();
      const releasing = fbData.data?.Page?.media || [];
      airing = releasing.filter(m => m.nextAiringEpisode).map(m => ({
        airingAt: m.nextAiringEpisode.airingAt,
        episode: m.nextAiringEpisode.episode,
        media: m
      }));
    }

    // Grouping
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
  } catch (error) {
    console.error("Failed to fetch schedule:", error);
    const emptyGrouped = {};
    DAYS.forEach(d => emptyGrouped[d] = []);
    return emptyGrouped;
  }
};



const AiringSchedule = ({ onAnimeClick }) => {
  const [activeDay, setActiveDay] = useState(() => DAYS[new Date().getDay()]);
  const [weekOffset, setWeekOffset] = useState(0);

  const { data: schedule = {}, isLoading } = useQuery({
    queryKey: ['schedule', weekOffset],
    queryFn: () => fetchSchedule(weekOffset),
    staleTime: 1000 * 60 * 30, // Keep schedule cached for 30 minutes
  });

  const getDayDate = (dayName) => {
    const now = new Date();
    now.setDate(now.getDate() + (weekOffset * 7));
    const currentDayIndex = now.getDay();
    const targetDayIndex = DAYS.indexOf(dayName);
    
    const diff = targetDayIndex - currentDayIndex;
    const date = new Date(now);
    date.setDate(now.getDate() + diff);
    
    return date.getDate();
  };

  const getMonthYear = () => {
    const now = new Date();
    now.setDate(now.getDate() + (weekOffset * 7));
    return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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
                            {item.airingAt > Date.now() / 1000 && (() => {
                              const nowSec = Math.floor(Date.now() / 1000);
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
