import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {FaUser, FaBoxOpen, FaGift, FaCoins, FaCreditCard, FaMapMarkerAlt, FaGlobe, FaBell, FaHeart,FaStar, FaStore, FaChevronRight, FaSignOutAlt, FaExchangeAlt, FaRegCalendarCheck,FaShieldAlt, FaSlidersH, FaReceipt, FaTruck, FaUndo, FaTicketAlt, FaPlus, FaArrowRight,FaCheckCircle, FaEdit, FaLock, FaPhone, FaEnvelope, FaTimes, FaTrash} from "react-icons/fa";
import { useShop } from "../context/ShopContext";
import Wishlist from "./Wishlist";
import "../styles/Account.css";
import { signOutCurrent } from "../data/AccountSessions";
import { useGetShopOrdersQuery } from "../api/shopApi";
import { ROLES } from "../../constants/roles";

const USER_KEY = "nexivCurrentUser";
const ORDERS_KEY = "nexivOrders";
const POINTS_KEY = "nexivPointsHistory";
const REVIEWS_KEY = "nexivReviews";
const ACCOUNT_KEY = "nexivAccountDetails";
const ADDRESSES_KEY = "nexivAddresses";
const PAYMENTS_KEY = "nexivPaymentMethods";
const CONTACT_KEY = "nexivContactPreferences";
const COUPONS_KEY = "nexivCoupons";

const POINTS_PER_NAIRA = 1;

function readStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function money(value) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function normaliseStatus(status = "") {
  return String(status).toLowerCase().replace(/[_-]/g, " ").trim();
}

function getOrderStatus(order) {
  const status = normaliseStatus(
    order?.status || order?.orderStatus || order?.paymentStatus
  );

  const payment = normaliseStatus(
    order?.paymentStatus || order?.payment?.status
  );

  if (
    status.includes("cancel") ||
    status.includes("return") ||
    status.includes("refund")
  ) {
    return status.includes("request") ? "return requested" : status;
  }

  if (
    status.includes("processing") ||
    payment.includes("processing") ||
    payment.includes("pending")
  ) {
    return "processing";
  }

  if (status.includes("deliver")) return "delivered";
  if (status.includes("ship") || status.includes("transit")) return "shipped";
  if (status.includes("paid") && !status.includes("unpaid")) {
    return "processing";
  }

  return status || "processing";
}

function getOrderItems(order) {
  if (Array.isArray(order?.items)) return order.items;
  if (Array.isArray(order?.products)) return order.products;
  if (order?.product) return [order.product];
  return [];
}

function getProductName(item) {
  return (
    item?.name ||
    item?.title ||
    item?.productName ||
    item?.product?.name ||
    item?.product?.title ||
    "Nex-IV product"
  );
}

function getProductId(item) {
  return String(
    item?.productId ||
      item?.product?.id ||
      item?.id ||
      item?._id ||
      getProductName(item)
  );
}

function getProductImage(item) {
  return (
    item?.image ||
    item?.imageUrl ||
    item?.thumbnail ||
    item?.product?.image ||
    item?.product?.imageUrl ||
    ""
  );
}

function getUserName(user) {
  return (
    user?.username ||
    user?.name ||
    user?.fullName ||
    user?.firstName ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "Nex-IV Shopper"
  );
}

const navigationGroups = [
  {
    title: "My Assets",
    items: [
      { label: "Coupons", section: "coupons", icon: FaTicketAlt },
      { label: "My Points", section: "points", icon: FaCoins },
      { label: "Gift cards", section: "giftcards", icon: FaGift },
    ],
  },
  {
    title: "My Shopping",
    items: [
      { label: "Following", section: "following", icon: FaStore },
      { label: "Payment methods", section: "payments", icon: FaCreditCard },
      { label: "Address book", section: "addresses", icon: FaMapMarkerAlt },
      { label: "Language", section: "language", icon: FaGlobe },
    ],
  },
  {
    title: "My Orders",
    items: [
      { label: "All orders", section: "orders", icon: FaBoxOpen },
      { label: "Processing", section: "processing", icon: FaRegCalendarCheck },
      { label: "Shipped", section: "shipped", icon: FaTruck },
      { label: "Delivered", section: "delivered", icon: FaCheckCircle },
      { label: "Returns", section: "returns", icon: FaUndo },
      { label: "My Reviews", section: "reviews", icon: FaStar },
      { label: "Wishlist", section: "wishlist", icon: FaHeart },
    ],
  },
  {
    title: "Preferences",
    items: [
      { label: "Account management", section: "management", icon: FaShieldAlt },
      {
        label: "Contact preferences",
        section: "contact-preferences",
        icon: FaSlidersH,
      },
    ],
  },
];

