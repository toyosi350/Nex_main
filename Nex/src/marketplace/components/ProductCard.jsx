import { Link } from "react-router-dom";
import {
  FaHeart,
  FaRegHeart,
  FaTrash,
  FaArrowUpRightFromSquare,
} from "react-icons/fa6";
import { useShop, formatMoney, discountPercent } from "../context/ShopContext";
import "../styles/ProductCard.css";

function ProductCard({
  product,
  showWishlist = true,
  showHoverActions = false,
  onDelete,
  onFindSimilar,
}) {
  const { toggleWishlist, isWishlisted } = useShop();

  const saved = isWishlisted(product.id);
  const discount = discountPercent(product);
  const stock = Number(product.stockLeft ?? product.stock ?? 0);

  const stockLabel =
    stock <= 0
      ? "Out of stock"
      : stock <= 5
        ? `Only ${stock} left`
        : "In stock";

  return (
    <article className="nx-product-card">
      <div className="nx-product-card-image">
        <Link
          to={`/product/${product.id}`}
          state={{ product }}
          className="nx-product-card-image-link"
        >
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
          />
        </Link>

        {discount > 0 && (
          <span className="nx-product-card-discount">
            -{discount}%
          </span>
        )}

        {showWishlist && (
          <button
            type="button"
            className={`nx-product-card-heart ${
              saved ? "is-saved" : ""
            }`}
            onClick={() => toggleWishlist(product)}
            aria-label={
              saved ? "Remove from wishlist" : "Add to wishlist"
            }
            aria-pressed={saved}
          >
            {saved ? <FaHeart /> : <FaRegHeart />}
          </button>
        )}

        {showHoverActions && (
          <div className="nx-product-card-hover-actions">
            <button
              type="button"
              onClick={onDelete}
              className="nx-product-card-delete"
            >
              <FaTrash /> Remove
            </button>

            <button
              type="button"
              onClick={onFindSimilar}
              className="nx-product-card-similar"
            >
              <FaArrowUpRightFromSquare /> Find similar
            </button>
          </div>
        )}
      </div>

      <div className="nx-product-card-content">
        <Link
          to={`/vendor/${
            product.vendorSlug || encodeURIComponent(product.brand || product.vendor)
          }`}
          className="nx-product-vendor-link"
        >
          {product.brand || product.vendor}
        </Link>

        <Link
          to={`/product/${product.id}`}
          state={{ product }}
          className="nx-product-card-name"
        >
          {product.name}
        </Link>

        <div className="nx-product-card-prices">
          <strong>{formatMoney(product.price)}</strong>

          {product.originalPrice > product.price && (
            <del>{formatMoney(product.originalPrice)}</del>
          )}
        </div>

        <span
          className={`nx-product-card-stock ${
            stock <= 0
              ? "is-out"
              : stock <= 5
                ? "is-low"
                : ""
          }`}
        >
          {stockLabel}
        </span>
      </div>
    </article>
  );
}

export default ProductCard;
