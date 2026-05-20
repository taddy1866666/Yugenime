import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Settings } from 'lucide-react';

const VideoPlayer = ({ sources, poster, onEnded }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [currentSource, setCurrentSource] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (sources && sources.length > 0) {
      // Pick default or first source
      const initial = sources.find(s => s.quality === 'default' || s.quality === 'auto') || sources[0];
      setCurrentSource(initial);
    }
  }, [sources]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentSource) return;

    const url = currentSource.url;
    const currentTime = video.currentTime;

    if (url.includes('.m3u8')) {
      if (Hls.isSupported()) {
        if (hlsRef.current) hlsRef.current.destroy();
        
        const hls = new Hls();
        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (currentTime > 0) video.currentTime = currentTime;
          video.play().catch(e => console.log("Autoplay blocked:", e));
        });
        
        return () => hls.destroy();
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.addEventListener('loadedmetadata', () => {
          if (currentTime > 0) video.currentTime = currentTime;
          video.play().catch(e => console.log("Autoplay blocked:", e));
        });
      }
    } else {
      video.src = url;
      if (currentTime > 0) video.currentTime = currentTime;
    }
  }, [currentSource]);

  const handleQualityChange = (source) => {
    setCurrentSource(source);
    setShowSettings(false);
  };

  return (
    <div className="video-player-wrapper" style={{ position: 'relative', width: '100%', height: '100%', background: '#000', borderRadius: '16px', overflow: 'hidden' }}>
      <video
        ref={videoRef}
        poster={poster}
        controls
        playsInline
        onEnded={onEnded}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />

      {/* Quality Selector */}
      <div className="player-controls-overlay">
        <button 
          className="settings-btn"
          onClick={() => setShowSettings(!showSettings)}
          title="Settings"
        >
          <Settings size={20} />
          <span className="current-quality-badge">{currentSource?.quality || 'Auto'}</span>
        </button>

        {showSettings && (
          <div className="quality-menu">
            <div className="menu-header">Quality</div>
            {sources.map((s, idx) => (
              <button 
                key={idx}
                className={`menu-item ${currentSource?.url === s.url ? 'active' : ''}`}
                onClick={() => handleQualityChange(s)}
              >
                {s.quality}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <style>{`
        .video-player-wrapper video::-webkit-media-controls-panel {
          background-image: linear-gradient(transparent, rgba(0,0,0,0.8)) !important;
        }
        
        .player-controls-overlay {
          position: absolute;
          top: 20px;
          right: 20px;
          z-index: 10;
        }

        .settings-btn {
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          padding: 8px 12px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .settings-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: scale(1.05);
        }

        .current-quality-badge {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          opacity: 0.8;
        }

        .quality-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: rgba(15, 15, 15, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          min-width: 140px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          overflow: hidden;
          animation: slideIn 0.2s ease;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .menu-header {
          padding: 12px 16px;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          color: var(--text-dim);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .menu-item {
          width: 100%;
          padding: 10px 16px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          text-align: left;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .menu-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }

        .menu-item.active {
          color: var(--accent);
          font-weight: 700;
          background: rgba(255, 46, 99, 0.05);
        }
      `}</style>
    </div>
  );
};

export default VideoPlayer;