export default function Account() {
  const navigate = useNavigate();
  const { section } = useParams();

  const shop = useShop() || {};
  const wishlistItems = shop.wishlistItems || [];
  const cartItems = shop.cartItems || [];

  const activeSection = section || "overview";

  const [currentUser, setCurrentUser] = useState(() =>
    readStorage(USER_KEY, null)
  );
  const authUser = useSelector((state) => state.auth.user);
  const isShopper = authUser?.role === ROLES.SHOPPER;
  const { data: shopOrdersData } = useGetShopOrdersQuery(
    { page: 1, perPage: 50 },
    { skip: !isShopper }
  );

  const [accountDetails, setAccountDetails] = useState(() =>
    readStorage(ACCOUNT_KEY, {})
  );
  const [localOrders, setLocalOrders] = useState(() =>
    readStorage(ORDERS_KEY, [])
  );
  const orders = isShopper ? shopOrdersData?.items || [] : localOrders;
  const [reviews, setReviews] = useState(() => readStorage(REVIEWS_KEY, []));
  const [pointsHistory, setPointsHistory] = useState(() =>
    readStorage(POINTS_KEY, [])
  );
  const [coupons, setCoupons] = useState(() =>
    readStorage(COUPONS_KEY, [])
  );
  const [addresses, setAddresses] = useState(() =>
    readStorage(ADDRESSES_KEY, [])
  );
  const [paymentMethods, setPaymentMethods] = useState(() =>
    readStorage(PAYMENTS_KEY, [])
  );
  const [contactPreferences, setContactPreferences] = useState(() =>
    readStorage(CONTACT_KEY, {
      email: true,
      sms: false,
      whatsapp: false,
      orderUpdates: true,
      promotions: false,
    })
  );

  const [pointsTab, setPointsTab] = useState("all");
  const [orderTab, setOrderTab] = useState("all");
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [notice, setNotice] = useState("");
  const [editingFields, setEditingFields] = useState({});
  const [managementForm, setManagementForm] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
    name: "",
    phone: "",
    street: "",
    city: "",
    state: "",
  });
  const [paymentScreen, setPaymentScreen] = useState("overview");
  const [paymentForm, setPaymentForm] = useState({
  nameOnCard: "",
  cardNumber: "",
  expiryDate: "",
  cvv: "",
});
  const [giftCode, setGiftCode] = useState("");
  const [giftBalance, setGiftBalance] = useState(0);

  useEffect(() => {
    const syncUser = () => setCurrentUser(readStorage(USER_KEY, null));

    window.addEventListener("storage", syncUser);
    window.addEventListener("nexiv-auth-change", syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("nexiv-auth-change", syncUser);
    };
  }, []);

  useEffect(() => {
    setManagementForm({
      username:
        accountDetails.username ||
        currentUser?.username ||
        currentUser?.name ||
        "",
      email: accountDetails.email || currentUser?.email || "",
      phone: accountDetails.phone || currentUser?.phone || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  }, [currentUser, accountDetails]);

  useEffect(() => {
    setLocalOrders(readStorage(ORDERS_KEY, []));
    setReviews(readStorage(REVIEWS_KEY, []));
    setPointsHistory(readStorage(POINTS_KEY, []));
    setCoupons(readStorage(COUPONS_KEY, []));
    setAddresses(readStorage(ADDRESSES_KEY, []));
    setPaymentMethods(readStorage(PAYMENTS_KEY, []));
  }, [activeSection]);

  useEffect(() => {
  const orderTabs = ["processing", "shipped", "delivered", "returns"];

  if (orderTabs.includes(activeSection)) {
    setOrderTab(activeSection);
  } else if (activeSection === "orders") {
    setOrderTab("all");
  }

  if (activeSection.startsWith("points-")) {
    const tab = activeSection.replace("points-", "");

    if (["earned", "used", "expired"].includes(tab)) {
      setPointsTab(tab);
    }
  } else if (activeSection === "points") {
    setPointsTab("all");
  }
}, [activeSection]);

  const displayName = getUserName({
    ...currentUser,
    ...accountDetails,
  });

  const pointsTotal = useMemo(() => {
    return pointsHistory.reduce((total, entry) => {
      if (entry.status === "expired") return total;
      return total + (Number(entry.points) || 0);
    }, 0);
  }, [pointsHistory]);

  const availablePoints = Math.max(0, pointsTotal);
  const pointsValue = availablePoints / POINTS_PER_NAIRA;

  const filteredPoints = pointsHistory.filter((entry) => {
    if (pointsTab === "all") return true;
    if (pointsTab === "earned") return entry.type === "earned";
    if (pointsTab === "used") return entry.type === "used";
    if (pointsTab === "expired") return entry.status === "expired";
    return true;
  });

  const filteredOrders = orders.filter((order) => {
    const status = getOrderStatus(order);

    if (orderTab === "all") return true;
    if (orderTab === "processing") return status === "processing";
    if (orderTab === "shipped") return status === "shipped";
    if (orderTab === "delivered") return status === "delivered";
    if (orderTab === "returns") {
      return (
        status.includes("return") ||
        status.includes("refund") ||
        status.includes("cancel")
      );
    }

    return true;
  });

  const reviewableProducts = useMemo(() => {
    const deliveredOrders = orders.filter(
      (order) => getOrderStatus(order) === "delivered"
    );

    return deliveredOrders.flatMap((order) =>
      getOrderItems(order).map((item, index) => {
        const productId = getProductId(item);
        const orderId = String(order.id || order.orderId || order._id || "order");

        const existingReview = reviews.find(
          (review) =>
            String(review.orderId) === orderId &&
            String(review.productId) === productId
        );

        return {
          key: `${orderId}-${productId}-${index}`,
          orderId,
          productId,
          name: getProductName(item),
          image: getProductImage(item),
          price: item?.price || item?.product?.price || 0,
          existingReview,
        };
      })
    );
  }, [orders, reviews]);

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  }

  function saveAccountDetails(nextDetails) {
    setAccountDetails(nextDetails);
    writeStorage(ACCOUNT_KEY, nextDetails);

    const nextUser = {
      ...(currentUser || {}),
      ...nextDetails,
    };

    writeStorage(USER_KEY, nextUser);
    setCurrentUser(nextUser);
    window.dispatchEvent(new Event("nexiv-auth-change"));
  }

  function updateManagementField(field, value) {
    setManagementForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function beginEditing(field) {
    setEditingFields((previous) => ({ ...previous, [field]: true }));
    setManagementForm((previous) => ({
      ...previous,
      [field]:
        accountDetails[field] ||
        currentUser?.[field] ||
        (field === "username" ? currentUser?.name : "") ||
        "",
    }));
  }

  function cancelEditing(field) {
    setEditingFields((previous) => ({ ...previous, [field]: false }));

    setManagementForm((previous) => ({
      ...previous,
      [field]:
        accountDetails[field] ||
        currentUser?.[field] ||
        (field === "username" ? currentUser?.name : "") ||
        "",
    }));
  }

  function saveProfileField(field) {
    const value = String(managementForm[field] || "").trim();

    if (!value) {
      showNotice("Please enter a value before saving.");
      return;
    }

    if (field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      showNotice("Please enter a valid email address.");
      return;
    }

    if (field === "username") {
      const lastChange = accountDetails.usernameChangedAt;
      const daysSinceChange = lastChange
        ? (Date.now() - new Date(lastChange).getTime()) / 86400000
        : 7;

      if (lastChange && daysSinceChange < 7) {
        const daysLeft = Math.ceil(7 - daysSinceChange);
        showNotice(`You can change your username again in ${daysLeft} day(s).`);
        return;
      }
    }

    const nextDetails = {
      ...accountDetails,
      [field]: value,
    };

    if (field === "username") {
      nextDetails.usernameChangedAt = new Date().toISOString();
    }

    saveAccountDetails(nextDetails);
    setEditingFields((previous) => ({ ...previous, [field]: false }));
    showNotice(`${field === "username" ? "Username" : field[0].toUpperCase() + field.slice(1)} updated.`);
  }

  function savePassword() {
    const { currentPassword, newPassword, confirmPassword } = managementForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      showNotice("Complete all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      showNotice("Your new password must have at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      showNotice("The new passwords do not match.");
      return;
    }

    showNotice("Password form validated. Connect a secure backend to change your password.");
    setManagementForm((previous) => ({
      ...previous,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }));
    setEditingFields((previous) => ({ ...previous, password: false }));
  }

  function submitReview(product) {
    const draft = reviewDrafts[product.key] || {};
    const rating = Number(draft.rating) || 0;
    const comment = String(draft.comment || "").trim();

    if (rating < 1 || rating > 5) {
      showNotice("Please select a star rating.");
      return;
    }

    const newReview = {
      id: `${Date.now()}-${product.productId}`,
      productId: product.productId,
      productName: product.name,
      orderId: product.orderId,
      rating,
      comment,
      date: new Date().toISOString(),
      status: "submitted",
    };

    const nextReviews = [
      ...reviews.filter(
        (review) =>
          !(
            String(review.orderId) === product.orderId &&
            String(review.productId) === product.productId
          )
      ),
      newReview,
    ];

    setReviews(nextReviews);
    writeStorage(REVIEWS_KEY, nextReviews);

    const nextHistory = [
      {
        id: `review-${newReview.id}`,
        label: `Reviewed ${product.name}`,
        points: 20,
        type: "earned",
        status: "active",
        date: new Date().toISOString(),
      },
      ...pointsHistory,
    ];

    setPointsHistory(nextHistory);
    writeStorage(POINTS_KEY, nextHistory);

    setReviewDrafts((previous) => ({
      ...previous,
      [product.key]: { rating: 0, comment: "" },
    }));

    showNotice("Review submitted. You earned 20 points.");
  }

  function checkIn() {
    const today = new Date().toISOString().slice(0, 10);
    const alreadyCheckedIn = pointsHistory.some(
      (entry) =>
        entry.reason === "daily-check-in" &&
        String(entry.date || "").slice(0, 10) === today
    );

    if (alreadyCheckedIn) {
      showNotice("You've already checked in today.");
      return;
    }

    const nextHistory = [
      {
        id: `checkin-${Date.now()}`,
        label: "Daily check-in",
        reason: "daily-check-in",
        points: 10,
        type: "earned",
        status: "active",
        date: new Date().toISOString(),
      },
      ...pointsHistory,
    ];

    setPointsHistory(nextHistory);
    writeStorage(POINTS_KEY, nextHistory);
    showNotice("Daily check-in complete. You earned 10 points.");
  }

  function addAddress(event) {
    event.preventDefault();

    if (
      !addressForm.name.trim() ||
      !addressForm.phone.trim() ||
      !addressForm.street.trim() ||
      !addressForm.city.trim() ||
      !addressForm.state.trim()
    ) {
      showNotice("Please complete all address fields.");
      return;
    }

    const nextAddresses = [
      ...addresses,
      {
        ...addressForm,
        id: `address-${Date.now()}`,
        isDefault: addresses.length === 0,
      },
    ];

    setAddresses(nextAddresses);
    writeStorage(ADDRESSES_KEY, nextAddresses);
    setAddressForm({
      name: "",
      phone: "",
      street: "",
      city: "",
      state: "",
    });
    setAddressFormOpen(false);
    showNotice("Address saved.");
  }

  function removeAddress(id) {
    const nextAddresses = addresses.filter((address) => address.id !== id);
    setAddresses(nextAddresses);
    writeStorage(ADDRESSES_KEY, nextAddresses);
    showNotice("Address removed.");
  }

  function addPaymentMethod(event) {
  event.preventDefault();

  const nameOnCard = paymentForm.nameOnCard.trim();
  const cardNumber = paymentForm.cardNumber.replace(/\s/g, "");
  const expiryDate = paymentForm.expiryDate;
  const cvv = paymentForm.cvv;

  if (!nameOnCard || !/^\d{16}$/.test(cardNumber)) {
    showNotice("Enter the cardholder name and a valid 16-digit card number.");
    return;
  }

  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate)) {
    showNotice("Enter the expiry date in MM/YY format.");
    return;
  }

  const [month, year] = expiryDate.split("/").map(Number);
  const now = new Date();
  const currentMonth = now.getFullYear() * 12 + now.getMonth();
  const expiryMonth = (2000 + year) * 12 + month - 1;

  if (expiryMonth < currentMonth) {
    showNotice("This card has expired.");
    return;
  }

  if (!/^\d{3,4}$/.test(cvv)) {
    showNotice("Enter a valid 3 or 4-digit security code.");
    return;
  }

  const newPayment = {
    id: `payment-${Date.now()}`,
    nameOnCard,
    lastFour: cardNumber.slice(-4),
    expiryDate,
  };

  const nextPayments = [...paymentMethods, newPayment];

  setPaymentMethods(nextPayments);
  writeStorage(PAYMENTS_KEY, nextPayments);

  setPaymentForm({
    nameOnCard: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });

  setPaymentScreen("overview");
  showNotice("Card saved successfully.");
}

  function removePaymentMethod(id) {
  const nextPayments = paymentMethods.filter(
    (payment) => payment.id !== id
  );

  setPaymentMethods(nextPayments);
  writeStorage(PAYMENTS_KEY, nextPayments);

  showNotice("Saved card deleted successfully.");
}

  function redeemGiftCard(event) {
    event.preventDefault();

    if (!giftCode.trim()) {
      showNotice("Enter a gift card code.");
      return;
    }
  }

  function updateContactPreference(key, checked) {
    const nextPreferences = {
      ...contactPreferences,
      [key]: checked,
    };

    setContactPreferences(nextPreferences);
    writeStorage(CONTACT_KEY, nextPreferences);
  }

  function signOut() {
  signOutCurrent()
  setCurrentUser(null)
  navigate("/login")
}

