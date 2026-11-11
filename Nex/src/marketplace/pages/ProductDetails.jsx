import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaArrowRight,
  FaCartPlus,
  FaCheck,
  FaChevronDown,
  FaChevronRight,
  FaCopy,
  FaHeart,
  FaRegHeart,
  FaShareNodes,
  FaStar,
  FaTruck,
  FaShieldHalved,
  FaRotateLeft,
  FaMinus,
  FaPlus,
  FaFlag,
  FaXmark,
  FaBox,
  FaStore,
  FaRuler,
  FaLink,
} from "react-icons/fa6";
import { TbLoader2 } from "react-icons/tb";
import { useShop } from "../context/ShopContext";
import {
  useGetShopProductDetailQuery,
  useGetProductReviewsQuery,
} from "../api/shopApi";
import "../styles/ProductDetails.css";

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

  electronics: {
    label: "Storage",
    options: ["64GB", "128GB", "256GB", "512GB"],
  },

  phones: {
    label: "Storage",
    options: ["64GB", "128GB", "256GB", "512GB"],
  },

  beauty: {
    label: "Volume",
    options: ["30ml", "50ml", "100ml", "200ml"],
  },

  groceries: {
    label: "Pack size",
    options: ["500g", "1kg", "2kg", "5kg"],
  },

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

  home: {
    label: "Pack",
    options: ["Single", "Set of 2", "Set of 4"],
  },
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
      typeof color === "string"
        ? { name: color, hex: color }
        : color
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


const CUT = 34;

const RATING_OPTIONS = [
  { value: "all", label: "All ratings" },
  ...[5, 4, 3, 2, 1].map((rating) => ({
    value: String(rating),
    label: `${rating} star${rating > 1 ? "s" : ""}`,
  })),
];

const SORT_OPTIONS = [
  { value: "recent", label: "Most recent" },
  { value: "oldest", label: "Oldest first" },
];


const productPath = (item) => `/product/${item.id}`;

const vendorName = (item) => item.brand || item.vendor || item.vendorName || "";

const vendorPath = (item) =>
  `/vendor/${
    item.vendorSlug || encodeURIComponent(vendorName(item))
  }`;

const FOLLOW_KEY = "nexiv-followed-vendors";

const readFollowed = () => {
  try {
    return JSON.parse(localStorage.getItem(FOLLOW_KEY)) || [];
  } catch {
    return [];
  }
};

const formatPrice = (price) =>
  `₦${Number(price || 0).toLocaleString("en-NG")}`;

const getEstimatedDelivery = () => {
  const date = new Date();
  date.setDate(date.getDate() + 21);

  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};



const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap";

const PAGE_STYLES = `
main.nx-product-page,
main.nx-product-page * {
  font-family: "Roboto", sans-serif !important;
}
`;


function Stars({ rating = 0, className = "nx-stars" }) {
  return (
    <span className={className} aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <FaStar
          key={index}
          className={index < Math.round(Number(rating)) ? "is-filled" : ""}
        />
      ))}
    </span>
  );
}


function SmoothSelect({ value, onChange, options, ariaLabel }) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const wrapRef = useRef(null);

  const selected =
    options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!wrapRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const choose = (option) => {
    onChange(option.value);
    setOpen(false);
  };

  const onKeyDown = (event) => {
    if (event.key === "Escape" && open) {
      event.stopPropagation();
      setOpen(false);
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();

      if (!open) {
        setOpen(true);
        setHighlight(options.findIndex((o) => o.value === value));
        return;
      }

      const step = event.key === "ArrowDown" ? 1 : -1;

      setHighlight(
        (current) =>
          (current + step + options.length) % options.length
      );
      return;
    }

    if ((event.key === "Enter" || event.key === " ") && open) {
      event.preventDefault();

      if (highlight >= 0) choose(options[highlight]);
      else setOpen(false);
    }
  };

  return (
    <div
      className={`nx-select ${open ? "is-open" : ""}`}
      ref={wrapRef}
      onKeyDown={onKeyDown}
    >
      <button
        type="button"
        className="nx-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => {
          setOpen((current) => !current);
          setHighlight(options.findIndex((o) => o.value === value));
        }}
      >
        <span>{selected?.label}</span>
        <FaChevronDown />
      </button>

      <ul
        className="nx-select-menu"
        role="listbox"
        aria-label={ariaLabel}
      >
        {options.map((option, index) => (
          <li
            key={option.value}
            role="option"
            aria-selected={option.value === value}
            className={`nx-select-option ${
              option.value === value ? "is-selected" : ""
            } ${highlight === index ? "is-highlighted" : ""}`}
            onMouseEnter={() => setHighlight(index)}
            onClick={() => choose(option)}
          >
            <span>{option.label}</span>
            {option.value === value && <FaCheck />}
          </li>
        ))}
      </ul>
    </div>
  );
}


