// import { useShop } from "../context/ShopContext";
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  FaArrowRight,
  FaMinus,
  FaPlus,
  FaTrash,
  FaShoppingBag,
  FaShieldAlt,
  FaTruck,
  FaRegHeart,
  FaCartPlus,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

import { MdOutlineStorefront } from "react-icons/md";

import {
  useShop,
  formatMoney,
  groupByVendor,
  discountPercent,
  FREE_SHIPPING_MINIMUM,
} from "../context/ShopContext";
import { useGetShopDealsQuery } from "../api/shopApi";

import "../styles/Cart.css";

export default function Cart() {
  const navigate = useNavigate();

  /* Live deals from the storefront API power the cross-sell rail. */
  const { data: dealsData, isLoading: dealsLoading } = useGetShopDealsQuery();
  const deals = dealsData?.products || [];
  const duplicatedProducts = deals.length ? [...deals, ...deals] : [];


  const {
    activeItems = [],
    soldOutItems = [],
    selectedItems = [],
    allSelected = false,
    isItemSelected,
    toggleItem,
    toggleGroup,
    toggleAll,
    changeQuantity,
    removeFromCart,
    retailPrice = 0,
    promotionSavings = 0,
    couponAmount = 0,
    finalPrice = 0,
    freeShippingGap = 0,
    addToCart,
    moveToWishlist,
    cartItems
  } = useShop()

  const recommendationsTrackRef = useRef(null);
  const [reverseRecommendations, setReverseRecommendations] =
    useState(false);

  const moveRecommendations = (direction) => {
    setReverseRecommendations(direction < 0);
  };

  const vendorGroups = groupByVendor(activeItems);
  const hasSelectedItems = selectedItems.length > 0;

  const shippingProgress = Math.min(
    100,
    (finalPrice / FREE_SHIPPING_MINIMUM) * 100
  );

  return (
    <main className="nx-full-cart">
      <div className="nx-full-cart-container">
        <nav className="nx-full-cart-breadcrumb" aria-label="Breadcrumb">
          <Link to="/home">Home</Link>
          <span>/</span>
          <span>Shopping cart</span>
        </nav>

        <div className="nx-full-cart-heading">
          <div>
            <span className="nx-full-cart-eyebrow">YOUR NEX-IV BAG</span>
            <h1>Shopping cart</h1>
          </div>
        </div>

        <div className="nx-full-cart-layout">
          <section className="nx-full-cart-main">
            {activeItems.length === 0 && soldOutItems.length === 0 ? (
              <div className="nx-full-cart-empty">
                <div className="nx-full-cart-empty-icon">
                  <FaShoppingBag />
                </div>
                <h2>Your cart is empty</h2>
                <Link
                  to="/home"
                  className="nx-full-cart-primary nx-full-cart-continue"
                >
                  Explore the marketplace <FaArrowRight />
                </Link>
              </div>
            ) : (
              <>
                <div className="nx-full-cart-selection">
                  <label>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                    />
                    <span>Select all</span>
                  </label>

                  <span>{selectedItems.length} selected</span>
                </div>

                {vendorGroups.map((group) => (
                  <section
                    className="nx-full-cart-vendor"
                    key={group.vendor}
                  >
                    <div className="nx-full-cart-vendor-heading">
                      <label>
                        <input
                          type="checkbox"
                          checked={group.items.every((item) =>
                            isItemSelected(item.id)
                          )}
                          onChange={() => toggleGroup(group.items)}
                        />
                        <MdOutlineStorefront />
                        <strong>{group.vendor}</strong>
                      </label>
                    </div>

                    {group.items.map((item) => {
                      const discount = discountPercent(item);

                      return (
                        <article
                          className="nx-full-cart-item"
                          key={item.id}
                        >
                          <input
                            className="nx-full-cart-item-check"
                            type="checkbox"
                            checked={isItemSelected(item.id)}
                            onChange={() => toggleItem(item.id)}
                            aria-label={`Select ${item.name}`}
                          />

                          <div className="nx-full-cart-image">
                            {item.image ? (
                              <img src={item.image} alt={item.name} />
                            ) : (
                              <FaShoppingBag />
                            )}
                          </div>

                          <div className="nx-full-cart-item-details">
                            <div className="nx-full-cart-item-top">
                              <div>
                                <h3>{item.name}</h3>

                                {item.variant && <p>{item.variant}</p>}

                                {item.stockLeft > 0 &&
                                  item.stockLeft <= 5 && (
                                    <small className="nx-full-cart-stock">
                                      Only {item.stockLeft} left
                                    </small>
                                  )}
                              </div>
                            </div>

                            <div className="nx-full-cart-item-bottom">
                              <div className="nx-full-cart-pricing">
                                <strong>{formatMoney(item.price)}</strong>

                                {item.originalPrice > item.price && (
                                  <del>
                                    {formatMoney(item.originalPrice)}
                                  </del>
                                )}

                                {discount > 0 && <span>-{discount}%</span>}
                              </div>

                              <div className="nx-full-cart-item-bottom-right">
                                <button
                                  type="button"
                                  className="nx-full-cart-remove"
                                  onClick={() => removeFromCart(item.id)}
                                  aria-label={`Remove ${item.name}`}
                                >
                                  <FaTrash />
                                </button>

                                <div className="nx-full-cart-quantity">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      changeQuantity(
                                        item.id,
                                        Math.max(1, item.quantity - 1)
                                      )
                                    }
                                    disabled={item.quantity <= 1}
                                    aria-label="Decrease quantity"
                                  >
                                    <FaMinus />
                                  </button>

                                  <span>{item.quantity}</span>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      changeQuantity(
                                        item.id,
                                        item.quantity + 1
                                      )
                                    }
                                    disabled={
                                      item.stockLeft > 0 &&
                                      item.quantity >= item.stockLeft
                                    }
                                    aria-label="Increase quantity"
                                  >
                                    <FaPlus />
                                  </button>
                                </div>

                                {typeof moveToWishlist === "function" && (
                                  <button
                                    type="button"
                                    className="nx-full-cart-wishlist"
                                    onClick={() => moveToWishlist(item)}
                                    aria-label={`Save ${item.name} to wishlist`}
                                  >
                                    <FaRegHeart />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </section>
                ))}

                {soldOutItems.length > 0 && (
                  <section className="nx-full-cart-vendor nx-full-cart-sold-out">
                    <div className="nx-full-cart-vendor-heading">
                      <strong>Currently unavailable</strong>
                      <span>{soldOutItems.length} items</span>
                    </div>

                    {soldOutItems.map((item) => (
                      <article className="nx-full-cart-item" key={item.id}>
                        <div className="nx-full-cart-image">
                          {item.image ? (
                            <img src={item.image} alt={item.name} />
                          ) : (
                            <FaShoppingBag />
                          )}
                        </div>

                        <div className="nx-full-cart-item-details">
                          <h3>{item.name}</h3>
                          <p>This item is currently unavailable.</p>

                          <button
                            type="button"
                            className="nx-full-cart-wishlist"
                            onClick={() => removeFromCart(item.id)}
                          >
                            Remove item
                          </button>
                        </div>
                      </article>
                    ))}
                  </section>
                )}

                <Link
                  to="/home"
                  className="nx-full-cart-continue-shopping"
                >
                  <FaArrowRight className="nx-full-cart-back-arrow" />
                  Continue shopping
                </Link>
              </>
            )}
          </section>

          <aside className="nx-full-cart-summary">
            <div className="nx-full-cart-summary-heading">
              <span>YOUR ORDER</span>
              <h2>Order summary</h2>
            </div>

            <div className="nx-full-cart-summary-line">
              <span>Retail price</span>
              <span style={{ fontSize: "20px" }}>
                {formatMoney(retailPrice)}
              </span>
            </div>

            {promotionSavings > 0 && (
              <div className="nx-full-cart-summary-line nx-full-cart-saving">
                <span>Product savings</span>
                <span>−{formatMoney(promotionSavings)}</span>
              </div>
            )}

            {couponAmount > 0 && (
              <div className="nx-full-cart-summary-line nx-full-cart-saving">
                <span>Additional savings</span>
                <span>−{formatMoney(couponAmount)}</span>
              </div>
            )}

            <div className="nx-full-cart-summary-line">
              <span>Delivery</span>
              <span className="nx-full-cart-delivery-value">
                {freeShippingGap === 0 && hasSelectedItems
                  ? "Free"
                  : "Calculated at checkout"}
              </span>
            </div>

            {hasSelectedItems && freeShippingGap > 0 && (
              <div className="nx-full-cart-shipping-progress">
                <p>
                  Add <strong>{formatMoney(freeShippingGap)}</strong> more
                  for free shipping.
                </p>

                <div className="nx-full-cart-progress-track">
                  <span style={{ width: `${shippingProgress}%` }} />
                </div>
              </div>
            )}

            <div className="nx-full-cart-summary-total">
              <span>Estimated total</span>
              <strong>{formatMoney(finalPrice)}</strong>
            </div>

            <p className="nx-full-cart-tax-note">
              Delivery fees may vary by destination.
            </p>

            <button
              type="button"
              className="nx-full-cart-primary nx-full-cart-checkout"
              disabled={!hasSelectedItems}
              onClick={() => navigate("/checkout")}
            >
              Proceed to checkout <FaArrowRight />
            </button>

            <div className="nx-full-cart-trust">
              <div>
                <FaShieldAlt />
                <span>
                  <strong>Shop with confidence</strong>
                  Secure shopping across vendors
                </span>
              </div>

              <div>
                <FaTruck />
                <span>
                  <strong>Delivery made simple</strong>
                  Delivery details at checkout
                </span>
              </div>
            </div>
          </aside>
        </div>

        <section className="nx-full-cart-popular">
          <div className="nx-full-cart-popular-heading">
            <div>
              <h2>Recommended For You</h2>
            </div>

            <Link to="/home" className="nx-full-cart-popular-explore">
              Explore more <FaArrowRight />
            </Link>
          </div>

          <div className="nx-full-cart-carousel">
            <button
              type="button"
              className="nx-full-cart-carousel-arrow nx-full-cart-carousel-prev"
              aria-label="Scroll recommendations backward"
              onClick={() => moveRecommendations(-1)}
            >
              <FaChevronLeft />
            </button>

            <div
              className={`nx-full-cart-recommendations ${
                reverseRecommendations
                  ? "nx-recommendations-reverse"
                  : ""
              }`}
              onMouseEnter={() => {
                if (recommendationsTrackRef.current) {
                  recommendationsTrackRef.current.style.animationPlayState =
                    "paused";
                }
              }}
              onMouseLeave={() => {
                if (recommendationsTrackRef.current) {
                  recommendationsTrackRef.current.style.animationPlayState =
                    "running";
                }
              }}
            >
              <div
                className="nx-full-cart-recommendations-track"
                ref={recommendationsTrackRef}
              >
                {duplicatedProducts.map((product, index) => (
                  <article
                    className="nx-full-cart-popular-card"
                    key={`${product.id}-${index}`}
                  >
                    <div className="nx-full-cart-popular-image">
                      <img
                        src={product.image}
                        alt={product.name}
                        loading={index < deals.length ? "eager" : "lazy"}
                      />
                    </div>

                    <span className="nx-full-cart-recommendation-category">
                      {product.category}
                    </span>

                    <strong className="nx-full-cart-recommendation-vendor">
                     {product.vendor}
                    </strong>

                    <small>{product.name}</small>

                    <strong className="nx-full-cart-recommendation-price">
                      {formatMoney(product.price)}
                    </strong>

                    <button
                      type="button"
                      className="nx-full-cart-recommendation-add"
                      onClick={() => {
                        if (typeof addToCart === "function") {
                          addToCart(product);
                        }
                      }}
                    >
                      <FaCartPlus />
                      Add to Cart
                    </button>
                  </article>
                ))}

                {dealsLoading && (
                  <p className="nx-full-cart-recommendations-empty">
                    Loading today’s deals…
                  </p>
                )}

                {!dealsLoading && !deals.length && (
                  <p className="nx-full-cart-recommendations-empty">
                    No deals right now — explore the shop instead.
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              className="nx-full-cart-carousel-arrow nx-full-cart-carousel-next"
              aria-label="Scroll recommendations forward"
              onClick={() => moveRecommendations(1)}
            >
              <FaChevronRight />
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
