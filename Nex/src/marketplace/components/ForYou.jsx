import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import "../styles/ForYou.css";
import { FaCartPlus } from "react-icons/fa6";
import { TbLoader2 } from "react-icons/tb";
import { RiArrowDropDownLine } from "react-icons/ri";

import QuickAddModal from "../components/QuickAddModal";
import useProducts from "../hooks/useProducts";

const formatPrice = (price) => `₦${price.toLocaleString("en-NG")}`;
const CARDS_PER_ROW = 4;

function ForYou() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const { products } = useProducts();

  const forYouProducts = useMemo(
    () => products.slice(0, 20),
    [products]
  );

  const openProduct = (product) => {
    navigate(`/product/${product.id}`, {
      state: { product },
    });
  };

  const [visibleCount, setVisibleCount] = useState(20);
  const [newFromIndex, setNewFromIndex] = useState(20);
  const [loadMoreStatus, setLoadMoreStatus] = useState("idle");
  const loadMoreTimers = useRef([]);

  const [quickView, setQuickView] = useState(null);

  useEffect(() => {
    return () => {
      loadMoreTimers.current.forEach(clearTimeout);
    };
  }, []);

  const handleLoadMore = () => {
    if (loadMoreStatus === "pending") return;

    setLoadMoreStatus("pending");

    const loadingTimer = setTimeout(() => {
      setNewFromIndex(visibleCount);
      setVisibleCount((count) => count + 20);
      setLoadMoreStatus("success");

      const resetTimer = setTimeout(() => {
        setLoadMoreStatus("idle");
      }, 1200);

      loadMoreTimers.current.push(resetTimer);
    }, 700);

    loadMoreTimers.current.push(loadingTimer);
  };

  if (!forYouProducts.length) return null;

  const visibleProducts = Array.from({ length: visibleCount }, (_, index) => {
    const product = forYouProducts[index % forYouProducts.length];

    return {
      ...product,
      displayKey: `${product.id}-${index}`,
      layoutSlot: (index % 20) + 1,
      displayIndex: index,
    };
  });

  const productBatches = [];

  for (let i = 0; i < visibleProducts.length; i += 20) {
    productBatches.push(visibleProducts.slice(i, i + 20));
  }

  return (
    <section id="for-you" className="for-you">
      <div className="for-you-heading">
        <span className="for-you-heading-line" />

        <div className="for-you-heading-content">
          <p className="for-you-eyebrow">PICKED FOR YOU</p>
        </div>

        <span className="for-you-heading-line" />
      </div>

      <div className="for-you-grid-batches">
        {productBatches.map((batch, batchIndex) => (
          <div className="for-you-grid" key={batchIndex}>
            {batch.map((product) => {
              const isDiscounted =
                product.originalPrice &&
                product.originalPrice > product.price;

              const discountPercent = isDiscounted
                ? Math.round(
                    ((product.originalPrice - product.price) /
                      product.originalPrice) *
                      100
                  )
                : 0;
              const isNewBatch = product.displayIndex >= newFromIndex;

              return (
                <motion.article
                  className={`for-you-card ${
                    isNewBatch
                      ? "for-you-card-enter"
                      : ""
                  } ${
                    [1, 2, 3, 7, 8, 11, 13, 19].includes(product.layoutSlot)
                      ? `for-you-card--${product.layoutSlot}`
                      : ""
                  }`}
                  key={product.displayKey}
                  initial={
                    reduceMotion || isNewBatch
                      ? false
                      : { opacity: 0, y: -90 }
                  }
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.9,
                    delay: (product.displayIndex % CARDS_PER_ROW) * 0.12,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  onClick={() => openProduct(product)}
                >
                  <Link
                    to={`/product/${product.id}`}
                    state={{ product }}
                    className="for-you-product-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="for-you-image">
                      <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                      />

                      {isDiscounted && (
                        <span className="for-you-discount">
                          {discountPercent}% OFF
                        </span>
                      )}
                    </div>
                  </Link>

                  <div className="for-you-details">
                    <h3 className="for-you-name">
                      <Link
                        to={`/product/${product.id}`}
                        state={{ product }}
                        onClick={(event) => event.stopPropagation()}
                      >
                        {product.name}
                      </Link>
                    </h3>

                    <p className="for-you-description">
                      {product.description}
                    </p>

                    <span className="for-you-brand">
                      <Link
                        to={`/vendor/${encodeURIComponent(product.brand)}`}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <strong>{product.brand}</strong>
                      </Link>
                    </span>

                    <div className="for-you-price-row">
                      <div className="for-you-price-group">
                        <strong className="for-you-price">
                          {formatPrice(product.price)}
                        </strong>

                        {isDiscounted && (
                          <span className="for-you-original-price">
                            {formatPrice(product.originalPrice)}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        className="for-you-cart"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickView(product);
                        }}
                        aria-label={`Choose options and add ${product.name} to cart`}
                      >
                        <FaCartPlus className="cart-animation-icon" />
                      </button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        ))}
      </div>

      <div className="for-you-footer">
        <button
          type="button"
          className={`for-you-see-more for-you-see-more--${loadMoreStatus}`}
          onClick={handleLoadMore}
          disabled={loadMoreStatus === "pending"}
          aria-busy={loadMoreStatus === "pending"}
        >
          {loadMoreStatus === "pending" ? (
            <TbLoader2
              className="for-you-load-spinner"
              aria-label="Loading"
            />
          ) : (
            <>
              <RiArrowDropDownLine className="for-you-load-idle" />
              <span>Load More</span>
            </>
          )}
        </button>
      </div>

      {quickView && (
        <QuickAddModal
          product={quickView}
          onClose={() => setQuickView(null)}
        />
      )}
    </section>
  );
}

export default ForYou;