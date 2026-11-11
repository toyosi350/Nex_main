import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import {
  FaCheck,
  FaHeart,
  FaMinus,
  FaPlus,
  FaRegHeart,
  FaRuler,
  FaStar,
  FaXmark,
} from "react-icons/fa6";
import { TbLoader2 } from "react-icons/tb";
import { useShop } from "../context/ShopContext";
import "../styles/Quickaddmodal.css";

const OPTION_CONFIGS = {
  fashion: {
    label: "Size",
    options: ["XS", "S", "M", "L", "XL"],
    guide: {
      title: "Clothing size guide",
      columns: ["Size", "Bust (cm)", "Waist (cm)", "Hip (cm)"],
      rows: [
        ["XS", "78–82", "60–64", "84–88"],
        ["S", "82–86", "64–68", "88–92"],
        ["M", "86–92", "68–74", "92–98"],
        ["L", "92–98", "74–80", "98–104"],
        ["XL", "98–104", "80–86", "104–110"],
      ],
    },
  },
  shoes: {
    label: "Shoe size (EU)",
    options: ["37", "38", "39", "40", "41", "42", "43"],
    guide: {
      title: "Shoe size guide",
      columns: ["EU", "UK", "US (W)", "Foot length (cm)"],
      rows: [
        ["37", "4", "6", "23.5"],
        ["38", "5", "7", "24.0"],
        ["39", "6", "8", "24.8"],
        ["40", "7", "9", "25.4"],
        ["41", "8", "10", "26.0"],
        ["42", "9", "11", "26.7"],
        ["43", "10", "12", "27.3"],
      ],
    },
  },
  electronics: { label: "Storage", options: ["64GB", "128GB", "256GB", "512GB"] },
  phones: { label: "Storage", options: ["64GB", "128GB", "256GB", "512GB"] },
  beauty: { label: "Volume", options: ["30ml", "50ml", "100ml", "200ml"] },
  groceries: { label: "Pack size", options: ["500g", "1kg", "2kg", "5kg"] },
  furniture: {
    label: "Dimensions",
    options: ["Small", "Medium", "Large"],
    guide: {
      title: "Dimensions guide",
      columns: ["Option", "Width (cm)", "Depth (cm)", "Height (cm)"],
      rows: [
        ["Small", "80", "45", "75"],
        ["Medium", "120", "55", "78"],
        ["Large", "160", "65", "80"],
      ],
    },
  },
  home: { label: "Pack", options: ["Single", "Set of 2", "Set of 4"] },
};

const OPTION_MATCHERS = [
  ["shoes", /shoe|sneaker|footwear|boot|sandal|heel|slipper|loafer|trainer/],
  ["phones", /phone|smartphone|iphone|tablet/],
  ["electronics", /electronic|laptop|gadget|computer|camera|headphone/],
  ["beauty", /beauty|skincare|perfume|makeup|cosmetic|fragrance/],
  ["groceries", /grocery|groceries|food|rice|snack/],
  ["furniture", /furniture|sofa|chair|table|desk|bed|shelf|wardrobe/],
  ["home", /home|kitchen|decor|bedding|towel|cookware/],
  ["fashion", /fashion|cloth|apparel|wear|dress|shirt|top|trouser|jean|skirt|jacket|hoodie|women|men|ladies|kids/],
];

const getOptionConfig = (product) => {
  if (product.hasSizes === false) return null;

  if (product.options?.length) {
    return {
      label: product.optionLabel || "Option",
      options: product.options,
      guide: product.optionGuide,
    };
  }

  if (product.sizes?.length) {
    return {
      label: "Size",
      options: product.sizes,
      guide: OPTION_CONFIGS.fashion.guide,
    };
  }

  const text = [product.category, product.subcategory, product.name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const match = OPTION_MATCHERS.find(([, pattern]) => pattern.test(text));
  return match ? OPTION_CONFIGS[match[0]] : null;
};

const DEFAULT_COLORS = [
  { name: "Black", hex: "#242424" },
  { name: "Cream", hex: "#F2E8D5" },
  { name: "Blue", hex: "#3E6FA3" },
  { name: "Olive", hex: "#6B7A4B" },
  { name: "Terracotta", hex: "#B5654A" },
  { name: "Rose", hex: "#D9A0A0" },
];

const NO_COLOR_CATEGORIES = ["groceries", "beauty"];

const getColorOptions = (product) => {
  if (product.hasColors === false) return [];

  if (product.colors?.length) {
    return product.colors.map((color) =>
      typeof color === "string" ? { name: color, hex: color } : color
    );
  }

  const key = String(product.category || "").toLowerCase();
  if (NO_COLOR_CATEGORIES.includes(key)) return [];

  return DEFAULT_COLORS;
};

const isLightColor = (hex = "") => {
  const value = String(hex).replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(value)) return false;

  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);

  return (r * 299 + g * 587 + b * 114) / 1000 > 170;
};