function ProductDetails() {
  const { addToCart, addToWishlist, removeFromWishlist, isWishlisted } =
    useShop();
  const location = useLocation();
  const params = useParams();

  /* The route carries the product id (or slug); the backend resolves
   * either. A card can hand over its product via router state for an
   * instant paint while the detail loads. */
  const detailId =
    params.id ??
    params.productId ??
    location.state?.product?.id ??
    location.state?.product?.slug;

  const {
    data: detailProduct,
    isLoading: detailLoading,
    isError: detailError,
  } = useGetShopProductDetailQuery(detailId, { skip: !detailId });

  const product = detailProduct || location.state?.product || {};

  /* Same category, same price class — chosen server-side. */
  const relatedProducts = useMemo(
    () => (product.related || []).slice(0, 5),
    [product.related]
  );

  const images = product.images?.length
    ? product.images
    : [product.image].filter(Boolean);

  const optionConfig = useMemo(() => getOptionConfig(product), [product]);
  const colorOptions = useMemo(() => getColorOptions(product), [product]);

  const [activeImage, setActiveImage] = useState(0);
  const [selectedOption, setSelectedOption] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [zoomOpen, setZoomOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const [ratingFilter, setRatingFilter] = useState("all");
  const [photosOnly, setPhotosOnly] = useState(false);
  const [reviewSort, setReviewSort] = useState("recent");

  const [reviewMenu, setReviewMenu] = useState(null);
  const [reportedReviews, setReportedReviews] = useState([]);
  const [helpfulReviews, setHelpfulReviews] = useState([]);

  const [toast, setToast] = useState("");
  const [allReviewsOpen, setAllReviewsOpen] = useState(false);
  const [activeReview, setActiveReview] = useState(0);

  const [cardSize, setCardSize] = useState({ w: 340, h: 270 });

  const [activeTab, setActiveTab] = useState("description");
  const [photoZoom, setPhotoZoom] = useState(null);
  const [focusReview, setFocusReview] = useState(null);

  const [relatedAdded, setRelatedAdded] = useState(null);
  const followKey = vendorName(product).toLowerCase();
const [followedVendors, setFollowedVendors] = useState(readFollowed);
const following = followedVendors.includes(followKey);

  const wishlisted = isWishlisted(product.id);

  useEffect(() => {
    if (document.querySelector(`link[href="${FONT_HREF}"]`)) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    document.head.appendChild(link);
  }, []);


  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [product.id]);

  useEffect(() => {
    setActiveImage(0);
    setSelectedOption("");
    setSelectedColor("");
    setQuantity(1);
    setAdded(false);
  }, [product.id]);


  useEffect(() => {
    const update = () => {
      setCardSize(
        window.matchMedia("(min-width: 640px)").matches
          ? { w: 340, h: 270 }
          : { w: 262, h: 280 }
      );
    };

    update();

    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("resize", update);
    };
  }, []);


  useEffect(() => {
    if (reviewMenu === null) return undefined;

    const onClick = (event) => {
      if (!event.target.closest(".nx-review-menu-wrap")) {
        setReviewMenu(null);
      }
    };

    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
    };
  }, [reviewMenu]);


  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== "Escape") return;

      if (photoZoom) {
        setPhotoZoom(null);
        return;
      }

      setZoomOpen(false);
      setGuideOpen(false);
      setAllReviewsOpen(false);
      setReviewMenu(null);
    };

    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [photoZoom])

  useEffect(() => {
  if (!location.state?.scrollToReviews) return undefined;

  const timer = window.setTimeout(() => {
    document
      .getElementById("nx-product-reviews")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 150);

  return () => window.clearTimeout(timer);
}, [product.id, location.state]);


  useEffect(() => {
    if (!zoomOpen && !guideOpen && !allReviewsOpen && !photoZoom) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [zoomOpen, guideOpen, allReviewsOpen, photoZoom]);

  const discounted =
    product.originalPrice && product.originalPrice > product.price;

  const discount = discounted
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) *
          100
      )
    : product.discount || 0;


  /* Reviews come from the storefront API (verified buyers only). */
  const { data: reviewsData, isLoading: reviewsLoading } =
    useGetProductReviewsQuery(
      { productId: product.id, page: 1, perPage: 6 },
      { skip: product.id == null }
    );

  const reviews = useMemo(
    () =>
      (reviewsData?.items || []).filter(
        (review) => !reportedReviews.includes(review.id)
      ),
    [reviewsData, reportedReviews]
  );

  const reviewCount =
    reviewsData?.total ?? product.reviewCount ?? reviews.length;

  const filteredReviews = useMemo(
    () =>
      reviews
        .filter(
          (review) =>
            ratingFilter === "all" || review.rating === Number(ratingFilter)
        )
        .filter((review) => !photosOnly || review.photos?.length > 0)
        .sort((a, b) => {
          const difference = new Date(b.date) - new Date(a.date);

          return reviewSort === "recent" ? difference : -difference;
        }),
    [reviews, ratingFilter, photosOnly, reviewSort]
  );

  useEffect(() => {
    setActiveReview((current) =>
      filteredReviews.length
        ? Math.min(current, filteredReviews.length - 1)
        : 0
    );

    setReviewMenu(null);
  }, [filteredReviews.length]);

  /* The backend computes the aggregate over every verified review. */
  const averageRating = product.rating
    ? Number(product.rating).toFixed(1)
    : reviews.length
      ? (
          reviews.reduce((total, review) => total + review.rating, 0) /
          reviews.length
        ).toFixed(1)
      : "0.0";


  const showToast = (message) => {
    setToast(message);

    window.setTimeout(() => {
      setToast("");
    }, 2400);
  };

  const shareContent = async (text, url = window.location.href) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        showToast("Link copied");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        showToast("Unable to share right now");
      }
    }
  };

  const copyItemId = async () => {
    const id = product.itemId || `NXV-${product.id}`;

    try {
      await navigator.clipboard.writeText(id);
      showToast("Item ID copied");
    } catch {
      showToast(`Item ID: ${id}`);
    }
  };


  const handleAddToCart = async () => {
    if (optionConfig && !selectedOption) {
      return showToast(
        `Please select a ${optionConfig.label.toLowerCase()} first`
      );
    }

    if (colorOptions.length > 0 && !selectedColor) {
      return showToast("Please select a colour first");
    }

    if (product.stock === 0) {
      return showToast("This product is currently out of stock");
    }

    setAdding(true);
    setAdded(false);

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

      window.setTimeout(() => {
        setAdded(false);
      }, 1800);
    } catch (error) {
      console.error("Could not add product to cart:", error);

      showToast("Could not add this item. Please try again.");
    } finally {
      setAdding(false);
    }
  };


  const reportReview = (id) => {
    setReportedReviews((current) =>
      current.includes(id) ? current : [...current, id]
    );

    setReviewMenu(null);

    showToast("Review reported for moderation");
  };

  const shareReview = async (review) => {
    await shareContent(
      `${review.name}'s review of ${product.name}: "${review.text}"`
    );

    setReviewMenu(null);
  };

  const toggleHelpful = (id) => {
    setHelpfulReviews((current) =>
      current.includes(id)
        ? current.filter((reviewId) => reviewId !== id)
        : [...current, id]
    );
  };

 

  const addRelatedToCart = async (item) => {
    try {
      await addToCart({
        ...item,
        vendor: item.vendor || item.brand,
        quantity: 1,
        stock: item.stock || 99,
        stockLeft: item.stock || 99,
      });

      setRelatedAdded(item.id);

      window.dispatchEvent(new Event("nexiv-cart-open"));

      window.setTimeout(() => {
        setRelatedAdded(null);
      }, 1600);
    } catch (error) {
      console.error("Could not add product to cart:", error);

      showToast("Could not add this item. Please try again.");
    }
  };

  const [wishlistPending, setWishlistPending] = useState(false);

  const toggleProductWishlist = async () => {
    if (wishlistPending || product.id == null) return;
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
      showToast(wishlisted ? "Removed from wishlist" : "Added to wishlist");
    } catch (error) {
      console.error("Could not update wishlist:", error);
      showToast("Could not update wishlist. Please try again.");
    } finally {
      setWishlistPending(false);
    }
  }

  const toggleFollow = () => {
  if (!followKey) return;

  const next = following
    ? followedVendors.filter((vendor) => vendor !== followKey)
    : [...followedVendors, followKey];

  setFollowedVendors(next);

  try {
    localStorage.setItem(FOLLOW_KEY, JSON.stringify(next));
  } catch {
    
  }

  const label = product.vendor || vendorName(product);
  showToast(following ? `Unfollowed ${label}` : `Following ${label}`);
};

  const openAllReviews = (id = null) => {
    setReviewMenu(null);
    setFocusReview(id);
    setAllReviewsOpen(true);
  };

  useEffect(() => {
    if (!allReviewsOpen || focusReview === null) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      document.getElementById(`nx-rv-${focusReview}`)?.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    }, 120);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [allReviewsOpen, focusReview]);

  const moveReview = (steps) => {
    const count = filteredReviews.length;

    if (count > 1) {
      setActiveReview(
        (current) => (((current + steps) % count) + count) % count
      );
    }
  };


  const renderStageCard = (review, index) => {
    const count = filteredReviews.length;
    const half = Math.floor(count / 2);

    let position = index - activeReview;

    if (position > half) {
      position -= count;
    }

    if (position < -(count - half - 1)) {
      position += count;
    }

    const isCenter = position === 0;
    const far = Math.abs(position) > 2;

    return (
      <article
        key={review.id}
        className={`nx-rv-stage-card ${isCenter ? "is-center" : ""}`}
        onClick={() =>
          isCenter ? openAllReviews(review.id) : moveReview(position)
        }
        style={{
          width: cardSize.w,
          height: cardSize.h,

          clipPath: `polygon(
            ${CUT}px 0,
            calc(100% - ${CUT}px) 0,
            100% ${CUT}px,
            100% 100%,
            calc(100% - ${CUT}px) 100%,
            ${CUT}px 100%,
            0 100%,
            0 0
          )`,

          opacity: far ? 0 : 1,
          pointerEvents: far ? "none" : "auto",

          transform: `
            translate(-50%, -50%)
            translateX(${(cardSize.w / 1.5) * position}px)
            translateY(${isCenter ? -14 : position % 2 ? 14 : -4}px)
            rotate(${isCenter ? 0 : position % 2 ? 2.5 : -2.5}deg)
          `,
        }}
      >
        <span
          className="nx-rv-corner"
          style={{
            top: CUT - 2,
            width: CUT * 1.4143,
          }}
        />

        <header>
          <span className="nx-rv-avatar">{review.initials}</span>

          <div>
            <strong>{review.name}</strong>

            {review.verified && (
              <small>
                <FaCheck /> Verified purchase
              </small>
            )}
          </div>

          {review.photos?.length > 0 && (
            <button
              type="button"
              className="nx-rv-stage-photo"
              aria-label={`View photo from ${review.name}`}
              onClick={(event) => {
                event.stopPropagation();

                setPhotoZoom({
                  photos: review.photos,
                  index: 0,
                });
              }}
            >
              <img src={review.photos[0]} alt={`Shared by ${review.name}`} />
            </button>
          )}
        </header>

        <Stars rating={review.rating} className="nx-review-stars" />

        <p>“{review.text}”</p>

        <footer>
          <span>
            {review.variant &&
              `${optionConfig?.label || "Option"}: ${review.variant}`}

            {review.variant && review.color && " · "}

            {review.color}
          </span>

          <time>{review.dateLabel || review.date}</time>
        </footer>
      </article>
    );
  };



  const renderReviewCard = (review) => (
    <article
      className={`nx-rv-card ${focusReview === review.id ? "is-focus" : ""}`}
      id={`nx-rv-${review.id}`}
      key={review.id}
    >
      <div className="nx-rv-card-top">
        <span className="nx-rv-avatar">{review.initials}</span>

        <div className="nx-rv-author">
          <strong>{review.name}</strong>

          {review.verified && (
            <small>
              <FaCheck /> Verified purchase
            </small>
          )}
        </div>

        <time>{review.dateLabel || review.date}</time>

        <div className="nx-review-menu-wrap">
          <button
            type="button"
            className="nx-rv-menu-trigger"
            onClick={(event) => {
              event.stopPropagation();

              setReviewMenu((current) =>
                current === review.id ? null : review.id
              );
            }}
            aria-label={`More options for ${review.name}'s review`}
            aria-expanded={reviewMenu === review.id}
          >
            •••
          </button>

          {reviewMenu === review.id && (
            <div className="nx-review-menu">
              <button type="button" onClick={() => shareReview(review)}>
                <FaLink /> Share review
              </button>

              <button type="button" onClick={() => reportReview(review.id)}>
                <FaFlag /> Report review
              </button>
            </div>
          )}
        </div>
      </div>

      <Stars rating={review.rating} className="nx-review-stars" />

      <p>{review.text}</p>

      {review.photos?.length > 0 && (
        <div className="nx-rv-photos">
          {review.photos.map((photo, index) => (
            <button
              type="button"
              key={index}
              aria-label={`Zoom photo ${index + 1} from ${review.name}`}
              onClick={() =>
                setPhotoZoom({
                  photos: review.photos,
                  index,
                })
              }
            >
              <img
                src={photo}
                alt={`Shared by ${review.name}`}
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      <div className="nx-rv-card-bottom">
        <span>
          {review.variant &&
            `${optionConfig?.label || "Option"}: ${review.variant}`}

          {review.variant && review.color && " · "}

          {review.color}
        </span>

        <button
          type="button"
          className={helpfulReviews.includes(review.id) ? "is-helpful" : ""}
          onClick={() => toggleHelpful(review.id)}
        >
          <FaCheck /> Helpful (
          {review.helpful + (helpfulReviews.includes(review.id) ? 1 : 0)})
        </button>
      </div>
    </article>
  );



  const filterControls = (
    <div className="nx-rv-filters">
      <SmoothSelect
        value={ratingFilter}
        onChange={setRatingFilter}
        options={RATING_OPTIONS}
        ariaLabel="Filter reviews by rating"
      />

      <SmoothSelect
        value={reviewSort}
        onChange={setReviewSort}
        options={SORT_OPTIONS}
        ariaLabel="Sort reviews"
      />
    </div>
  );


  if (product.id == null) {
    if (detailLoading) {
      return (
        <main className="nx-product-page">
          <p>Loading product...</p>
        </main>
      );
    }

    return (
      <main className="nx-product-page">
        <h1>{detailError ? "Product not found" : "Loading product..."}</h1>
        <Link to="/home">Back to products</Link>
      </main>
    );
  }

  return (
    <main className="nx-product-page">
      <style>{PAGE_STYLES}</style>

      <nav className="nx-product-breadcrumb" aria-label="Breadcrumb">
        <Link to="/home">Home</Link>

        <FaChevronRight />

        <Link to="/home#for-you">{product.category || "Products"}</Link>

        <FaChevronRight />

        <span>{product.name}</span>
      </nav>


      <section className="nx-product-main">
        <div className="nx-product-left">
          <div className="nx-product-main-image">
              {discount > 0 && (
                <span className="nx-product-discount">-{discount}%</span>
              )}

              <img
                src={images[activeImage]}
                alt={product.name}
                onClick={() => setZoomOpen(true)}
              />
            </div>

          <div className="nx-product-thumbs-card">
            <div className="nx-product-thumbnails">
              {images.map((image, index) => (
                <button
                  type="button"
                  key={`${image}-${index}`}
                  className={`nx-product-thumbnail ${
                    activeImage === index ? "is-active" : ""
                  }`}
                  onClick={() => setActiveImage(index)}
                  aria-label={`View product image ${index + 1}`}
                >
                  <img src={image} alt={`${product.name} view ${index + 1}`} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="nx-product-information">
          <div className="nx-product-head">
            <h1>{product.name}</h1>
            <button
            type="button"
            className="nx-product-rating-link"
            onClick={() =>
              document
                .getElementById("nx-product-reviews")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <Stars rating={averageRating} />

            <strong>{averageRating}</strong>

            <span>({reviewCount} reviews)</span>
          </button>
          </div>

          <div className="nx-product-price-block">
            <strong>{formatPrice(product.price)}</strong>

            {discounted && (
              <span className="nx-product-original-price">
                {formatPrice(product.originalPrice)}
              </span>
            )}

            {discount > 0 && (
              <span className="nx-product-save">Save {discount}%</span>
            )}
          </div>

          <p className="nx-product-stock">
            <span />
            {product.stock > 0 ? "In stock" : "Availability varies"}
          </p>

          <div className="nx-product-options">
            {colorOptions.length > 0 && (
              <div className="nx-product-option-group">
                <div className="nx-product-option-heading">
                  <strong>Colour</strong>

                  <span>{selectedColor || "Select a colour"}</span>
                </div>

                <div
                  className="nx-product-colors"
                  role="radiogroup"
                  aria-label="Colour"
                >
                  {colorOptions.map((color) => {
                    const selected = selectedColor === color.name;

                    return (
                      <button
                        key={color.name}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        className={`nx-product-color ${
                          selected ? "is-selected" : ""
                        } ${isLightColor(color.hex) ? "is-light" : ""}`}
                        style={{ backgroundColor: color.hex }}
                        onClick={() => setSelectedColor(color.name)}
                        aria-label={color.name}
                        title={color.name}
                      >
                        {selected && <FaCheck />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {optionConfig && (
              <div className="nx-product-option-group">
                <div className="nx-product-option-heading">
                  <strong>{optionConfig.label}</strong>

                  {optionConfig.guide && (
                    <button
                      type="button"
                      className="nx-size-guide-link"
                      onClick={() => setGuideOpen(true)}
                    >
                      <FaRuler /> {optionConfig.label.split(" ")[0]} guide
                    </button>
                  )}
                </div>

                <div className="nx-product-sizes">
                  {optionConfig.options.map((option) => (
                    <button
                      type="button"
                      key={option}
                      className={`nx-product-size ${
                        selectedOption === option ? "is-selected" : ""
                      }`}
                      onClick={() => setSelectedOption(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="nx-product-quantity-row">
            <strong>Quantity</strong>

            <div className="nx-product-quantity">
              <button
                type="button"
                onClick={() =>
                  setQuantity((current) => Math.max(1, current - 1))
                }
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                <FaMinus />
              </button>

              <span>{quantity}</span>

              <button
                type="button"
                onClick={() =>
                  setQuantity((current) =>
                    Math.min(product.stock || 99, current + 1)
                  )
                }
                disabled={quantity >= (product.stock || 99)}
                aria-label="Increase quantity"
              >
                <FaPlus />
              </button>
            </div>
          </div>

          <div className="nx-product-actions">
            <button
              type="button"
              className={`nx-product-add-button ${added ? "is-added" : ""}`}
              onClick={handleAddToCart}
              disabled={adding || product.stock === 0}
            >
              {adding ? (
                <TbLoader2 className="nx-product-spinner" />
              ) : added ? (
                <FaCheck />
              ) : (
                <FaBox />
              )}

              {adding ? "Adding..." : added ? "Added to cart" : "Add to cart"}
            </button>

            <button
              type="button"
              className={`nx-product-share-button nx-product-wishlist-button ${
                wishlisted ? "is-wishlisted" : ""
              }`}
              onClick={toggleProductWishlist}
              disabled={wishlistPending}
              aria-pressed={wishlisted}
              aria-label={
                wishlisted ? "Remove from wishlist" : "Add to wishlist"
              }
              title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              {wishlisted ? <FaHeart /> : <FaRegHeart />}
            </button>

            <button
              type="button"
              className="nx-product-share-button"
              onClick={() =>
                shareContent(`Check out ${product.name} on Nex-IV.`)
              }
              aria-label="Share product"
              title="Share product"
            >
              <FaShareNodes />
            </button>
          </div>

          <div className="nx-product-detail-tabs">
            <div className="nx-product-tab-buttons">
              {[
                ["description", "Description"],
                ["specifications", "Specifications"],
              ].map(([key, label]) => (
                <button
                  type="button"
                  key={key}
                  className={activeTab === key ? "is-active" : ""}
                  onClick={() => setActiveTab(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div
              className={`nx-product-tab-panel ${
                activeTab === "description"
                  ? "is-description"
                  : "is-specifications"
              }`}
              key={activeTab}
            >
              {activeTab === "description" ? (
                <div className="nx-product-description">
                  <p>{product.description || "No description available."}</p>
                </div>
              ) : (
                <div className="nx-product-specifications">
                  <div>
                    <span>Material used</span>
                    <strong>
                      {product.specifications?.material || "Not specified"}
                    </strong>
                  </div>

                  <div>
                    <span>Weight</span>
                    <strong>
                      {product.specifications?.weight || "Not specified"}
                    </strong>
                  </div>

                  <div>
                    <span>Dimensions</span>
                    <strong>
                      {product.specifications?.dimensions || "Not specified"}
                    </strong>
                  </div>

                  <div>
                    <span>Item ID</span>

                    <strong className="nx-product-item-id">
                      {product.itemId || `NXV-${product.id}`}

                      <button
                        type="button"
                        onClick={copyItemId}
                        aria-label="Copy item ID"
                        title="Copy item ID"
                      >
                        <FaCopy />
                      </button>
                    </strong>
                  </div>
                </div>
              )}
            </div>
          </div>


          <div className="nx-product-delivery">
            <div className="nx-product-delivery-title">Delivery options</div>

            <div className="nx-product-delivery-grid">
              <div className="nx-product-delivery-item">
                <span className="nx-product-delivery-icon"><FaTruck /></span>
                <div>
                  <small>Estimated delivery</small>
                  <strong>{getEstimatedDelivery()}</strong>
                </div>
              </div>

              <div className="nx-product-delivery-item">
                <span className="nx-product-delivery-icon"><FaBox /></span>
                <div>
                  <small>Shipping time</small>
                  <strong>{product.shipping || "2–3 weeks"}</strong>
                </div>
              </div>

              <div className="nx-product-delivery-item">
                <span className="nx-product-delivery-icon"><FaRotateLeft /></span>
                <div>
                  <small>Returns</small>
                  <strong>
                    <Link to="/faq">View return policy</Link>
                  </strong>
                </div>
              </div>

              <div className="nx-product-delivery-item">
                <span className="nx-product-delivery-icon"><FaShieldHalved /></span>
                <div>
                  <small>Shop with confidence</small>
                  <strong>Check seller details first</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="nx-product-vendor">
            <div className="nx-product-vendor-avatar">
              <FaStore />
            </div>

            <div className="nx-product-vendor-copy">
              <span>Sold by</span>

              <Link to={vendorPath(product)}>
                <strong>
                  {product.vendor || `${product.brand} Official Store`}
                </strong>
              </Link>

              <div className="nx-product-vendor-stats">
                <span>
                  <FaStar /> {product.vendorRating || 4.8} seller rating
                </span>
              </div>

              <small>On Nex-IV since {product.vendorJoined || "2024"}</small>
            </div>

           <button
  type="button"
  className={`nx-product-follow-button ${following ? "is-following" : ""}`}
  onClick={toggleFollow}
  aria-pressed={following}
>
  {following ? "Following" : "Follow"}
</button>
          </div>
        </div>
      </section>

      <section
          className="nx-product-reviews nx-rv"
          id="nx-product-reviews"
        >
          <div className="nx-rv-head">
            <div>
              <h2>Ratings & Reviews</h2>
            </div>

            <div className="nx-rv-average">
              <strong>{averageRating}</strong>

              <div>
                <Stars rating={averageRating} />
                <span>{reviewCount} reviews</span>
              </div>
            </div>
          </div>

          {filterControls}

          {filteredReviews.length > 0 ? (
            <>
              <div
                className="nx-rv-stage"
                style={{
                  height: cardSize.h + 56,
                }}
              >
                {filteredReviews.map(renderStageCard)}
              </div>

              <div className="nx-rv-controls">
                <button
                  type="button"
                  onClick={() => moveReview(-1)}
                  aria-label="Previous review"
                  disabled={filteredReviews.length <= 1}
                >
                  <FaArrowLeft />
                </button>

                <span>
                  {activeReview + 1} / {filteredReviews.length}
                </span>

                <button
                  type="button"
                  onClick={() => moveReview(1)}
                  aria-label="Next review"
                  disabled={filteredReviews.length <= 1}
                >
                  <FaArrowRight />
                </button>
              </div>
            </>
          ) : (
            <div className="nx-review-empty">
              <FaBox />

              <strong>No reviews match these filters.</strong>

              <button
                type="button"
                onClick={() => {
                  setRatingFilter("all");
                  setPhotosOnly(false);
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </section>

      <section className="nx-related-products">
        <div className="nx-related-products-heading">
          <div>
            <h2>Discover more</h2>
          </div>

          <Link to="/home#for-you">
            Explore more
            <FaArrowRight />
          </Link>
        </div>

        <div className="nx-related-viewport">
          <div className="nx-related-track">
            {[0, 1].map((copy) => (
              <div
                className="nx-related-group"
                key={copy}
                aria-hidden={copy === 1 ? true : undefined}
                inert={copy === 1 ? true : undefined}
              >
                {relatedProducts.map((item) => (
                  <article className="nx-related-card" key={item.id}>
                    <Link
                      to={productPath(item)}
                      state={{ product: item }}
                      className="nx-related-image"
                      aria-label={`View ${item.name}`}
                    >
                      <img
                        src={item.images?.[0] || item.image}
                        alt={item.name}
                        loading="lazy"
                      />
                    </Link>

                    <Link
                      to={productPath(item)}
                      state={{ product: item }}
                      className="nx-related-category"
                    >
                      {item.category}
                    </Link>

                    <Link
                      to={vendorPath(item)}
                      className="nx-related-vendor"
                    >
                      {item.vendor || item.brand}
                    </Link>

                    <Link
                      to={productPath(item)}
                      state={{ product: item }}
                      className="nx-related-name"
                    >
                      {item.name}
                    </Link>

                    <Link
                      to={productPath(item)}
                      state={{ product: item }}
                      className="nx-related-price"
                    >
                      {formatPrice(item.price)}
                    </Link>

                    <button
                      type="button"
                      className={`nx-related-add ${
                        relatedAdded === item.id ? "is-added" : ""
                      }`}
                      onClick={() => addRelatedToCart(item)}
                    >
                      {relatedAdded === item.id ? <FaCheck /> : <FaCartPlus />}
                      {relatedAdded === item.id ? "Added" : "Add to Cart"}
                    </button>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {allReviewsOpen && (
        <div
          className="nx-rv-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="All customer reviews"
          onClick={() => {
            setAllReviewsOpen(false);
            setFocusReview(null);
            setReviewMenu(null);
          }}
        >
          <button
            type="button"
            className="nx-rv-close"
            onClick={() => setAllReviewsOpen(false)}
            aria-label="Close reviews"
          >
            <FaXmark />
          </button>

          <section
            className="nx-rv-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <h2>All reviews</h2>

                <p>
                  {filteredReviews.length} for {product.name} ·{" "}
                  {averageRating} average
                </p>
              </div>

              {filterControls}
            </header>

            <div className="nx-rv-scroll">
              {filteredReviews.length > 0 ? (
                filteredReviews.map(renderReviewCard)
              ) : (
                <div className="nx-review-empty">
                  <FaBox />
                  <strong>No reviews match these filters.</strong>
                </div>
              )}
            </div>

            <footer className="nx-rv-buy">
              <div>
                <strong>{product.name}</strong>
                <span>{formatPrice(product.price)}</span>
              </div>

              <button
                type="button"
                className={`nx-rv-buy-wish ${
                  wishlisted ? "is-wishlisted" : ""
                }`}
                onClick={toggleProductWishlist}
                disabled={wishlistPending}
                aria-pressed={wishlisted}
                aria-label={
                  wishlisted ? "Remove from wishlist" : "Add to wishlist"
                }
              >
                {wishlisted ? <FaHeart /> : <FaRegHeart />}
                <span>Wishlist</span>
              </button>

              <button
                type="button"
                className={`nx-rv-buy-add ${added ? "is-added" : ""}`}
                onClick={handleAddToCart}
                disabled={adding || product.stock === 0}
              >
                {adding ? (
                  <TbLoader2 className="nx-product-spinner" />
                ) : added ? (
                  <FaCheck />
                ) : (
                  <FaBox />
                )}

                {adding ? "Adding..." : added ? "Added" : "Add to cart"}
              </button>
            </footer>
          </section>
        </div>
      )}

      {zoomOpen && (
        <div
          className="nx-product-zoom-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Zoomed product image"
          onClick={() => setZoomOpen(false)}
        >
          <button
            type="button"
            className="nx-product-zoom-close"
            onClick={() => setZoomOpen(false)}
            aria-label="Close zoom"
          >
            <FaXmark />
          </button>

          <img
            src={images[activeImage]}
            alt={product.name}
            onClick={(event) => event.stopPropagation()}
          />

          <div className="nx-product-zoom-controls">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();

                setActiveImage(
                  (current) => (current - 1 + images.length) % images.length
                );
              }}
              aria-label="Previous image"
            >
              <FaArrowLeft />
            </button>

            <span>
              {activeImage + 1} / {images.length}
            </span>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();

                setActiveImage((current) => (current + 1) % images.length);
              }}
              aria-label="Next image"
            >
              <FaArrowRight />
            </button>
          </div>
        </div>
      )}

      {photoZoom && (
        <div
          className="nx-product-zoom-overlay nx-rv-photo-zoom"
          role="dialog"
          aria-modal="true"
          aria-label="Review photo"
          onClick={() => setPhotoZoom(null)}
        >
          <button
            type="button"
            className="nx-product-zoom-close"
            onClick={() => setPhotoZoom(null)}
            aria-label="Close photo"
          >
            <FaXmark />
          </button>

          <img
            src={photoZoom.photos[photoZoom.index].replace("w=500", "w=1100")}
            alt="Review photo"
            onClick={(event) => event.stopPropagation()}
          />

          {photoZoom.photos.length > 1 && (
            <div className="nx-product-zoom-controls">
              <button
                type="button"
                aria-label="Previous photo"
                onClick={(event) => {
                  event.stopPropagation();

                  setPhotoZoom((current) => ({
                    ...current,
                    index:
                      (current.index - 1 + current.photos.length) %
                      current.photos.length,
                  }));
                }}
              >
                <FaArrowLeft />
              </button>

              <span>
                {photoZoom.index + 1} / {photoZoom.photos.length}
              </span>

              <button
                type="button"
                aria-label="Next photo"
                onClick={(event) => {
                  event.stopPropagation();

                  setPhotoZoom((current) => ({
                    ...current,
                    index: (current.index + 1) % current.photos.length,
                  }));
                }}
              >
                <FaArrowRight />
              </button>
            </div>
          )}
        </div>
      )}


      {guideOpen && optionConfig?.guide && (
        <div
          className="nx-size-guide-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={optionConfig.guide.title}
          onClick={() => setGuideOpen(false)}
        >
          <div
            className="nx-size-guide-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="nx-size-guide-close"
              onClick={() => setGuideOpen(false)}
              aria-label="Close guide"
            >
              <FaXmark />
            </button>

            <h2>{optionConfig.guide.title}</h2>

            <p>
              Compare these with your own measurements, or the vendor's
              details, before ordering.
            </p>

            <div className="nx-size-table-wrap">
              <table className="nx-size-table">
                <thead>
                  <tr>
                    {optionConfig.guide.columns.map((column) => (
                      <th key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {optionConfig.guide.rows.map((row) => (
                    <tr key={row[0]}>
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


      {toast && (
        <div className="nx-product-toast" role="status">
          <FaCheck /> {toast}
        </div>
      )}
    </main>
  );
}

export default ProductDetails;