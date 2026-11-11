import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { ROLES } from "../../constants/roles";
import {
  FaCheckCircle,
  FaBoxOpen,
  FaMapMarkerAlt,
  FaCreditCard,
  FaTruck,
  FaTimesCircle,
  FaSearch,
  FaReceipt,
  FaStore,
} from "react-icons/fa";
import {
  useGetShopOrderQuery,
  useLookupShopOrderQuery,
  useCancelShopOrderMutation,
  productImage,
} from "../api/shopApi";
import {
  SHOP_STATUS_FLOW,
  SHOP_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  DELIVERY_METHOD_LABELS,
} from "../../constants/shop";
import { formatMoney } from "../context/ShopContext";
import "../styles/Order.css";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function statusLabel(key) {
  return SHOP_STATUS_LABELS[key] || key;
}

function Timeline({ order }) {
  const status = order.status;
  const cancelled = status === "CANCELLED" || status === "RETURNED";
  const timeline = order.timeline || [];
  const currentIndex = SHOP_STATUS_FLOW.indexOf(status);

  if (cancelled) {
    return (
      <div className="nx-order-timeline is-cancelled">
        <FaTimesCircle />
        <div>
          <strong>{statusLabel(status)}</strong>
          <span>
            This order was {status === "RETURNED" ? "returned" : "cancelled"}.
          </span>
        </div>
      </div>
    );
  }

  return (
    <ol className="nx-order-timeline">
      {SHOP_STATUS_FLOW.map((key, index) => {
        const reached = index <= currentIndex;
        const marker = timeline.find((t) => t.key === key);

        return (
          <li
            key={key}
            className={reached ? "is-done" : undefined}
            aria-current={index === currentIndex ? "step" : undefined}
          >
            <span className="nx-order-timeline-dot" />
            <span className="nx-order-timeline-label">
              {statusLabel(key)}
            </span>
            <span className="nx-order-timeline-date">
              {marker ? formatDate(marker.at) : ""}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function OrderBody({ order }) {
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [cancelOrder] = useCancelShopOrderMutation();
  const currentUserId = useSelector((state) => state.auth.user?.id);
  const canRefresh = useSelector(
    (state) => state.auth.user?.role === ROLES.SHOPPER,
  );

  /* Keep the order fresh (the backend auto-advances status) — but only
   * when this session can actually read it back. */
  const { data: refreshed } = useGetShopOrderQuery(order.id, {
    skip: !order?.id || !canRefresh,
  });
  const live = refreshed || order;

  const ownsOrder =
    !live.shopperId || String(live.shopperId) === String(currentUserId);
  const cancellable =
    ownsOrder &&
    !["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "RETURNED"].includes(
      live.status,
    );

  const handleCancel = async () => {
    setCancelling(true);
    setCancelError("");
    try {
      await cancelOrder(live.id).unwrap();
    } catch (err) {
      setCancelError(err?.data?.message || "Unable to cancel this order.");
    } finally {
      setCancelling(false);
    }
  };

  const address = live.address || {};
  const items = live.items || [];

  return (
    <div className="nx-order">
      <header className="nx-order-header">
        <span className="nx-order-eyebrow">NEX-IV ORDER</span>
        <h1>
          Thank you{live.name ? `, ${live.name.split(" ")[0]}` : ""}! Your order
          is in.
        </h1>
        <p>
          Order <strong>#{live.number}</strong> was placed on{" "}
          {formatDate(live.createdAt)}. We emailed the receipt to{" "}
          <strong>{live.email}</strong>.
        </p>

        <div className="nx-order-meta">
          <span>
            <FaReceipt /> #{live.number}
          </span>
          <span>
            <FaTruck /> Est. delivery {formatDate(live.estimatedDelivery)}
          </span>
          <span>
            <FaBoxOpen /> {live.itemCount ?? items.length} items
          </span>
          <span
            className={`nx-order-status nx-order-status-${String(
              live.status,
            ).toLowerCase()}`}
          >
            {statusLabel(live.status)}
          </span>
        </div>
      </header>

      <div className="nx-order-grid">
        <section className="nx-order-panel">
          <h2>Progress</h2>
          <Timeline order={live} />

          {cancellable && (
            <div className="nx-order-cancel">
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className="nx-order-cancel-button"
              >
                {cancelling ? "Cancelling…" : "Cancel this order"}
              </button>
              {cancelError && <p className="nx-order-error">{cancelError}</p>}
            </div>
          )}
        </section>

        <section className="nx-order-panel">
          <h2>Items</h2>
          <ul className="nx-order-items">
            {items.map((item) => (
              <li key={`${item.productId}-${item.variantSummary || ""}`}>
                <Link
                  to={`/product/${item.slug || item.productId}`}
                  className="nx-order-item"
                >
                  <img
                    src={item.image || productImage(item.imageSeed || item.productId)}
                    alt={item.name}
                    loading="lazy"
                  />
                  <span className="nx-order-item-details">
                    <strong>{item.name}</strong>
                    <small>
                      {item.vendorName}
                      {item.variantSummary ? ` · ${item.variantSummary}` : ""}
                    </small>
                    <small>
                      {item.qty} × {formatMoney(item.unitPrice)}
                    </small>
                  </span>
                  <strong className="nx-order-item-total">
                    {formatMoney(item.lineTotal)}
                  </strong>
                </Link>
              </li>
            ))}
          </ul>

          <div className="nx-order-totals">
            <div>
              <span>Subtotal</span>
              <strong>{formatMoney(live.subtotal)}</strong>
            </div>
            <div>
              <span>Delivery ({DELIVERY_METHOD_LABELS[live.deliveryMethod]})</span>
              <strong>
                {live.deliveryFee ? formatMoney(live.deliveryFee) : "FREE"}
              </strong>
            </div>
            <div className="nx-order-grand-total">
              <span>Total</span>
              <strong>{formatMoney(live.total)}</strong>
            </div>
          </div>
        </section>

        <section className="nx-order-panel">
          <h2>Delivery address</h2>
          <p className="nx-order-address">
            <FaMapMarkerAlt />
            <span>
              <strong>{address.name || live.name}</strong>
              {address.line}
              {address.line ? <br /> : null}
              {[address.city, address.state, address.zip]
                .filter(Boolean)
                .join(", ")}
              {address.phone ? (
                <>
                  <br />
                  {address.phone}
                </>
              ) : null}
            </span>
          </p>

          <h2>Payment</h2>
          <p className="nx-order-payment">
            <FaCreditCard />
            <span>
              <strong>{PAYMENT_METHOD_LABELS[live.paymentMethod]}</strong>
              {live.cardLast4 ? `Card ending in ${live.cardLast4}` : null}
              <em
                className={`nx-order-payment-status nx-order-payment-status-${String(
                  live.paymentStatus,
                ).toLowerCase()}`}
              >
                {live.paymentStatus}
              </em>
            </span>
          </p>

          {live.note && (
            <>
              <h2>Note to vendor</h2>
              <p className="nx-order-note">{live.note}</p>
            </>
          )}
        </section>

        <section className="nx-order-panel">
          <h2>
            <FaStore /> Vendor orders
          </h2>
          <p className="nx-order-vendors">
            Your order is fulfilled by{" "}
            {(live.vendorNames || []).join(", ") || "our vendor partners"}.
            Each vendor ships and invoices their part of the order separately:
          </p>
          <ul className="nx-order-vendor-list">
            {(live.erpOrders || []).map((eo) => (
              <li key={eo.orderId}>
                <strong>{eo.vendorName}</strong>
                <span>Sales order {eo.number}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <footer className="nx-order-footer">
        <Link to="/account/orders" className="nx-order-link">
          View your orders
        </Link>
        <Link to="/home" className="nx-order-link">
          Continue shopping
        </Link>
      </footer>
    </div>
  );
}

function OrderLookup({ fallbackOrder }) {
  const { orderId } = useParams();
  const location = useLocation();
  const [number, setNumber] = useState("");
  const [email, setEmail] = useState("");
  const [searching, setSearching] = useState(false);

  const { data, error } = useLookupShopOrderQuery(
    { number: number.trim(), email: email.trim().toLowerCase() },
    { skip: !searching || !number.trim() || !email.trim() },
  );

  if (fallbackOrder) return <OrderBody order={fallbackOrder} />;

  const found = data?.order || data;

  return (
    <div className="nx-order nx-order-lookup">
      <header className="nx-order-header">
        <span className="nx-order-eyebrow">NEX-IV ORDER</span>
        <h1>Find your order</h1>
        <p>
          Enter your order number and the email you used at checkout
          {orderId ? " (order id links are for signed-in accounts)" : ""}.
        </p>
      </header>

      {found ? (
        <OrderBody order={found} />
      ) : (
        <form
          className="nx-order-lookup-form"
          onSubmit={(event) => {
            event.preventDefault();
            setSearching(true);
          }}
        >
          <label>
            <span>Order number</span>
            <input
              value={number}
              onChange={(event) => setNumber(event.target.value)}
              placeholder="NEX-10401"
              required
            />
          </label>
          <label>
            <span>Email address</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>
          <button type="submit">
            <FaSearch /> Find order
          </button>
          {searching && error && (
            <p className="nx-order-error">
              {error?.data?.message ||
                "No order matches those details. Check the number and email."}
            </p>
          )}
        </form>
      )}
    </div>
  );
}

export default function Order() {
  const { orderId } = useParams();
  const location = useLocation();
  const accessToken = useSelector((state) => state.auth.accessToken);
  const userRole = useSelector((state) => state.auth.user?.role);

  const isShopper = !!accessToken && userRole === ROLES.SHOPPER;
  const { data, isLoading } = useGetShopOrderQuery(orderId, {
    skip: !orderId,
  });

  /* Signed-in shoppers fetch by id; guests fall back to the order the
   * checkout handed over, then to the lookup form. */
  if (isShopper && orderId) {
    if (isLoading) {
      return (
        <div className="nx-order nx-order-loading">
          <FaBoxOpen /> Loading your order…
        </div>
      );
    }
    if (data) return <OrderBody order={data} />;
  }

  return (
    <OrderLookup
      fallbackOrder={
        location.state?.order?.id === orderId || !orderId
          ? location.state?.order
          : null
      }
    />
  );
}