const DEMO_RATINGS = [
  { rating: 5 },
  { rating: 4 },
  { rating: 5 },
  { rating: 4 },
];

const formatPrice = (price) =>
  `₦${Number(price || 0).toLocaleString("en-NG")}`;

function Stars({ rating = 0 }) {
  return (
    <span className="nx-qv-stars" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <FaStar
          key={index}
          className={index < Math.round(Number(rating)) ? "is-filled" : ""}
        />
      ))}
    </span>
  );
}

export default function QuickAddModal({ product: rawProduct, onClose }) {
  const navigate = useNavigate();

  const { displayKey, layoutSlot, displayIndex, ...product } = rawProduct;

  const { addToCart, addToWishlist, removeFromWishlist, isWishlisted } =
    useShop();

  const images = product.images?.length
    ? product.images
    : [product.image].filter(Boolean);

  const optionConfig = useMemo(() => getOptionConfig(product), [product]);
  const colorOptions = useMemo(() => getColorOptions(product), [product]);

  const reviews = useMemo(
    () =>
      Array.isArray(product.reviews) && product.reviews.length
        ? product.reviews
        : DEMO_RATINGS,
    [product]
  );

  const averageRating = useMemo(
    () =>
      reviews.length
        ? (
            reviews.reduce((total, r) => total + Number(r.rating || 0), 0) /
            reviews.length
          ).toFixed(1)
        : "0.0",
    [reviews]
  );

  const [activeImage, setActiveImage] = useState(0);
  const [selectedOption, setSelectedOption] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");
  const [wishlistPending, setWishlistPending] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const wishlisted = isWishlisted?.(product.id);
  const maxQty = product.stock || 99;

  const discounted =
    product.originalPrice && product.originalPrice > product.price;
  const discount = discounted
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0;

  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== "Escape") return;

      if (guideOpen) setGuideOpen(false);
      else onClose();
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [guideOpen, onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);


  const goToReviews = () => {
    onClose();
    navigate(`/product/${product.id}`, {
      state: { product: rawProduct, scrollToReviews: true },
    });
  };

  const handleAdd = async () => {
    if (adding) return;

    if (optionConfig && !selectedOption) {
      return setError(`Please select a ${optionConfig.label.toLowerCase()}`);
    }
    if (colorOptions.length > 0 && !selectedColor) {
      return setError("Please select a colour");
    }
    if (product.stock === 0) {
      return setError("This product is currently out of stock");
    }

    setError("");
    setAdding(true);

    try {
      await addToCart({
        ...product,
        image: images[activeImage] || product.image,
        vendor: product.brand || product.vendor,
        quantity,
        size: selectedOption || undefined,
        sizeLabel: optionConfig?.label,
        color: selectedColor || undefined,
        stockLeft: product.stock,
      });

      setAdded(true);
      window.dispatchEvent(new Event("nexiv-cart-open"));
      window.setTimeout(onClose, 700);
    } catch (err) {
      console.error("Could not add product to cart:", err);
      setError("Could not add this item. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  const toggleWishlist = async () => {
    if (wishlistPending) return;
    setWishlistPending(true);

    try {
      if (wishlisted) {
        await removeFromWishlist(product.id);
      } else {
        await addToWishlist({
          ...product,
          vendor: product.vendor ?? product.brand,
          stockLeft: product.stockLeft ?? product.stock,
        });
      }
    } catch (error) {
      console.error("Could not update wishlist:", error);
      setError("Could not update wishlist. Please try again.");
    } finally {
      setWishlistPending(false);
    }
  };

  return createPortal(
    <div
      className="nx-qv-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
      onClick={onClose}
    >
      <div className="nx-qv-modal" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="nx-qv-close"
          onClick={onClose}
          aria-label="Close"
        >
          <FaXmark />
        </button>

        <div className="nx-qv-gallery">
          {images.length > 1 && (
            <div className="nx-qv-thumbs">
              {images.map((image, index) => (
                <button
                  type="button"
                  key={`${image}-${index}`}
                  className={activeImage === index ? "is-active" : ""}
                  onClick={() => setActiveImage(index)}
                  aria-label={`View image ${index + 1}`}
                >
                  <img src={image} alt="" />
                </button>
              ))}
            </div>
          )}

          <div className="nx-qv-image">
            <img src={images[activeImage]} alt={product.name} />
            {discount > 0 && (
              <span className="nx-qv-badge">-{discount}%</span>
            )}
          </div>
        </div>

        <div className="nx-qv-info">
          <h2 className="nx-qv-title">{product.name}</h2>

          <div className="nx-qv-rating">
            <Stars rating={averageRating} />
            <strong>{averageRating}</strong>

            <span
              className="nx-qv-rating-link"
              role="link"
              tabIndex={0}
              onClick={goToReviews}
              onKeyDown={(event) => {
                if (event.key === "Enter") goToReviews();
              }}
            >
              ({reviews.length} reviews)
            </span>
          </div>

          <div className="nx-qv-price">
            <strong>{formatPrice(product.price)}</strong>
            {discounted && <del>{formatPrice(product.originalPrice)}</del>}
            {discount > 0 && <span>-{discount}%</span>}
          </div>

          {colorOptions.length > 0 && (
            <div className="nx-qv-group">
              <div className="nx-qv-label">
                <strong>Colour:</strong>
                <span>{selectedColor || "Select a colour"}</span>
              </div>

              <div className="nx-qv-colors" role="radiogroup" aria-label="Colour">
                {colorOptions.map((color) => {
                  const selected = selectedColor === color.name;

                  return (
                    <button
                      key={color.name}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={color.name}
                      title={color.name}
                      className={`nx-qv-color ${selected ? "is-selected" : ""} ${
                        isLightColor(color.hex) ? "is-light" : ""
                      }`}
                      style={{ backgroundColor: color.hex }}
                      onClick={() => {
                        setSelectedColor(color.name);
                        setError("");
                      }}
                    >
                      {selected && <FaCheck />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {optionConfig && (
            <div className="nx-qv-group">
              <div className="nx-qv-label nx-qv-label--split">
                <div>
                  <strong>{optionConfig.label}:</strong>
                  <span>{selectedOption || "Select"}</span>
                </div>

                {optionConfig.guide && (
                  <button
                    type="button"
                    className="nx-qv-guide-link"
                    onClick={() => setGuideOpen(true)}
                  >
                    <FaRuler /> {optionConfig.label.split(" ")[0]} guide
                  </button>
                )}
              </div>

              <div className="nx-qv-sizes">
                {optionConfig.options.map((option) => (
                  <button
                    type="button"
                    key={option}
                    className={selectedOption === option ? "is-selected" : ""}
                    onClick={() => {
                      setSelectedOption(option);
                      setError("");
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="nx-qv-group nx-qv-qty-row">
            <strong>Quantity</strong>

            <div className="nx-qv-qty">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                <FaMinus />
              </button>

              <span>{quantity}</span>

              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                disabled={quantity >= maxQty}
                aria-label="Increase quantity"
              >
                <FaPlus />
              </button>
            </div>
          </div>

          {error && <p className="nx-qv-error" role="alert">{error}</p>}

          <div className="nx-qv-actions">
            <button
              type="button"
              className={`nx-qv-add ${added ? "is-added" : ""}`}
              onClick={handleAdd}
              disabled={adding || product.stock === 0}
            >
              {adding ? (
                <TbLoader2 className="nx-qv-spinner" />
              ) : added ? (
                <FaCheck />
              ) : null}
              {adding ? "ADDING..." : added ? "ADDED TO CART" : "ADD TO CART"}
            </button>

            <button
              type="button"
              className={`nx-qv-wish ${wishlisted ? "is-wishlisted" : ""}`}
              onClick={toggleWishlist}
              disabled={wishlistPending}
              aria-pressed={!!wishlisted}
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              {wishlisted ? <FaHeart /> : <FaRegHeart />}
            </button>
          </div>

          <Link
            to={`/product/${product.id}`}
            state={{ product: rawProduct }}
            className="nx-qv-details-link"
            onClick={onClose}
          >
            View full details
          </Link>
        </div>
      </div>

      {guideOpen && optionConfig?.guide && (
        <div
          className="nx-qv-guide-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={optionConfig.guide.title}
          onClick={(event) => {
            event.stopPropagation();
            setGuideOpen(false);
          }}
        >
          <div
            className="nx-qv-guide"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="nx-qv-close"
              onClick={() => setGuideOpen(false)}
              aria-label="Close guide"
            >
              <FaXmark />
            </button>

            <h3>{optionConfig.guide.title}</h3>

            <p>
              Compare these with your own measurements, or the vendor&apos;s
              details, before ordering.
            </p>

            <div className="nx-qv-guide-table-wrap">
              <table>
                <thead>
                  <tr>
                    {optionConfig.guide.columns.map((column) => (
                      <th key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {optionConfig.guide.rows.map((row) => (
                    <tr
                      key={row[0]}
                      className={row[0] === selectedOption ? "is-selected" : ""}
                    >
                      {row.map((cell, index) => (
                        <td key={index}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}