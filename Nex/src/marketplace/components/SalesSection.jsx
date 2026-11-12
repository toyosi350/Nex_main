import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import useProducts from "../hooks/useProducts";
import "../styles/SalesSection.css";
import { discountPercent, formatMoney } from "../context/ShopContext";

const EASE = [0.22, 1, 0.36, 1];

export default function SalesSection() {
  const [activeIndex, setActiveIndex] = useState(null);
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const { products } = useProducts();

  const openProduct = (product) => {
    navigate(`/product/${product.id}`, { state: { product } });
  };

  const saleProducts = useMemo(() => {
    return products
      .filter((product) => discountPercent(product) > 0)
      .sort(
        (a, b) => discountPercent(b) - discountPercent(a)
      )
      .slice(0, 6);
  }, [products]);

  if (!saleProducts.length) return null;

  return (
    <section id="deals-and-offers" className="nx-sales-gallery">
      <div className="nx-sales-gallery-heading">
        <span className="nx-sales-eyebrow">NEX-IV / DEALS & OFFERS</span>
      </div>

      <div className="nx-sales-gallery-track">
        {saleProducts.map((product, index) => {
          const isActive = activeIndex === index;
          const discount = discountPercent(product);

          return (
            <motion.article
              key={product.id}
              className={`nx-sales-gallery-item ${
                isActive ? "is-active" : ""
              }`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              onClick={() => openProduct(product)}
              initial={
                reduceMotion
                  ? false
                  : { opacity: 0, x: index % 2 === 0 ? -160 : 160 }
              }
              whileInView={{
                opacity: 1,
                x: 0,
                transition: {
                  duration: 1.4,
                  delay: index * 0.1,
                  ease: EASE,
                },
              }}
              viewport={{ once: true, amount: 0.2 }}
              animate={{
                flex: isActive ? 3 : 1,
              }}
              transition={{
                duration: 0.55,
                ease: EASE,
              }}
            >
              <img
                src={product.image}
                alt={product.name}
                loading="lazy"
              />

              <div className="nx-sales-gallery-shade" />

              <span className="nx-sales-gallery-discount">
                -{discount}%
              </span>

              <motion.div
                className="nx-sales-gallery-info"
                animate={{
                  opacity: isActive ? 1 : 0,
                  y: isActive ? 0 : 15,
                }}
                transition={{ duration: 0.3 }}
              >
                <span className="nx-sales-gallery-brand">
                  {product.brand || product.vendor || "NEX-IV"}
                </span>

                <h3>{product.name}</h3>

                <div className="nx-sales-gallery-prices">
                  <strong>{formatMoney(product.price)}</strong>
                  <del>{formatMoney(product.originalPrice)}</del>
                </div>

                <Link
                  to={`/product/${product.id}`}
                  state={{ product }}
                  className="nx-sales-explore-link"
                  onClick={(event) => event.stopPropagation()}
                >
                  Explore Item
                  <ArrowUpRight size={17} />
                </Link>
              </motion.div>

              {!isActive && (
                <span className="nx-sales-gallery-index">
                  0{index + 1}
                </span>
              )}
            </motion.article>
          );
        })}
      </div>

      <div className="nx-sales-gallery-footer">
        <span>LIMITED-TIME FINDS</span>

        <Link to="/categories/deals-and-offers">
          Explore all deals
          <ArrowUpRight size={17} />
        </Link>
      </div>
    </section>
  );
}
