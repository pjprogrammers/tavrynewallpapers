import Link from 'next/link';
import {
  Github,
  Twitter,
  Instagram,
  Heart,
  Download,
} from 'lucide-react';
import { categories } from '../lib/wallpapers';

const Footer = () => {
  const popularCategories = categories.slice(0, 6);
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <Link href="/" className="footer-logo">
              <span className="footer-logo-text">
                <span className="logo-primary">Tavryne</span>
                <span className="logo-secondary">Wallpapers</span>
              </span>
            </Link>
            <p className="footer-description">
              Your ultimate source for high-quality wallpapers. Download and share stunning wallpapers for any device.
            </p>
            <div className="social-links">
              <a href="https://twitter.com/tavrynewallpapers" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Twitter">
                <Twitter size={18} />
              </a>
              <a href="https://instagram.com/tavrynewallpapers" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Instagram">
                <Instagram size={18} />
              </a>
              <a href="https://github.com/tavryne" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Github">
                <Github size={18} />
              </a>
            </div>
          </div>
          
          <div className="footer-links-section">
            <div className="footer-links-column">
              <h3 className="footer-column-title">Categories</h3>
              <ul className="footer-links">
                {popularCategories.map(category => (
                  <li key={category.id}>
                    <Link href={`/categories/${category.id}`} className="footer-link">
                      {category.name}
                    </Link>
                  </li>
                ))}
                <li className="view-all-link">
                  <Link href="/categories/all" className="footer-link-highlight">
                    View All Categories
                  </Link>
                </li>
              </ul>
            </div>
            
            <div className="footer-links-column">
              <h3 className="footer-column-title">Explore</h3>
              <ul className="footer-links">
                <li>
                  <Link href="/" className="footer-link">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/featured" className="footer-link">
                    Featured Wallpapers
                  </Link>
                </li>
                <li>
                  <Link href="/all" className="footer-link">
                    All Wallpapers
                  </Link>
                </li>
                <li>
                  <Link href="/recent" className="footer-link">
                    Recent
                  </Link>
                </li>
                <li>
                  <Link href="/edits" className="footer-link">
                    Recent Edits
                  </Link>
                </li>
                <li>
                  <Link href="/categories/all" className="footer-link">
                    Categories
                  </Link>
                </li>
              </ul>
            </div>
            
            <div className="footer-links-column">
              <h3 className="footer-column-title">Resolutions</h3>
              <ul className="footer-links">
                <li>
                  <Link href="/tag/4k" className="footer-link">
                    4K Wallpapers
                  </Link>
                </li>
                <li>
                  <Link href="/tag/5k" className="footer-link">
                    5K Wallpapers
                  </Link>
                </li>
                <li>
                  <Link href="/tag/8k" className="footer-link">
                    8K Wallpapers
                  </Link>
                </li>
                <li>
                  <Link href="/tag/hd" className="footer-link">
                    HD Wallpapers
                  </Link>
                </li>
              </ul>
            </div>
            
            <div className="footer-links-column">
              <h3 className="footer-column-title">Support</h3>
              <ul className="footer-links">
                <li>
                  <a href="mailto:contact@tavrynewallpapers.vercel.app" className="footer-link">
                    Contact Us
                  </a>
                </li>
                <li>
                  <Link href="/edits" className="footer-link">
                    Recent Edits
                  </Link>
                </li>
              </ul>
              
              <div className="footer-newsletter">
                <Link href="/categories/all" className="footer-button">
                  <Download size={14} className="footer-button-icon" />
                  <span>Browse Wallpapers</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p className="copyright">
            &copy; {currentYear} Tavryne Wallpapers. All rights reserved.
          </p>
          <p className="attribution">
            Designed with <Heart size={14} className="heart-icon" fill="var(--heart)" /> by Tavryne
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 