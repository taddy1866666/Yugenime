import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Instagram, Send, Heart } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <h2>YUGENIME</h2>
            <p>
              Experience anime like never before. High-quality streaming, 
              real-time updates, and a community-driven platform for all anime fans.
            </p>
            <div className="footer-socials" style={{ marginTop: '25px' }}>
              <a href="#" className="social-icon"><Twitter size={18} /></a>
              <a href="#" className="social-icon"><Instagram size={18} /></a>
              <a href="#" className="social-icon"><Github size={18} /></a>
            </div>
          </div>

          <div className="footer-links">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/top-anime">Top Anime</Link></li>
              <li><Link to="/search">Search</Link></li>
              <li><Link to="/account">My Watchlist</Link></li>
            </ul>
          </div>

          <div className="footer-links">
            <h4>Genres</h4>
            <ul>
              <li><Link to="/genre/Action">Action</Link></li>
              <li><Link to="/genre/Adventure">Adventure</Link></li>
              <li><Link to="/genre/Fantasy">Fantasy</Link></li>
              <li><Link to="/genre/Romance">Romance</Link></li>
            </ul>
          </div>

          <div className="footer-newsletter">
            <h4>Newsletter</h4>
            <p>Get the latest updates on new releases and features.</p>
            <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Email Address" />
              <button type="submit" className="btn btn-primary" style={{ minHeight: '44px', padding: '0 15px' }}>
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {currentYear} Yugenime. All rights reserved.</p>
          <p style={{ display: 'flex', alignJoin: 'center', gap: '5px' }}>
            Built with <Heart size={14} fill="var(--accent)" color="var(--accent)" /> by{' '}
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
