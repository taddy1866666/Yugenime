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

          {/* Brand */}
          <div className="footer-brand">
            <h2>YUGENIME</h2>
            <p>
              Experience anime like never before. Real-time updates and a
              community-driven platform for all anime fans.
            </p>
            <div className="footer-socials">
              <a href="https://taddy-chi.vercel.app/" target="_blank" rel="noopener noreferrer" className="social-icon" title="Developer Portfolio">
                <Globe size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-links">
            <h4>Navigate</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/top-anime">Top 100</Link></li>
              <li><Link to="/search">Search</Link></li>
              <li><Link to="/account">My Watchlist</Link></li>
            </ul>
          </div>

          {/* Genres */}
          <div className="footer-links">
            <h4>Genres</h4>
            <ul>
              <li><Link to="/genre/Action">Action</Link></li>
              <li><Link to="/genre/Adventure">Adventure</Link></li>
              <li><Link to="/genre/Fantasy">Fantasy</Link></li>
              <li><Link to="/genre/Romance">Romance</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="footer-newsletter">
            <h4>Stay Updated</h4>
            <p>Get notified about new releases and features.</p>
            <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Your email address" />
              <button type="submit" className="newsletter-btn">
                <Send size={16} />
              </button>
            </form>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p>© {currentYear} Yugenime. All rights reserved.</p>
          <p className="footer-credit">
            Built with <Heart size={13} fill="var(--accent)" color="var(--accent)" /> by{' '}
            <a href="https://taddy-chi.vercel.app/" target="_blank" rel="noopener noreferrer" className="dev-link">
              Taddy
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