function switchAccount() {
  navigate("/login?switch=1")
}

  function renderOrders() {
    const tabs = [
      ["all", "All orders"],
      ["processing", "Processing"],
      ["shipped", "Shipped"],
      ["delivered", "Delivered"],
      ["returns", "Returns"],
    ];

    return (
      <>
        <div className="nx-account-tabs">
          {tabs.map(([value, label]) => (
            <button
              type="button"
              key={value}
              className={orderTab === value ? "active" : ""}
              onClick={() => setOrderTab(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {filteredOrders.length === 0 ? (
          <EmptyState
            icon={<FaBoxOpen />}
            title="No orders here yet"
            action="Explore marketplace"
            onAction={() => navigate("/home")}
          />
        ) : (
          <div className="nx-order-list">
            {filteredOrders.map((order, index) => {
              const status = getOrderStatus(order);
              const items = getOrderItems(order);
              const orderId = order.id || order.orderId || order._id || `NX-${index + 1}`;

              return (
                <article className="nx-order-card" key={orderId}>
                  <div className="nx-order-top">
                    <div>
                      <span className="nx-muted">Order number</span>
                      <strong>#{orderId}</strong>
                    </div>
                    <span className={`nx-status nx-status-${status.replace(/\s+/g, "-")}`}>
                      {status}
                    </span>
                  </div>

                  <div className="nx-order-meta">
                    <span>Placed {formatDate(order.date || order.createdAt)}</span>
                    <span>{items.length} item(s)</span>
                  </div>

                  <div className="nx-order-products">
                    {items.slice(0, 3).map((item, itemIndex) => (
                      <div
                        className="nx-order-product"
                        key={`${getProductId(item)}-${itemIndex}`}
                      >
                        {getProductImage(item) ? (
                          <img src={getProductImage(item)} alt={getProductName(item)} />
                        ) : (
                          <div className="nx-product-placeholder">
                            <FaBoxOpen />
                          </div>
                        )}
                        <span>{getProductName(item)}</span>
                      </div>
                    ))}
                    {items.length > 3 && (
                      <span className="nx-muted">+{items.length - 3} more</span>
                    )}
                  </div>

                  <div className="nx-order-bottom">
                    <div>
                      <span className="nx-muted">Order total</span>
                      <strong>{money(order.total || order.totalAmount || order.amount)}</strong>
                    </div>
                    {status === "processing" && (
                      <span className="nx-order-help">
                        Payment or order processing is underway.
                      </span>
                    )}
                    {status === "delivered" && (
                      <button
                        type="button"
                        className="nx-text-button"
                        onClick={() => navigate("/account/reviews")}
                      >
                        Review items <FaArrowRight />
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </>
    );
  }

  function renderReviews() {
    if (reviewableProducts.length === 0) {
      return (
        <EmptyState
          icon={<FaStar />}
          title="No items ready for review"
          action="View orders"
          onAction={() => navigate("/account/orders")}
        />
      );
    }

    return (
      <div className="nx-review-list">
        {reviewableProducts.map((product) => {
          const draft = reviewDrafts[product.key] || {
            rating: 0,
            comment: "",
          };

          return (
            <article className="nx-review-card" key={product.key}>
              <div className="nx-review-product">
                {product.image ? (
                  <img src={product.image} alt={product.name} />
                ) : (
                  <div className="nx-product-placeholder">
                    <FaBoxOpen />
                  </div>
                )}
                <div>
                  <h3>{product.name}</h3>
                  <p>Order #{product.orderId}</p>
                  <span className="nx-delivered-label">
                    <FaCheckCircle /> Delivered
                  </span>
                </div>
              </div>

              {product.existingReview ? (
                <div className="nx-review-submitted">
                  <FaCheckCircle />
                  <div>
                    <strong>Review submitted</strong>
                    <p>
                      {"★".repeat(Number(product.existingReview.rating) || 0)}
                      {"☆".repeat(5 - (Number(product.existingReview.rating) || 0))}
                    </p>
                    {product.existingReview.comment && (
                      <p>{product.existingReview.comment}</p>
                    )}
                  </div>
                </div>
              ) : (
                <form
                  className="nx-review-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    submitReview(product);
                  }}
                >
                  <label>How would you rate this item?</label>
                  <div className="nx-star-picker" role="group" aria-label="Product rating">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        type="button"
                        key={rating}
                        aria-label={`${rating} star${rating > 1 ? "s" : ""}`}
                        className={rating <= draft.rating ? "selected" : ""}
                        onClick={() =>
                          setReviewDrafts((previous) => ({
                            ...previous,
                            [product.key]: { ...draft, rating },
                          }))
                        }
                      >
                        <FaStar />
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows="3"
                    placeholder="Share your experience (optional)"
                    value={draft.comment}
                    onChange={(event) =>
                      setReviewDrafts((previous) => ({
                        ...previous,
                        [product.key]: {
                          ...draft,
                          comment: event.target.value,
                        },
                      }))
                    }
                  />
                  <button type="submit" className="nx-primary-button">
                    Submit review
                  </button>
                </form>
              )}
            </article>
          );
        })}
      </div>
    );
  }

  function renderPoints() {
    const tabs = [
      ["all", "All points"],
      ["earned", "Earned"],
      ["used", "Used"],
      ["expired", "Expired"],
    ];

    return (
      <>
        <div className="nx-points-summary">
          <div className="nx-points-main">
            <span>AVAILABLE POINTS</span>
            <strong>{availablePoints.toLocaleString()}</strong>
            <p>Earn rewards as you shop on Nex-IV.</p>
          </div>
          <div className="nx-points-value">
            <span>Estimated reward value</span>
            <strong>{money(pointsValue)}</strong>
            <small>
              {POINTS_PER_NAIRA} point = {money(1 / POINTS_PER_NAIRA)}
            </small>
          </div>
        </div>

        <div className="nx-points-how">
          <div className="nx-section-heading">
            <div>
              <h3>How to earn points</h3>
            </div>
          </div>

          <div className="nx-earning-grid">
            <div className="nx-earning-card">
              <FaBoxOpen />
              <strong>Shop on Nex-IV</strong>
              <p>Earn points on eligible orders. Rewards may vary by order.</p>
            </div>
            <div className="nx-earning-card">
              <FaStar />
              <strong>Write a review</strong>
              <p>Earn 20 points for a review of an eligible delivered item.</p>
            </div>
            <div className="nx-earning-card">
              <FaRegCalendarCheck />
              <strong>Daily check-in</strong>
              <p>Earn 10 points when you check in each day.</p>
              <button type="button" onClick={checkIn}>Check in</button>
            </div>
            <div className="nx-earning-card">
              <FaUser />
              <strong>Complete registration</strong>
              <p>Registration rewards may be applied when your account is created.</p>
              <span className="nx-earning-reward">100 points</span>
            </div>
          </div>
        </div>

        <div className="nx-points-history">
          <div className="nx-section-heading">
            <div>
              <h3>Points history</h3>
            </div>
          </div>

          <div className="nx-account-tabs">
            {tabs.map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={pointsTab === value ? "active" : ""}
                onClick={() => setPointsTab(value)}
              >
                {label}
              </button>
            ))}
          </div>

          {filteredPoints.length === 0 ? (
            <EmptyState
              icon={<FaCoins />}
              title="No points history yet"
            />
          ) : (
            <div className="nx-points-list">
              {filteredPoints.map((entry, index) => (
                <div className="nx-points-row" key={entry.id || index}>
                  <div className="nx-points-row-icon">
                    <FaCoins />
                  </div>
                  <div className="nx-points-row-description">
                    <strong>{entry.label || entry.description || "Points activity"}</strong>
                    <span>{formatDate(entry.date || entry.createdAt)}</span>
                  </div>
                  <div className="nx-points-row-value">
                    <strong className={entry.type === "used" ? "negative" : ""}>
                      {entry.type === "used" ? "-" : "+"}
                      {Math.abs(Number(entry.points) || 0)} pts
                    </strong>
                    <span>{entry.status || entry.type || "active"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    );
  }

  function renderManagement() {
    const lastChange = accountDetails.usernameChangedAt;
    const canChangeUsername =
      !lastChange ||
      (Date.now() - new Date(lastChange).getTime()) / 86400000 >= 7;

    const usernameDaysLeft = lastChange
      ? Math.max(
          0,
          Math.ceil(
            7 - (Date.now() - new Date(lastChange).getTime()) / 86400000
          )
        )
      : 0;

    const fields = [
      {
        key: "username",
        label: "Username",
        icon: FaUser,
        hint: canChangeUsername
          ? "You can change your username once every 7 days."
          : `You can change your username again in ${usernameDaysLeft} day(s).`,
      },
      {
        key: "email",
        label: "Email address",
        icon: FaEnvelope,
        hint: "Use an email address you can access.",
      },
      {
        key: "phone",
        label: "Phone number",
        icon: FaPhone,
        hint: "Use a number where you can receive important updates.",
      },
    ];

    return (
      <div className="nx-management-list">
        <div className="nx-security-intro">
          <div className="nx-security-icon"><FaShieldAlt /></div>
          <div>
            <h3>Keep your account secure</h3>
          </div>
        </div>

        {fields.map(({ key, label, icon: Icon, hint }) => {
          const value = managementForm[key] || "";
          const editing = Boolean(editingFields[key]);
          const isUsername = key === "username";

          return (
            <div className="nx-management-row" key={key}>
              <div className="nx-management-label">
                <Icon />
                <div>
                  <strong>{label}</strong>
                  <span>{hint}</span>
                </div>
              </div>

              {editing ? (
                <div className="nx-management-editor">
                  <input
                    type={key === "email" ? "email" : "text"}
                    value={value}
                    disabled={isUsername && !canChangeUsername}
                    onChange={(event) => updateManagementField(key, event.target.value)}
                    placeholder={`Enter ${label.toLowerCase()}`}
                  />
                  <div className="nx-editor-actions">
                    <button
                      type="button"
                      className="nx-primary-button"
                      disabled={isUsername && !canChangeUsername}
                      onClick={() => saveProfileField(key)}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="nx-secondary-button"
                      onClick={() => cancelEditing(key)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="nx-management-value">
                  <span>
                    {value ||
                      (key === "phone" ? "Not added" : "Not provided")}
                  </span>
                  <button
                    type="button"
                    className="nx-edit-button"
                    onClick={() => beginEditing(key)}
                    disabled={isUsername && !canChangeUsername}
                  >
                    <FaEdit /> Edit
                  </button>
                </div>
              )}
            </div>
          );
        })}

        <div className="nx-management-row nx-password-row">
          <div className="nx-management-label">
            <FaLock />
            <div>
              <strong>Password</strong>
              <span>Use a strong password you don't use elsewhere.</span>
            </div>
          </div>

          {!editingFields.password ? (
            <div className="nx-management-value">
              <span>Not Added</span>
              <button
                type="button"
                className="nx-edit-button"
                onClick={() =>
                  setEditingFields((previous) => ({
                    ...previous,
                    password: true,
                  }))
                }
              >
                <FaEdit /> Edit
              </button>
            </div>
          ) : (
            <div className="nx-management-editor">
              <label>
                Current password
                <input
                  type={showPassword ? "text" : "password"}
                  value={managementForm.currentPassword || ""}
                  onChange={(event) =>
                    updateManagementField("currentPassword", event.target.value)
                  }
                />
              </label>
              <label>
                New password
                <input
                  type={showPassword ? "text" : "password"}
                  value={managementForm.newPassword || ""}
                  onChange={(event) =>
                    updateManagementField("newPassword", event.target.value)
                  }
                />
              </label>
              <label>
                Confirm new password
                <input
                  type={showPassword ? "text" : "password"}
                  value={managementForm.confirmPassword || ""}
                  onChange={(event) =>
                    updateManagementField("confirmPassword", event.target.value)
                  }
                />
              </label>
              <label className="nx-show-password">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(event) => setShowPassword(event.target.checked)}
                />
              </label>
              <div className="nx-editor-actions">
                <button
                  type="button"
                  className="nx-primary-button"
                  onClick={savePassword}
                >
                  Save password
                </button>
                <button
                  type="button"
                  className="nx-secondary-button"
                  onClick={() =>
                    setEditingFields((previous) => ({
                      ...previous,
                      password: false,
                    }))
                  }
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderAddresses() {
    return (
      <>
        <div className="nx-section-heading">
          <div>
            <h3>Your addresses</h3>
          </div>
          <button
            type="button"
            className="nx-primary-button"
            onClick={() => setAddressFormOpen((value) => !value)}
          >
            <FaPlus /> Add address
          </button>
        </div>

        {addressFormOpen && (
          <form className="nx-form-card" onSubmit={addAddress}>
            <div className="nx-form-grid">
              {[
                ["name", "Full name"],
                ["phone", "Phone number"],
                ["street", "Street address"],
                ["city", "City"],
                ["state", "State"],
              ].map(([key, label]) => (
                <label key={key}>
                  {label}
                  <input
                    required
                    value={addressForm[key]}
                    onChange={(event) =>
                      setAddressForm((previous) => ({
                        ...previous,
                        [key]: event.target.value,
                      }))
                    }
                  />
                </label>
              ))}
            </div>
            <button type="submit" className="nx-primary-button">Save address</button>
          </form>
        )}

        {addresses.length === 0 ? (
          <EmptyState
            icon={<FaMapMarkerAlt />}
            title="No saved addresses"
          />
        ) : (
          <div className="nx-address-grid">
            {addresses.map((address) => (
              <article className="nx-address-card" key={address.id}>
                <div className="nx-address-card-top">
                  <strong>{address.name}</strong>
                  {address.isDefault && <span className="nx-default-tag">Default</span>}
                </div>
                <p>{address.phone}</p>
                <p>{address.street}</p>
                <p>{address.city}, {address.state}</p>
                <button
                  type="button"
                  className="nx-text-button nx-danger-text"
                  onClick={() => removeAddress(address.id)}
                >
                  <FaTrash /> Remove
                </button>
              </article>
            ))}
          </div>
        )}
      </>
    );
  }

  
function renderPayments() {
  return (
    <div className="nx-payments-section">
      <div className="nx-section-heading">
        <button
          type="button"
          className="nx-primary-button"
          onClick={() => setPaymentForm((value) => !value)}
        >
          <FaPlus /> Add Card
        </button>
      </div>

      {paymentForm && (
  <form className="nx-form-card" onSubmit={addPaymentMethod}>
    <label>
      Name on card
      <input
        type="text"
        required
        autoComplete="cc-name"
        value={paymentForm.nameOnCard}
        onChange={(event) =>
          setPaymentForm((previous) => ({
            ...previous,
            nameOnCard: event.target.value,
          }))
        }
      />
    </label>

    <label>
      Card number
      <input
        type="text"
        required
        inputMode="numeric"
        autoComplete="cc-number"
        placeholder="0000 0000 0000 0000"
        maxLength={19}
        value={paymentForm.cardNumber}
        onChange={(event) => {
          const digits = event.target.value
            .replace(/\D/g, "")
            .slice(0, 16);

          const formatted = digits.replace(/(\d{4})(?=\d)/g, "$1 ");

          setPaymentForm((previous) => ({
            ...previous,
            cardNumber: formatted,
          }));
        }}
      />
    </label>

    <div className="nx-payment-input-row">
      <label>
        Expiry date
        <input
          type="text"
          required
          autoComplete="cc-exp"
          inputMode="numeric"
          placeholder="MM/YY"
          maxLength={5}
          value={paymentForm.expiryDate}
          onChange={(event) => {
            let digits = event.target.value
              .replace(/\D/g, "")
              .slice(0, 4);

            if (digits.length > 2) {
              digits = `${digits.slice(0, 2)}/${digits.slice(2)}`;
            }

            setPaymentForm((previous) => ({
              ...previous,
              expiryDate: digits,
            }));
          }}
        />
      </label>

      <label>
        CVV
        <input
          type="password"
          required
          inputMode="numeric"
          autoComplete="cc-csc"
          placeholder="123"
          maxLength={4}
          value={paymentForm.cvv}
          onChange={(event) =>
            setPaymentForm((previous) => ({
              ...previous,
              cvv: event.target.value.replace(/\D/g, "").slice(0, 4),
            }))
          }
        />
      </label>
    </div>

    <div className="nx-payment-form-actions">
      <button type="submit" className="nx-primary-button">
         Save card
      </button>

      <button
        type="button"
        className="nx-payment-cancel"
        onClick={() => {
          setPaymentScreen("overview");
          setPaymentForm({
            nameOnCard: "",
            cardNumber: "",
            expiryDate: "",
            cvv: "",
          });
        }}
      >
        Cancel
      </button>
    </div>
  </form>
)}

      {paymentMethods.length === 0 ? (
        <EmptyState
          icon={<FaCreditCard />}
          title="No saved payment methods"
        />
      ) : (
        <div className="nx-payment-list">
          {paymentMethods.map((payment) => (
            <article className="nx-payment-card" key={payment.id}>
              <div className="nx-payment-card-visual">
  <div className="nx-payment-card-top">
    <span>NEX-IV</span>
  </div>

  <div className="nx-payment-card-number">
    •••• •••• •••• {payment.lastFour}
  </div>

  <div className="nx-payment-card-bottom">
    <div>
      <small>CARDHOLDER</small>
      <span>
        {payment.nameOnCard || payment.label || "CARDHOLDER"}
      </span>
    </div>

    <div>
      <small>EXPIRES</small>
      <span>{payment.expiryDate || "••/••"}</span>
    </div>
  </div>
</div>

<div className="nx-payment-card-details">
  <button
    type="button"
    className="nx-payment-delete"
    onClick={() => removePaymentMethod(payment.id)}
    aria-label={`Delete card ending in ${payment.lastFour}`}
  >
    <FaTrash />
  </button>
</div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}


  function renderCoupons() {
    if (coupons.length === 0) {
      return (
        <EmptyState
          icon={<FaTicketAlt />}
          title="No coupons available"
          action="Explore deals"
          onAction={() => navigate("/home")}
        />
      );
    }

    return (
      <div className="nx-coupon-grid">
        {coupons.map((coupon, index) => (
          <article className="nx-coupon-card" key={coupon.id || index}>
            <div>
              <span>{coupon.title || coupon.name || "Nex-IV offer"}</span>
              <strong>{coupon.code || "Offer"}</strong>
              <p>{coupon.description || "Use this offer on eligible purchases."}</p>
              {coupon.expiry && <small>Expires {formatDate(coupon.expiry)}</small>}
            </div>
          </article>
        ))}
      </div>
    );
  }

  function renderWishlist() {
    return <Wishlist embedded />;
  }

  function renderGiftCards() {
    return (
      <div className="nx-gift-card-section">
        <div className="nx-gift-card-hero">
          <img src="https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D"/>
        </div>
        <form className="nx-form-card" onSubmit={redeemGiftCard}>
          <label>
            Gift card code
            <input
              value={giftCode}
              onChange={(event) => setGiftCode(event.target.value)}
              placeholder="Enter your gift card code"
            />
          </label>
          <button type="submit" className="nx-primary-button">Redeem gift card</button>
          {giftBalance > 0 && <p>Demo balance: {money(giftBalance)}</p>}
        </form>
      </div>
    );
  }

  function renderContactPreferences() {
    const options = [
      ["email", "Email", "Receive account and shopping communications by email."],
      ["sms", "SMS", "Receive eligible updates by text message."],
      ["whatsapp", "WhatsApp", "Receive eligible updates through WhatsApp."],
      ["orderUpdates", "Order updates", "Get updates about processing, shipping, and delivery."],
      ["promotions", "Offers and promotions", "Hear about offers, new arrivals, and marketplace deals."],
    ];

    return (
      <div className="nx-preferences-list">
        {options.map(([key, label, description]) => (
          <label className="nx-preference-row" key={key}>
            <div>
              <strong>{label}</strong>
              <span>{description}</span>
            </div>
            <input
              type="checkbox"
              checked={Boolean(contactPreferences[key])}
              onChange={(event) =>
                updateContactPreference(key, event.target.checked)
              }
            />
          </label>
        ))}
      </div>
    );
  }

  function renderSimpleSection() {
    switch (activeSection) {
      case "overview":
        return (
          <div className="nx-overview">

            <div className="nx-overview-stats">
              <button type="button" onClick={() => navigate("/account/orders")}>
                <span><FaBoxOpen /></span>
                <strong>{orders.length}</strong>
                <small>Total orders</small>
              </button>
              <button type="button" onClick={() => navigate("/account/points")}>
                <span><FaCoins /></span>
                <strong>{availablePoints.toLocaleString()}</strong>
                <small>Available points</small>
              </button>
              <button type="button" onClick={() => navigate("/account/wishlist")}>
                <span><FaHeart /></span>
                <strong>{wishlistItems.length}</strong>
                <small>Saved items</small>
              </button>
              <button type="button" onClick={() => navigate("/account/reviews")}>
                <span><FaStar /></span>
                <strong>{reviewableProducts.filter((product) => !product.existingReview).length}</strong>
                <small>Items to review</small>
              </button>
            </div>

            <div className="nx-overview-lower">
              <section className="nx-overview-panel">
                <div className="nx-section-heading">
                  <div>
                    <h3>Recent orders</h3>
                  </div>
                  <button
                    type="button"
                    className="nx-text-button"
                    onClick={() => navigate("/account/orders")}
                  >
                    View all <FaArrowRight />
                  </button>
                </div>

                {orders.length === 0 ? (
                  <p className="nx-inline-empty">Your orders will appear here.</p>
                ) : (
                  orders.slice(0, 3).map((order, index) => (
                    <div className="nx-recent-order" key={order.id || order.orderId || index}>
                      <span className="nx-recent-order-icon"><FaReceipt /></span>
                      <div>
                        <strong>Order #{order.id || order.orderId || index + 1}</strong>
                        <span>{formatDate(order.date || order.createdAt)}</span>
                      </div>
                      <span className={`nx-status nx-status-${getOrderStatus(order).replace(/\s+/g, "-")}`}>
                        {getOrderStatus(order)}
                      </span>
                    </div>
                  ))
                )}
              </section>

              <section className="nx-overview-panel nx-quick-links">
                <h3>Quick links</h3>
                <button type="button" onClick={() => navigate("/account/addresses")}>
                  <FaMapMarkerAlt /> Address book <FaChevronRight />
                </button>
                <button type="button" onClick={() => navigate("/account/payments")}>
                  <FaCreditCard /> Payment methods <FaChevronRight />
                </button>
                <button type="button" onClick={() => navigate("/account/management")}>
                  <FaShieldAlt /> Account management <FaChevronRight />
                </button>
                <button type="button" onClick={() => navigate("/account/contact-preferences")}>
                  <FaSlidersH /> Contact preferences <FaChevronRight />
                </button>
              </section>
            </div>
          </div>
        );

      case "orders":
case "processing":
case "shipped":
case "delivered":
case "returns":
  return renderOrders();

      case "reviews":
        return renderReviews();

      case "points":
case "points-earned":
case "points-used":
case "points-expired":
  return renderPoints();

      case "management":
        return renderManagement();

      case "addresses":
        return renderAddresses();

      case "payments":
        return renderPayments();

      case "coupons":
        return renderCoupons();

      case "wishlist":
        return renderWishlist();

      case "giftcards":
        return renderGiftCards();

      case "contact-preferences":
        return renderContactPreferences();

      case "following":
        return (
          <EmptyState
            icon={<FaStore />}
            title="No followed vendors yet"
            action="Explore vendors"
            onAction={() => navigate("/home")}
          />
        );

      case "language":
        return (
          <div className="nx-form-card">
            <h3>Language and region</h3>
            <label>
              Display language
              <select defaultValue="en">
                <option value="en">English</option>
                <option>Francais</option>
                <option>Espanol</option>
              </select>
            </label>
            <label>
              Currency
              <select defaultValue="NGN - &#8358;">
                <option>NGN - &#8358;</option>
                <option>Euro - &euro;</option>
                <option>US Dollar - $</option>
                <option>Canadian Dollar - C$</option>
              </select>
            </label>
          </div>
        );


      default:
        return (
          <EmptyState
            icon={<FaUser />}
            title="Account section not found"
            description="Choose a section from the menu to continue."
            action="Back to account"
            onAction={() => navigate("/account")}
          />
        );
    }
  }

  const sectionTitles = {
    overview: "Account overview",
    orders: "My orders",
    processing: "Processing orders",
    shipped: "Shipped orders",
    delivered: "Delivered orders",
    returns: "Returns and refunds",
    reviews: "My reviews",
    points: "My points",
    "points-earned": "Earned points",
    "points-used": "Used points",
    "points-expired": "Expired points",
    management: "Account management",
    addresses: "Address book",
    payments: "Payment methods",
    coupons: "My coupons",
    wishlist: "My wishlist",
    giftcards: "Gift cards",
    following: "Following",
    language: "Language and region",
    notifications: "Notifications",
    "contact-preferences": "Contact preferences",
  };

  return (
    <main className="nx-account-page">
      <div className="nx-account-breadcrumb">
        <Link to="/home">Home</Link>
        <FaChevronRight />
        <span>My account</span>
        {activeSection !== "overview" && (
          <>
            <FaChevronRight />
            <span>{sectionTitles[activeSection] || "Account"}</span>
          </>
        )}
      </div>

      {notice && (
        <div className="nx-account-notice" role="status">
          <FaCheckCircle />
          <span>{notice}</span>
          <button type="button" aria-label="Dismiss notice" onClick={() => setNotice("")}>
            <FaTimes />
          </button>
        </div>
      )}

      <div className="nx-account-layout">
        <aside className="nx-account-sidebar">
          <div className="nx-account-user">
            <div className="nx-account-avatar">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>Hi, {displayName}</strong>
            </div>
          </div>

          <Link
            to="/account"
            className={`nx-sidebar-overview ${activeSection === "overview" ? "active" : ""}`}
          >
            <FaUser /> Account overview
          </Link>

          {navigationGroups.map((group) => (
            <div className="nx-sidebar-group" key={group.title}>
              <h3>{group.title}</h3>
              {group.items.map(({ label, section: itemSection, icon: Icon }) => (
                <Link
                  to={`/account/${itemSection}`}
                  key={itemSection}
                  className={`nx-sidebar-link ${
                    activeSection === itemSection ||
                    (itemSection === "points" && activeSection.startsWith("points-"))
                      ? "active"
                      : ""
                  }`}
                >
                  <Icon />
                  <span>{label}</span>
                  <FaChevronRight className="nx-sidebar-chevron" />
                </Link>
              ))}
            </div>
          ))}

          <div className="nx-sidebar-bottom">
  <button type="button" onClick={switchAccount}>
    <FaExchangeAlt /> Switch account
  </button>
  <button type="button" onClick={signOut}>
    <FaSignOutAlt /> Sign out
  </button>
</div>
        </aside>

        <section className="nx-account-content">
          <div className="nx-account-content-heading">
            <div>
              <span className="nx-eyebrow">NEX-IV / MY ACCOUNT</span>
              <h1>{sectionTitles[activeSection] || "My account"}</h1>
            </div>
          </div>

          {renderSimpleSection()}
        </section>
      </div>
    </main>
  );
}

function EmptyState({ icon, title, description, action, onAction }) {
  return (
    <div className="nx-empty-state">
      <div className="nx-empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action && (
        <button type="button" className="nx-primary-button" onClick={onAction}>
          {action} <FaArrowRight />
        </button>
      )}
    </div>
  );
}