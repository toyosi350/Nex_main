import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { CiStar } from "react-icons/ci";
import { BsArrowUpRight } from "react-icons/bs";

import useProducts from "../hooks/useProducts";
import "../styles/PopularVendors.css";

const EASE = [0.22, 1, 0.36, 1];

const slugify = (value = "") =>
  value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const marqueeVariants = {
  hidden: {},
  show: {},
};

const cardVariants = {
  hidden: (index) => ({
    opacity: 0,
    x: index % 2 === 0 ? -160 : 160,
  }),
  show: (index) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 1.4,
      delay: Math.min(index, 8) * 0.1,
      ease: EASE,
    },
  }),
};

function VendorCard({ vendor, index }) {
  const reduceMotion = useReducedMotion();
  const to = `/vendor/${vendor.slug || slugify(vendor.name)}`;

  return (
    <motion.article
      className="pv-card"
      variants={reduceMotion ? undefined : cardVariants}
      custom={index}
    >
      <Link
        to={to}
        className="pv-image-link"
        aria-label={`Explore ${vendor.name}`}
      >
        <div className="pv-image">
          <img
            src={vendor.image}
            alt={`${vendor.name} store`}
            loading="lazy"
          />

          <span className="pv-category">
            {vendor.category}
          </span>
        </div>
      </Link>

      <div className="pv-content">
        <div className="pv-vendor-avatar">
          {vendor.initials}
        </div>

        <div className="pv-vendor-heading">
          <h3>{vendor.name}</h3>

          <span className="pv-rating">
            <CiStar aria-hidden="true" />
            {vendor.rating}
          </span>
        </div>

        <p>
          {vendor.productCount} products available
        </p>

        <Link to={to} className="pv-visit">
          Explore shop
          <span>
            <BsArrowUpRight />
          </span>
        </Link>
      </div>
    </motion.article>
  );
}

export default function PopularVendors() {
  const reduceMotion = useReducedMotion();
  const { products } = useProducts();

  const vendors = useMemo(() => {
    const vendorMap = new Map();

    products.forEach((product) => {
      const vendorName = product.vendor || product.brand;

      if (!vendorName) return;

      const key = product.vendorSlug || slugify(vendorName);

      if (!vendorMap.has(key)) {
        vendorMap.set(key, {
          name: vendorName,
          slug: product.vendorSlug || key,
          products: [],
        });
      }

      vendorMap.get(key).products.push(product);
    });

    return Array.from(vendorMap.values())
      .map((vendor) => {
        const vendorProducts = vendor.products;

        const ratings = vendorProducts
          .map((product) => Number(product.rating))
          .filter((rating) => Number.isFinite(rating) && rating > 0);

        const averageRating = ratings.length
          ? (
              ratings.reduce((total, rating) => total + rating, 0) /
              ratings.length
            ).toFixed(1)
          : "New";

        const firstProduct = vendorProducts[0];

        return {
          name: vendor.name,
          slug: vendor.slug,
          category: firstProduct.category || "Marketplace Store",
          image: firstProduct.image,
          rating: averageRating,
          productCount: vendorProducts.length,
          initials: vendor.name
            .split(" ")
            .slice(0, 2)
            .map((word) => word[0])
            .join("")
            .toUpperCase(),
        };
      })
      .sort((a, b) => {
        const ratingA = Number(a.rating) || 0;
        const ratingB = Number(b.rating) || 0;

        return ratingB - ratingA;
      });
  }, [products]);

  const scrollingVendors = [...vendors, ...vendors];

  if (!vendors.length) return null;

  return (
    <section className="pv-section">
      <div className="pv-heading">
        <h2>Popular Vendors</h2>
      </div>

      <motion.div
        className="pv-marquee"
        variants={marqueeVariants}
        initial={reduceMotion ? false : "hidden"}
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="pv-track">
          {scrollingVendors.map((vendor, index) => (
            <VendorCard
              key={`${slugify(vendor.name)}-${index}`}
              vendor={vendor}
              index={index}
            />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
