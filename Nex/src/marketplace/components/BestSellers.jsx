import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { GoArrowUpRight } from "react-icons/go";
import { Link } from "react-router-dom";
import useProducts from "../hooks/useProducts";
import "../styles/BestSellers.css";

const formatPrice = (price) =>
  `₦${Number(price || 0).toLocaleString("en-NG")}`;

const getDiscount = (product) => {
  const oldPrice = Number(product.originalPrice || 0);
  const price = Number(product.price || 0);

  if (!oldPrice || oldPrice <= price) return 0;

  return Math.round(((oldPrice - price) / oldPrice) * 100);
};

function getProductTag(product, index) {
  const discount = getDiscount(product);

  if (discount >= 20) return "GREAT DEAL";
  if (index === 0) return "BESTSELLER";
  if (index === 1) return "POPULAR";

  return "TRENDING";
}

function getCardPosition(index, currentIndex, total) {
  const offset = (index - currentIndex + total) % total;

  if (offset === 0) return "center";
  if (offset === 1) return "right-1";
  if (offset === 2) return "right-2";
  if (offset === total - 1) return "left-1";
  if (offset === total - 2) return "left-2";

  return "hidden";
}

function ProductCard({ product, position, onSelect, index }) {
  const isCenter = position === "center";
  const oldPrice = Number(product.originalPrice || 0);
  const discount = getDiscount(product);

  return (
    <article
      className={`bs-cover-card bs-position-${position}`}
      onClick={() => {
        if (!isCenter) onSelect();
      }}
      aria-label={`${product.name}, ${formatPrice(product.price)}`}
      aria-current={isCenter ? "true" : undefined}
    >
      <div className="bs-cover-image">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
        />

        <div className="bs-cover-overlay" />

        <span className="bs-product-tag">
          {getProductTag(product, index)}
        </span>

        <div className="bs-cover-content">
          <p className="bs-product-brand">
            {product.vendor || product.brand || "NEX-IV"}
          </p>

          <h3>{product.name}</h3>

          <div className="bs-product-prices">
            <strong>{formatPrice(product.price)}</strong>

            {oldPrice > Number(product.price) && (
              <del>{formatPrice(oldPrice)}</del>
            )}
          </div>

          {discount > 0 && (
            <div className="bs-product-discount">
              Save {discount}%
            </div>
          )}

          <Link
            to={`/product/${product.id}`}
            state={{ product }}
            className="bs-product-cta"
            onClick={(event) => event.stopPropagation()}
          >
            Discover piece
            <span>
              <GoArrowUpRight />
            </span>
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function BestSellers() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef(0);

  const { products: productsData } = useProducts();

  const products = useMemo(() => {
    return [...productsData]
      .filter((product) => product.image && product.price != null)
      .sort((a, b) => {
        const ratingA = Number(a.rating) || 0;
        const ratingB = Number(b.rating) || 0;

        return ratingB - ratingA;
      })
      .slice(0, 6);
  }, [productsData]);

  const total = products.length;

  const nextSlide = useCallback(() => {
    if (total <= 1) return;

    setCurrentIndex((previous) => (previous + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    if (total <= 1) return;

    setCurrentIndex((previous) => (previous - 1 + total) % total);
  }, [total]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  useEffect(() => {
    if (isHovered || total <= 1) return undefined;

    const interval = window.setInterval(nextSlide, 2000);

    return () => window.clearInterval(interval);
  }, [isHovered, nextSlide, total]);

  useEffect(() => {
    if (currentIndex >= total) {
      setCurrentIndex(0);
    }
  }, [currentIndex, total]);

  const handleTouchStart = (event) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = (event) => {
    const difference =
      event.changedTouches[0].clientX - touchStartX.current;

    if (Math.abs(difference) < 45) return;

    if (difference < 0) {
      nextSlide();
    } else {
      prevSlide();
    }
  };

  if (!total) return null;

  return (
    <section className="bs-section">
      <div className="bs-heading">
        <div className="sub-heading">
          <h2>Best Sellers</h2>
          <p>The pieces everyone has their eyes on.</p>
        </div>

        <div className="bs-carousel-count">
          <span>
            {String(currentIndex + 1).padStart(2, "0")}
          </span>

          <span className="bs-count-divider">/</span>

          {String(total).padStart(2, "0")}
        </div>
      </div>

      <div
        className="bs-cover-stage"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="bs-cover-ambient" />

        <div className="bs-cover-track">
          {products.map((product, index) => {
            const position = getCardPosition(
              index,
              currentIndex,
              total
            );

            return (
              <ProductCard
                key={product.id}
                product={product}
                position={position}
                index={index}
                onSelect={() => goToSlide(index)}
              />
            );
          })}
        </div>

        {total > 1 && (
          <>
            <button
              type="button"
              className="bs-carousel-arrow bs-arrow-left"
              onClick={prevSlide}
              aria-label="Previous product"
            >
              <FaChevronLeft />
            </button>

            <button
              type="button"
              className="bs-carousel-arrow bs-arrow-right"
              onClick={nextSlide}
              aria-label="Next product"
            >
              <FaChevronRight />
            </button>
          </>
        )}
      </div>

      <div className="bs-carousel-footer">
        <p>CURATED FOR YOUR NEXT FAVOURITE</p>

        <div className="bs-pagination">
          {products.map((product, index) => (
            <button
              key={product.id}
              type="button"
              className={
                index === currentIndex
                  ? "bs-dot bs-dot-active"
                  : "bs-dot"
              }
              onClick={() => goToSlide(index)}
              aria-label={`Show ${product.name}`}
              aria-current={
                index === currentIndex ? "true" : undefined
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}
