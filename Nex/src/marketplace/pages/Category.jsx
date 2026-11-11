import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { FaRegStar } from "react-icons/fa";
import { FaCartPlus } from "react-icons/fa6";
import { IoIosArrowForward, IoIosSearch } from "react-icons/io";
import {
  useShop,
  formatMoney,
  discountPercent,
} from "../context/ShopContext";
import QuickAddModal from "../components/QuickAddModal";
import useProducts from "../hooks/useProducts";
import { SHOP_CATEGORIES } from "../../constants/shop";
import "../styles/Category.css";

const slugify = (value = "") =>
  value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/* Canonical storefront categories — the same slugs the backend's
 * /shop/* endpoints filter by (see src/constants/shop.js). */
const DEALS_CATEGORY_SLUG = "deals-and-offers";

const categoryList = [
  ...SHOP_CATEGORIES,
  { slug: DEALS_CATEGORY_SLUG, name: "Deals & Offers" },
];

const activeCategoryFor = (slug) =>
  categoryList.find((category) => category.slug === slug) || null;

export default function Category() {
  const { categorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const { wishlistItems, moveToWishlist, removeFromWishlist } = useShop();

  const { products, status } = useProducts();

  const activeCategory = activeCategoryFor(categorySlug);
  const selectedCategory = activeCategory?.name || "All Categories";

  /* The header search (and shared links) land here with ?q=…; keep the
   * field and the URL in sync so searches are shareable. */
  const urlQuery = searchParams.get("q") || "";
  const [search, setSearch] = useState(urlQuery);

  useEffect(() => {
    setSearch(urlQuery);
  }, [urlQuery]);

  const updateSearch = (value) => {
    setSearch(value);

    const next = new URLSearchParams(searchParams);
    if (value.trim()) next.set("q", value.trim());
    else next.delete("q");
    setSearchParams(next, { replace: true });
  };

  const [sortBy, setSortBy] = useState("featured");
  const [sortOpen, setSortOpen] = useState(false);

  const sortDropdownRef = useRef(null);

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minimumRating, setMinimumRating] = useState(0);
  const [saleOnly, setSaleOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // QUICK ADD POPUP
  const [quickView, setQuickView] = useState(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target)
      ) {
        setSortOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setSortOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const sortOptions = [
    { value: "featured", label: "Featured" },
    { value: "price-low", label: "Price: low to high" },
    { value: "price-high", label: "Price: high to low" },
    { value: "rating", label: "Top rated" },
    { value: "discount", label: "Biggest discount" },
  ];

  const selectedSort =
    sortOptions.find((option) => option.value === sortBy) || sortOptions[0];

 
  const filteredProducts = useMemo(() => {
    let result = [...products];
    const category = activeCategoryFor(categorySlug);

    if (categorySlug === DEALS_CATEGORY_SLUG) {
      result = result.filter((product) => discountPercent(product) > 0);
    } else if (category) {
      result = result.filter(
        (product) =>
          (product.categorySlug || product.category) === category.slug ||
          product.category === category.name
      );
    }

    if (search.trim()) {
      const query = search.toLowerCase().trim();

      result = result.filter((product) =>
        [
          product.name,
          product.vendor || product.brand,
          product.category,
          product.subcategory,
          product.description,
        ].some((value) =>
          String(value || "").toLowerCase().includes(query)
        )
      );
    }

    
    if (minPrice !== "") {
      result = result.filter(
        (product) => Number(product.price) >= Number(minPrice)
      );
    }

    if (maxPrice !== "") {
      result = result.filter(
        (product) => Number(product.price) <= Number(maxPrice)
      );
    }

    if (minimumRating > 0) {
      result = result.filter(
        (product) => Number(product.rating || 0) >= minimumRating
      );
    }
   
    if (saleOnly) {
      result = result.filter((product) => discountPercent(product) > 0);
    }

    if (sortBy === "price-low") {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === "price-high") {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === "rating") {
      result.sort(
        (a, b) => Number(b.rating || 0) - Number(a.rating || 0)
      );
    } else if (sortBy === "discount") {
      result.sort((a, b) => discountPercent(b) - discountPercent(a));
    }

    return result;
  }, [
    products,
    categorySlug,
    search,
    minPrice,
    maxPrice,
    minimumRating,
    saleOnly,
    sortBy,
  ]);

  
  const isWishlisted = (id) =>
    wishlistItems.some((item) => item.id === id);

  const toggleWishlist = (product) => {
    if (isWishlisted(product.id)) {
      removeFromWishlist(product.id);
    } else {
      moveToWishlist(product);
    }
  };


  const resetFilters = () => {
    updateSearch("");
    setMinPrice("");
    setMaxPrice("");
    setMinimumRating(0);
    setSaleOnly(false);
    setSortBy("featured");
  };

  return (
    <main className="nx-category-page">
      <div className="nx-category-breadcrumb">
        <Link to="/home">Home</Link>
        <span>/</span>
        <span>{selectedCategory}</span>
      </div>

      <div className="nx-category-layout">
        <aside
          className={`nx-category-sidebar ${
            filtersOpen ? "nx-filters-open" : ""
          }`}
        >
          <div className="nx-filter-heading">
            <h2>Refine</h2>

            <button type="button" onClick={resetFilters}>
              Reset
            </button>
          </div>

          
          <label className="nx-filter-label" htmlFor="category-search">
            Search products
          </label>

          <input
            id="category-search"
            className="nx-filter-search"
            value={search}
            onChange={(event) => updateSearch(event.target.value)}
            placeholder="What are you looking for?"
          />

          <div className="nx-filter-group">
            <h3>Categories</h3>

            {categoryList.map((category) => (
              <Link
                key={category.slug}
                to={`/categories/${category.slug}`}
                className={`nx-category-filter-link ${
                  category.slug === categorySlug ? "active" : ""
                }`}
              >
                <span>{category.name}</span>
                <span>
                  <IoIosArrowForward />
                </span>
              </Link>
            ))}
          </div>

          <div className="nx-filter-group">
            <h3>Price range (&#8358;)</h3>

            <div className="nx-price-inputs">
              <label>
                <span>Minimum</span>

                <input
                  type="number"
                  min="0"
                  value={minPrice}
                  onChange={(event) => setMinPrice(event.target.value)}
                  placeholder="₦0"
                />
              </label>

              <label>
                <span>Maximum</span>

                <input
                  type="number"
                  min="0"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value)}
                  placeholder="No limit"
                />
              </label>
            </div>
          </div>

          <div className="nx-filter-group">
            <h3>Customer rating</h3>

            {[4, 3, 2, 1].map((rating) => (
              <label className="nx-filter-check" key={rating}>
                <input
                  type="radio"
                  name="minimum-rating"
                  checked={minimumRating === rating}
                  onChange={() => setMinimumRating(rating)}
                />

                <span>
                  {"★".repeat(rating)}
                  {"☆".repeat(5 - rating)}
                </span>

                <small>& up</small>
              </label>
            ))}

            <button
              className="nx-rating-reset"
              type="button"
              onClick={() => setMinimumRating(0)}
            >
              Any rating
            </button>
          </div>

          <div className="nx-filter-group">
            <label className="nx-filter-check">
              <input
                type="checkbox"
                checked={saleOnly}
                onChange={(event) => setSaleOnly(event.target.checked)}
              />

              <span>On sale only</span>
            </label>
          </div>

          <button
            className="nx-filter-done"
            type="button"
            onClick={() => setFiltersOpen(false)}
          >
            Show {filteredProducts.length} products
          </button>
        </aside>

        <section className="nx-category-results">
          <div className="nx-category-toolbar">
            <div>
              <p className="nx-results-count">
                Showing <strong>{filteredProducts.length}</strong> products
              </p>
            </div>

            <div className="nx-category-toolbar-actions">
              <button
                type="button"
                className="nx-mobile-filter-button"
                onClick={() => setFiltersOpen((open) => !open)}
              >
                Filters
              </button>

              <div className="nx-sort-control" ref={sortDropdownRef}>
                <div className="nx-sort-dropdown">
                  <button
                    type="button"
                    className={`nx-sort-trigger ${
                      sortOpen ? "is-open" : ""
                    }`}
                    aria-haspopup="listbox"
                    aria-expanded={sortOpen}
                    onClick={() => setSortOpen((open) => !open)}
                  >
                    <span className="nx-sort-label">Sort by</span>

                    <span>{selectedSort.label}</span>

                    <motion.span
                      className="nx-sort-chevron"
                      animate={{ rotate: sortOpen ? 180 : 0 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                    >
                      <ChevronDown size={17} />
                    </motion.span>
                  </button>

                  <AnimatePresence>
                    {sortOpen && (
                      <motion.div
                        className="nx-sort-menu"
                        role="listbox"
                        aria-label="Sort products"
                        initial={{ opacity: 0, y: -9, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        {sortOptions.map((option, index) => (
                          <motion.button
                            key={option.value}
                            type="button"
                            role="option"
                            aria-selected={sortBy === option.value}
                            className={`nx-sort-option ${
                              sortBy === option.value ? "is-selected" : ""
                            }`}
                            initial={{ opacity: 0, x: -14 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                              duration: 0.2,
                              delay: index * 0.035,
                              ease: "easeOut",
                            }}
                            onClick={() => {
                              setSortBy(option.value);
                              setSortOpen(false);
                            }}
                          >
                            <span>{option.label}</span>

                            {sortBy === option.value && <Check size={16} />}
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="nx-category-product-grid">
              {filteredProducts.map((product) => {
                const discount = discountPercent(product);
                const wishlisted = isWishlisted(product.id);

                return (
                  <article
                    className="nx-category-product"
                    key={product.id}
                  >
                    <Link
                      to={`/product/${product.id}`}
                      state={{ product }}
                      className="nx-category-product-link"
                    >
                      <div className="nx-category-product-image">
                        <img
                          src={product.image}
                          alt={product.name}
                          loading="lazy"
                        />

                        {discount > 0 && (
                          <span className="nx-category-discount">
                            {discount}% OFF
                          </span>
                        )}
                      </div>
                    </Link>

                    <div className="nx-category-product-details">
                      <h3 className="nx-category-product-name">
                        <Link
                          to={`/product/${product.id}`}
                          state={{ product }}
                        >
                          {product.name}
                        </Link>
                      </h3>

                      <p className="nx-category-product-description">
                        {product.description}
                      </p>

                      {product.vendor || product.brand ? (
                        <Link
                          to={`/vendor/${
                            product.vendorSlug ||
                            slugify(product.vendor || product.brand)
                          }`}
                          className="nx-category-product-vendor"
                          aria-label={`Visit ${
                            product.vendor || product.brand
                          } store`}
                        >
                          {product.vendor || product.brand}
                        </Link>
                      ) : (
                        <span className="nx-category-product-vendor">
                          NEX-IV
                        </span>
                      )}

                      {product.rating != null && (
                        <div className="nx-category-product-rating">
                          <FaRegStar />
                          <span>{Number(product.rating).toFixed(1)}</span>
                        </div>
                      )}

                      <div className="nx-category-product-bottom">
                        <div className="nx-category-price-group">
                          <strong>{formatMoney(product.price)}</strong>

                          {discount > 0 && (
                            <del>{formatMoney(product.originalPrice)}</del>
                          )}
                        </div>

                        <div className="nx-category-product-actions">
                          <button
                            type="button"
                            className={`nx-category-wishlist ${
                              wishlisted ? "is-wishlisted" : ""
                            }`}
                            aria-label={
                              wishlisted
                                ? `Remove ${product.name} from wishlist`
                                : `Add ${product.name} to wishlist`
                            }
                            onClick={() => toggleWishlist(product)}
                          >
                            {wishlisted ? "♥" : "♡"}
                          </button>

                          <button
                            type="button"
                            className="nx-category-cart"
                            onClick={() => setQuickView(product)}
                            aria-label={`Choose options and add ${product.name} to cart`}
                          >
                            <FaCartPlus />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : status === "loading" ? null : (
            <div className="nx-category-empty">
              <span>
                <IoIosSearch />
              </span>

              <h2>No products found</h2>

              <button type="button" onClick={resetFilters}>
                Clear filters
              </button>
            </div>
          )}
        </section>
      </div>

      
      {quickView && (
        <QuickAddModal
          product={quickView}
          onClose={() => setQuickView(null)}
        />
      )}
    </main>
  );
}