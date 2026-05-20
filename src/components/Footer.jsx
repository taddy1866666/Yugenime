import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Send, Heart } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">

          {/* Brand & Socials */}
          <div className="footer-brand">
            <div className="footer-logo">
              <h1>Yugen<span>ime</span></h1>
            </div>
            <p className="footer-description">
              The ultimate destination for anime enthusiasts. Discover, track, and watch your favorite series with our community-driven platform.
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-links">
            <h4 className="footer-title">Navigation</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/top-anime">Top 100</Link></li>
              <li><Link to="/search">Discover</Link></li>
              <li><Link to="/account">My Watchlist</Link></li>
            </ul>
          </div>

          {/* Genres */}
          <div className="footer-links">
            <h4 className="footer-title">Popular Genres</h4>
            <div className="footer-grid-links">
              <ul>
                <li><Link to="/genre/Action">Action</Link></li>
                <li><Link to="/genre/Adventure">Adventure</Link></li>
                <li><Link to="/genre/Comedy">Comedy</Link></li>
                <li><Link to="/genre/Drama">Drama</Link></li>
              </ul>
              <ul>
                <li><Link to="/genre/Fantasy">Fantasy</Link></li>
                <li><Link to="/genre/Romance">Romance</Link></li>
                <li><Link to="/genre/Sci-Fi">Sci-Fi</Link></li>
                <li><Link to="/genre/Horror">Horror</Link></li>
              </ul>
            </div>
          </div>

          {/* Newsletter */}
          <div className="footer-newsletter">
            <h4 className="footer-title">Stay in the Loop</h4>
            <p>Subscribe to get the latest anime updates and news.</p>
            <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
              <div className="newsletter-input-group">
                <input type="email" placeholder="Email address" required />
                <button type="submit" className="newsletter-submit">
                  <Send size={18} />
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div className="footer-copyright">
            <p>© {currentYear} <span>Yugenime</span>. All rights reserved.</p>
          </div>
          <p className="footer-credit">
            Built with <Heart size={13} fill="var(--text-muted)" color="var(--text-muted)" /> by <a href="https://taddy-chi.vercel.app/" target="_blank" rel="noopener noreferrer">Taddy</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
