import { Link } from "react-router-dom";
import { FaInstagram, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import "../styles/Footer.css";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-socials">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                <FaInstagram />
              </a>
              <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="X (Twitter)">
                <FaXTwitter />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube">
                <FaYoutube />
              </a>
            </div>

            
            <address className="footer-address">
              Lagos,
              <br />
              Nigeria
            </address>

            <a className="footer-contact" href="mailto:support@nex-iv.com">
              support@nex-iv.com
            </a>

            <a className="footer-contact" href="tel:+2340000000000">
              (+234) 000 000 0000
            </a>
          </div>

          <nav className="footer-column" aria-label="Quick links">
            <h3>Quick Links</h3>
            <ul>
              <li><Link to="/home">Home</Link></li>
              <li><Link to="/categories">All Categories</Link></li>
              <li><Link to="/categories/deals-and-offers">Sale</Link></li>
              <li><Link to="/account/wishlist">Wishlist</Link></li>
            </ul>
          </nav>

          <nav className="footer-column" aria-label="Company">
            <h3>Company</h3>
            <ul>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/faq">FAQs</Link></li>
              <li><Link to="/careers">Careers</Link></li>
              <li><Link to="/sell-on-nex-iv">Sell on Nex-IV</Link></li>
            </ul>
          </nav>

          <nav className="footer-column" aria-label="Customer service">
            <h3>Customer Service</h3>
            <ul>
              <li><Link to="/faq#returns">Refund & Return Policy</Link></li>
              <li><Link to="/faq#delivery">Shipping Policy</Link></li>
              <li><Link to="/faq">Help Center</Link></li>
            </ul>
          </nav>
        </div>

        
        <div className="footer-divider">
          <span className="footer-line" />
        </div>

       
        <div className="footer-bottom">
          <p className="footer-tagline">
            Shop smarter. Live better. Discover trusted sellers and great
            finds, all in one marketplace.
            <span>&copy; {new Date().getFullYear()} Nex-IV. All rights reserved.</span>
          </p>

          <div className="footer-legal">
            <Link to="">Terms & Conditions</Link>
            <Link to="">Privacy Policy</Link>
          </div>
        </div>
      </div>

      
      <div className="footer-wordmark" aria-hidden="true">
        NEX-IV.
      </div>
    </footer>
  );
}

export default Footer;