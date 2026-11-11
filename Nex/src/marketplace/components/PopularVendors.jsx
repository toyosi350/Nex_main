import { useMemo } from "react";
import { Link } from "react-router-dom";
import { CiStar } from "react-icons/ci";
import { BsArrowUpRight } from "react-icons/bs";

import useProducts from "../hooks/useProducts";
import "../styles/PopularVendors.css";

const slugify = (value = "") =>
  value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function VendorCard({ vendor }) {
  const to = `/vendor/${vendor.slug || slugify(vendor.name)}`;

  return (
    <article className="pv-card">
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
    </article>
  );
}

export default function PopularVendors() {
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

      <div className="pv-marquee">
        <div className="pv-track">
          {scrollingVendors.map((vendor, index) => (
            <VendorCard
              key={`${slugify(vendor.name)}-${index}`}
              vendor={vendor}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
