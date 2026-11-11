import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight,
  Plus,
  CreditCard,
  Lock,
  Calendar,
  Check,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import "../styles/Payment.css";

const PAYMENTS_KEY = "nexivPaymentMethods";

function readSavedCards() {
  try {
    const saved = localStorage.getItem(PAYMENTS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveCards(cards) {
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(cards));
}

function getCardBrand(number = "") {
  const digits = number.replace(/\D/g, "");

  if (/^4/.test(digits)) return "Visa";
  if (/^5[1-5]/.test(digits)) return "Mastercard";
  if (/^506|^507|^650/.test(digits)) return "Verve";

  return "Card";
}

function formatCardNumber(value) {
  return value
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function PaymentCard({ card, selected, onSelect }) {
  return (
    <motion.button
      type="button"
      className={`payment-saved-card ${selected ? "selected" : ""}`}
      onClick={onSelect}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      role="radio"
      aria-checked={selected}
    >
      <div className="payment-card-top">
        <span className="payment-card-brand">
          {card.brand || "CARD"}
        </span>

        <span className={`payment-card-check ${selected ? "active" : ""}`}>
          {selected && <Check size={14} />}
        </span>
      </div>

      <CreditCard size={27} strokeWidth={1.5} />

      <div className="payment-card-number">
        •••• •••• •••• {card.lastFour}
      </div>

      <div className="payment-card-bottom">
        <div>
          <span>CARDHOLDER</span>
          <strong>{card.nameOnCard}</strong>
        </div>

        <div>
          <span>EXPIRES</span>
          <strong>{card.expiryDate}</strong>
        </div>
      </div>
    </motion.button>
  );
}

function CardDetailsForm({ onSave, onBack }) {
  const [form, setForm] = useState({
    nameOnCard: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });

  const [error, setError] = useState("");

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    const digits = form.cardNumber.replace(/\D/g, "");
    const expiry = form.expiryDate;

    if (digits.length < 13 || digits.length > 19) {
      setError("Enter a valid card number.");
      return;
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
      setError("Enter a valid expiry date in MM/YY format.");
      return;
    }

    const [month, year] = expiry.split("/").map(Number);
    const currentDate = new Date();
    const expiryDate = new Date(2000 + year, month);

    if (expiryDate <= new Date(
      currentDate.getFullYear(),
      currentDate.getMonth()
    )) {
      setError("This card has expired.");
      return;
    }

    if (!/^\d{3,4}$/.test(form.cvv)) {
      setError("Enter a valid CVV.");
      return;
    }

    if (!form.nameOnCard.trim()) {
      setError("Enter the name on your card.");
      return;
    }

    const newCard = {
      id: `card-${Date.now()}`,
      nameOnCard: form.nameOnCard.trim(),
      lastFour: digits.slice(-4),
      expiryDate: form.expiryDate,
      brand: getCardBrand(digits),
    };

    onSave(newCard);
  };

  return (
    <motion.div
      className="payment-details-layout"
      initial={{ opacity: 0, x: 35 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -35 }}
      transition={{ duration: 0.35 }}
    >
      <div className="payment-form-heading">
        <button
          type="button"
          className="payment-back-button"
          onClick={onBack}
        >
          <ArrowLeft size={17} />
          Back
        </button>

        <span className="payment-eyebrow">NEW PAYMENT METHOD</span>
        <h2>Card details</h2>
        <p>
          Add your card details to save it to your Nex-IV account.
        </p>
      </div>

      <form className="payment-details-form" onSubmit={handleSubmit}>
        <label>
          Cardholder name

          <input
            type="text"
            placeholder="Name on card"
            autoComplete="cc-name"
            value={form.nameOnCard}
            onChange={(event) =>
              updateField("nameOnCard", event.target.value)
            }
            required
          />
        </label>

        <label>
          Card number

          <div className="payment-input-icon">
            <CreditCard size={18} />

            <input
              type="text"
              inputMode="numeric"
              placeholder="0000 0000 0000 0000"
              autoComplete="cc-number"
              value={form.cardNumber}
              onChange={(event) =>
                updateField(
                  "cardNumber",
                  formatCardNumber(event.target.value)
                )
              }
              required
            />
          </div>
        </label>

        <div className="payment-form-row">
          <label>
            Expiry date

            <div className="payment-input-icon">
              <Calendar size={17} />

              <input
                type="text"
                inputMode="numeric"
                placeholder="MM/YY"
                autoComplete="cc-exp"
                maxLength={5}
                value={form.expiryDate}
                onChange={(event) => {
                  let value = event.target.value.replace(/\D/g, "").slice(0, 4);

                  if (value.length > 2) {
                    value = `${value.slice(0, 2)}/${value.slice(2)}`;
                  }

                  updateField("expiryDate", value);
                }}
                required
              />
            </div>
          </label>

          <label>
            CVV

            <div className="payment-input-icon">
              <Lock size={17} />

              <input
                type="password"
                inputMode="numeric"
                placeholder="•••"
                autoComplete="cc-csc"
                maxLength={4}
                value={form.cvv}
                onChange={(event) =>
                  updateField(
                    "cvv",
                    event.target.value.replace(/\D/g, "").slice(0, 4)
                  )
                }
                required
              />
            </div>
          </label>
        </div>

        {error && (
          <p className="payment-error" role="alert">
            {error}
          </p>
        )}

        <div className="payment-security-note">
          <ShieldCheck size={19} />
          <span>
            Your full card number and CVV are not stored in your account.
          </span>
        </div>

        <button type="submit" className="payment-primary-button">
          Save payment method
          <ArrowRight size={18} />
        </button>
      </form>
    </motion.div>
  );
}

export default function Payment({ amount = 0, onContinue }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isAddingCard = location.pathname.endsWith("/add");

  const [cards, setCards] = useState(readSavedCards);
  const [selectedId, setSelectedId] = useState(
    () => readSavedCards()[0]?.id ?? null
  );


  useEffect(() => {
    const syncCards = () => {
      const updatedCards = readSavedCards();

      setCards(updatedCards);

      setSelectedId((previous) =>
        updatedCards.some((card) => card.id === previous)
          ? previous
          : updatedCards[0]?.id ?? null
      );
    };

    window.addEventListener("storage", syncCards);
    window.addEventListener("nexiv-payment-change", syncCards);

    return () => {
      window.removeEventListener("storage", syncCards);
      window.removeEventListener("nexiv-payment-change", syncCards);
    };
  }, []);

  const selectedCard = cards.find(
    (card) => card.id === selectedId
  );

  const openAddCard = () => {
    navigate("/checkout/payment/add");
  };

  const returnToPayment = () => {
    navigate("/checkout/payment");
  };

  const handleSaveCard = (newCard) => {
    const updatedCards = [...cards, newCard];

    saveCards(updatedCards);
    setCards(updatedCards);
    setSelectedId(newCard.id);

    window.dispatchEvent(new Event("nexiv-payment-change"));

    returnToPayment();
  };

  const removeCard = (id) => {
    const updatedCards = cards.filter((card) => card.id !== id);

    saveCards(updatedCards);
    setCards(updatedCards);

    setSelectedId((previous) =>
      previous === id ? updatedCards[0]?.id ?? null : previous
    );

    window.dispatchEvent(new Event("nexiv-payment-change"));
  };

  const handleContinue = () => {
    if (!selectedCard) return;

    onContinue?.(selectedCard);
  };

  return (
    <main className="nx-payment-page">
      <div className="nx-payment-container">
        <div className="nx-payment-topbar">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="payment-back-button"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <span className="payment-secure-label">
            <Lock size={14} />
            SECURE CHECKOUT
          </span>
        </div>

        <AnimatePresence mode="wait">
          {isAddingCard ? (
            <CardDetailsForm
              key="card-details"
              onSave={handleSaveCard}
              onBack={returnToPayment}
            />
          ) : cards.length === 0 ? (
            <CardDetailsForm
              key="first-card"
              onSave={handleSaveCard}
              onBack={() => navigate(-1)}
            />
          ) : (
            <motion.section
              key="saved-cards"
              className="payment-saved-screen"
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="payment-form-heading">
                <span className="payment-eyebrow">
                  CHECKOUT
                </span>

                <h1>Choose how to pay.</h1>

                <p>
                  Select one of your saved payment methods
                  or add a new card.
                </p>
              </div>

              <div className="payment-saved-heading">
                <h3>Saved cards</h3>

                <button
                  type="button"
                  className="payment-add-button"
                  onClick={openAddCard}
                >
                  <Plus size={17} />
                  Add payment method
                </button>
              </div>

              <div className="payment-saved-grid" role="radiogroup">
                {cards.map((card) => (
                  <div className="payment-saved-item" key={card.id}>
                    <PaymentCard
                      card={card}
                      selected={selectedId === card.id}
                      onSelect={() => setSelectedId(card.id)}
                    />

                    <button
                      type="button"
                      className="payment-remove-button"
                      onClick={() => removeCard(card.id)}
                      aria-label={`Remove card ending in ${card.lastFour}`}
                    >
                      <Trash2 size={15} />
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="payment-summary">
                <div>
                  <span>Payment amount</span>
                  <strong>
                    ₦{Number(amount).toLocaleString("en-NG")}
                  </strong>
                </div>

                <button
                  type="button"
                  className="payment-primary-button"
                  disabled={!selectedCard}
                  onClick={handleContinue}
                >
                  Continue
                  <ArrowRight size={18} />
                </button>
              </div>

              <div className="payment-security-note">
                <ShieldCheck size={19} />
                <span>
                  Your saved card details are protected.
                </span>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
