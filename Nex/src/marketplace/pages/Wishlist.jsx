import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaHeart,
  FaSliders,
  FaArrowDownWideShort,
  FaXmark,
} from "react-icons/fa6";
import { useShop, formatMoney } from "../context/ShopContext";
import ProductCard from "../components/ProductCard";
import "../styles/Wishlist.css";

function Wishlist({ embedded = false }) {
  const { wishlistItems, removeFromWishlist } = useShop();
  const navigate = useNavigate();

  const [stockFilter, setStockFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const categories = useMemo(() => {
    return [
      ...new Set(
        wishlistItems
          .map((item) => item.category)
          .filter(Boolean)
      ),
    ].sort();
  }, [wishlistItems]);

  const filteredItems = useMemo(() => {
    let result = [...wishlistItems];

    if (stockFilter === "in-stock") {
      result = result.filter(
        (item) => Number(item.stockLeft ?? item.stock ?? 0) > 5
      );
    }

    if (stockFilter === "low-stock") {
      result = result.filter((item) => {
        const stock = Number(item.stockLeft ?? item.stock ?? 0);
        return stock > 0 && stock <= 5;
      });
    }

    if (stockFilter === "out-of-stock") {
      result = result.filter(
        (item) => Number(item.stockLeft ?? item.stock ?? 0) <= 0
      );
    }

    if (categoryFilter !== "all") {
      result = result.filter(
        (item) => item.category === categoryFilter
      );
    }

    if (minPrice !== "") {
      result = result.filter(
        (item) => Number(item.price) >= Number(minPrice)
      );
    }

    if (maxPrice !== "") {
      result = result.filter(
        (item) => Number(item.price) <= Number(maxPrice)
      );
    }

    if (sortBy === "recent") {
      result.sort(
        (a, b) =>
          new Date(b.addedAt || 0) - new Date(a.addedAt || 0)
      );
    }

    if (sortBy === "price-low") {
      result.sort((a, b) => a.price - b.price);
    }

    if (sortBy === "price-high") {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [
    wishlistItems,
    stockFilter,
    categoryFilter,
    sortBy,
    minPrice,
    maxPrice,
  ]);

  const clearFilters = () => {
    setStockFilter("all");
    setCategoryFilter("all");
    setSortBy("recent");
    setMinPrice("");
    setMaxPrice("");
  };

  const Wrapper = embedded ? "div" : "main";

  const findSimilar = (product) => {
    const category = product.category;

    if (category) {
      const slug = category
        .toLowerCase()
        .trim()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      navigate(`/categories/${slug}`);
    } else {
      navigate("/home#for-you");
    }
  };

  return (
    <Wrapper className={`nx-wishlist-page ${embedded ? "is-embedded" : ""}`}>
      <div className="nx-wishlist-container">
        {!embedded && (
        <div className="nx-wishlist-heading">
          <div>
            <span className="nx-wishlist-eyebrow">
              YOUR PERSONAL COLLECTION
            </span>

            <h1>
              My Wishlist
              <span>{wishlistItems.length}</span>
            </h1>
          </div>

          <div className="nx-wishlist-heading-icon">
            <FaHeart />
          </div>
        </div>
        )}

        

        {wishlistItems.length > 0 && (
          <>
            <div className="nx-wishlist-toolbar">
              <div className="nx-wishlist-results">
                <strong>{filteredItems.length} items</strong>
                <span>in your collection</span>
              </div>

              <div className="nx-wishlist-toolbar-actions">
                <button
                  type="button"
                  className="nx-wishlist-filter-toggle"
                  onClick={() => setFiltersOpen((open) => !open)}
                  aria-expanded={filtersOpen}
                >
                  <FaSliders />
                  Filters
                </button>

                <label className="nx-wishlist-sort">
                  <FaArrowDownWideShort />
                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                    aria-label="Sort wishlist"
                  >
                    <option value="recent">Recently added</option>
                    <option value="price-low">Price: low to high</option>
                    <option value="price-high">Price: high to low</option>
                  </select>
                </label>
              </div>
            </div>

            <div
              className={`nx-wishlist-filter-panel ${
                filtersOpen ? "is-open" : ""
              }`}
            >
              <div className="nx-wishlist-filter-group">
                <label htmlFor="wishlist-stock">Availability</label>
                <select
                  id="wishlist-stock"
                  value={stockFilter}
                  onChange={(event) => setStockFilter(event.target.value)}
                >
                  <option value="all">All availability</option>
                  <option value="in-stock">In stock</option>
                  <option value="low-stock">Low in stock (1–5)</option>
                  <option value="out-of-stock">Out of stock</option>
                </select>
              </div>

              <div className="nx-wishlist-filter-group nx-wishlist-price-filter">
                <label>Price range</label>

                <div>
                  <input
                    type="number"
                    min="0"
                    placeholder="Min ₦"
                    value={minPrice}
                    onChange={(event) => setMinPrice(event.target.value)}
                  />

                  <span>to</span>

                  <input
                    type="number"
                    min="0"
                    placeholder="Max ₦"
                    value={maxPrice}
                    onChange={(event) => setMaxPrice(event.target.value)}
                  />
                </div>
              </div>

              <button
                type="button"
                className="nx-wishlist-clear"
                onClick={clearFilters}
              >
                <FaXmark /> Clear filters
              </button>
            </div>

            {filteredItems.length > 0 ? (
              <div className="nx-wishlist-grid">
                {filteredItems.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    showHoverActions
                    onDelete={() => removeFromWishlist(product.id)}
                    onFindSimilar={() => findSimilar(product)}
                  />
                ))}
              </div>
            ) : (
              <div className="nx-wishlist-no-results">
                <FaSliders />
                <h2>No products match these filters</h2>
                <p>Try adjusting your filters to see more saved items.</p>
                <button type="button" onClick={clearFilters}>
                  Clear filters
                </button>
              </div>
            )}
          </>
        )}

        {wishlistItems.length === 0 && (
          <div className="nx-wishlist-empty">
            <div className="nx-wishlist-empty-icon">
              <FaHeart />
            </div>

            <span>NOTHING SAVED — YET</span>

            <h2>Your wishlist is waiting for its first find.</h2>

            <p>
              When you find something you love, tap the heart
              icon and it will be saved here.
            </p>

            <button
              type="button"
              onClick={() => navigate("/home")}
            >
              Explore products
            </button>
          </div>
        )}
      </div>
    </Wrapper>
  );
}

export default Wishlist