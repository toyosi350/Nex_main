import { FaArrowRight} from "react-icons/fa";
import "../styles/MarketplaceHero.css";

const slides = [
  {
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=85",
    label: "FASHION & STYLE",
  },
  {
    image:
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1600&q=85",
    label: "YOUR NEXT FAVOURITE",
  },
  {
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1600&q=85",
    label: "EVERYDAY ESSENTIALS",
  },
  {
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1600&q=85",
    label: "FRESH FINDS",
  },
  {
    image:
      "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1600&q=85",
    label: "BEAUTY & MORE",
  },
];

export default function MarketplaceHero() {

  return (
    <section className="marketplace-hero">
      <div className="hero-image-track" aria-hidden="true">
        {[...slides, ...slides].map((slide, index) => (
          <div className="hero-image-tile" key={`${slide.label}-${index}`}>
            <img src={slide.image} alt="" />
          </div>
        ))}
      </div>

      <div className="marketplace-hero-overlay" />

      <div className="marketplace-hero-content">
        <h1>
          Discover More.
          <br />
          <span>Shop Smarter.</span>
        </h1>

        <p className="marketplace-hero-description">
          Explore products you love, discover new vendors, and find
          everything you need in one place. Your next great find starts here.
        </p>

        <div className="marketplace-hero-actions">
          <a href="#deals-and-offers" className="hero-primary-button">
            Explore the Marketplace
            <FaArrowRight />
          </a>
        </div>
      </div>
    </section>
  );
}
