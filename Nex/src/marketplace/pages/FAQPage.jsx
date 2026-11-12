import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import {
  Plus,
  Search,
  Truck,
  RefreshCcw,
  CreditCard,
  UserRound,
  Store,
  ShoppingBag,
  MessageCircle,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import "../styles/FAQPage.css";

const categories = [
  { id: "about", label: "About Nex-IV", icon: ShoppingBag },
  { id: "delivery", label: "Delivery", icon: Truck },
  { id: "returns", label: "Returns & Refunds", icon: RefreshCcw },
  { id: "payment", label: "Payments", icon: CreditCard },
  { id: "account", label: "Account Issues", icon: UserRound },
  { id: "vendor", label: "Become a Vendor", icon: Store },
];

const faqData = {
  about: [
    {
      question: "What is Nex-IV?",
      answer:
        "Nex-IV is a multi-vendor marketplace designed to bring different products and independent sellers together in one place. You can explore products across categories, compare options, discover vendors, and shop from the convenience of one platform.",
    },
    {
      question: "How does Nex-IV work?",
      answer:
        "Browse products by category, search for something specific, or discover items picked for you. When you find something you like, add it to your cart and follow the available checkout steps. Products may come from different vendors, so check each listing for its details.",
    },
    {
      question: "Are the products sold directly by Nex-IV?",
      answer:
        "Nex-IV is a marketplace where products can be listed by independent vendors. The vendor name displayed on a product helps you identify the seller. Check the product listing and vendor information before placing an order.",
    },
    {
      question: "How can I find a particular product?",
      answer:
        "Use the search bar to search by product name, brand, or relevant keywords. You can also explore the Categories menu and browse product collections to discover more options.",
    },
    {
      question: "How do I contact a vendor about a product?",
      answer:
        "Check the product page for the available vendor information and contact options. If you need help with an order or cannot find a contact option, reach out to Nex-IV support through the available support channel.",
    },
  ],

  delivery: [
    {
      question: "Where does Nex-IV deliver?",
      answer:
        "Delivery availability depends on the service areas supported by Nex-IV and the seller or delivery option associated with your order. Check the delivery information available during checkout before completing your purchase.",
    },
    {
      question: "How much does delivery cost?",
      answer:
        "Delivery charges may vary depending on your delivery address, order, vendor, and available delivery service. Review the delivery fee displayed at checkout before confirming your order.",
    },
    {
      question: "How long will my order take to arrive?",
      answer:
        "Delivery times can vary depending on your location, product availability, vendor processing time, and the delivery service. Check the estimated delivery information provided for your order. If your order is delayed beyond the estimate, contact support with your order details.",
    },
    {
      question: "Can I track my order?",
      answer:
        "If tracking is available for your order, check your account's Orders section for the latest order status and any tracking details provided. If tracking information is unavailable or has not updated, contact support for assistance.",
    },
    {
      question: "What should I do if my order has not arrived?",
      answer:
        "First, check your order status and any delivery updates. Confirm that your delivery details are correct. If the order is overdue or the tracking information does not help, contact Nex-IV support with your order number.",
    },
    {
      question: "Can I change my delivery address after ordering?",
      answer:
        "Address changes may depend on whether the order has already been processed or dispatched. Contact support as soon as possible if you need to make a change. An address change may not be possible once delivery is underway.",
    },
  ],

  returns: [
    {
      question: "Can I return a product?",
      answer:
        "Return eligibility depends on the applicable Nex-IV return policy, the product category, and the condition of the item. Review the return terms before purchasing. If you receive an item that is damaged, incorrect, or materially different from its listing, contact support for guidance.",
    },
    {
      question: "How do I request a return?",
      answer:
        "Open your Orders section and select the relevant order if a return option is available. Follow the instructions provided. If you cannot find a return option, contact support with your order number, the item details, and the reason for the return.",
    },
    {
      question: "What if I receive a damaged or incorrect item?",
      answer:
        "Contact support as soon as possible. Include your order number, a description of the issue, and clear photographs of the item and packaging where appropriate. Keep the item and its packaging until you receive instructions on the next steps.",
    },
    {
      question: "When will I receive my refund?",
      answer:
        "Refund timing depends on the outcome of the return or refund review and the payment provider's processing time. Once a refund is approved, follow the status updates provided by Nex-IV. Contact support if you need clarification about your refund.",
    },
    {
      question: "Can I cancel an order?",
      answer:
        "Cancellation may be possible before an order is processed or dispatched. Open your Orders section to check whether cancellation is available. If the option is unavailable, contact support promptly. A dispatched order may need to follow the applicable return process instead.",
    },
    {
      question: "Are all products eligible for returns?",
      answer:
        "Not necessarily. Some product categories or item conditions may have specific return restrictions. Check the return policy applicable to the product before ordering, and contact support if you need clarification about an item's eligibility.",
    },
  ],

  payment: [
    {
      question: "Which payment methods can I use?",
      answer:
        "Available payment methods are the ones displayed during checkout. Review the options shown for your order before proceeding. Payment methods may depend on the payment services currently supported by Nex-IV.",
    },
    {
      question: "What should I do if my payment fails?",
      answer:
        "Check that your payment details are correct and that your bank or payment provider has not declined the transaction. You can try again using an available payment method. If money was deducted despite a failed checkout, keep the transaction reference and contact support before repeatedly attempting payment.",
    },
    {
      question: "I was charged, but my order was not confirmed. What now?",
      answer:
        "Check your Orders section first to see whether the order was created. If it was not, save your payment receipt, transaction reference, amount, and payment time, then contact support. Avoid sharing your password, PIN, or one-time password with anyone.",
    },
    {
      question: "What should I do if I am charged twice?",
      answer:
        "Check your bank or payment statement to determine whether both transactions were completed or one is still pending. Save the references for both transactions and contact support for an investigation. Your bank or payment provider may also be able to clarify the transaction status.",
    },
    {
      question: "Is it safe to pay on Nex-IV?",
      answer:
        "Use only the payment options presented through the official Nex-IV checkout process. Never share your card PIN, banking password, or one-time password with a seller or support representative. If you suspect fraudulent activity, contact your payment provider promptly.",
    },
    {
      question: "Can I change my payment method after placing an order?",
      answer:
        "Payment method changes depend on the order status and the payment options supported by the platform. Check your order details or contact support if you need help with an existing payment.",
    },
  ],

  account: [
    {
      question: "How do I create a Nex-IV account?",
      answer:
        "Select the account or registration option on Nex-IV and complete the requested details. Follow the on-screen instructions to finish setting up your account.",
    },
    {
      question: "I forgot my password. How can I reset it?",
      answer:
        "Open the sign-in page and select Forgot Password. Follow the instructions provided to reset your password. If you do not receive a reset message, check your spam folder and confirm that you entered the correct email address.",
    },
    {
      question: "Why can't I sign in to my account?",
      answer:
        "Check that you are using the correct email address and password. If you have forgotten your password, use the reset option. If the problem continues, contact support and describe the error you see without sharing your password.",
    },
    {
      question: "How do I update my account details?",
      answer:
        "Sign in and open your account or profile section. If the details you want to change are editable, update them and save your changes. Contact support if an important detail cannot be changed through your account.",
    },
    {
      question: "What if I no longer have access to my registered email?",
      answer:
        "Contact Nex-IV support and explain that you can no longer access your registered email. You may be asked to complete verification before account access or contact details can be changed.",
    },
    {
      question: "How can I keep my account secure?",
      answer:
        "Use a strong, unique password, sign out on shared devices, and never share your login credentials or verification codes. Be cautious of messages asking you to make payments outside the official checkout or reveal confidential information.",
    },
  ],

  vendor: [
    {
      question: "How can I become a Nex-IV vendor?",
      answer:
        "Start by looking for the vendor registration or Become a Vendor option on Nex-IV. Follow the application steps and provide the business and contact information requested. If vendor registration is not currently available on your account, contact Nex-IV support to ask about onboarding.",
    },
    {
      question: "Who can sell on Nex-IV?",
      answer:
        "Businesses and eligible sellers may apply to sell products through the marketplace, subject to Nex-IV's onboarding requirements and applicable rules. Prepare accurate business details and information about the products you intend to list.",
    },
    {
      question: "What information do I need to register as a vendor?",
      answer:
        "You may need contact details, business information, product categories, and any verification documents requested during onboarding. Follow the current registration instructions for the exact requirements.",
    },
    {
      question: "How do I list products in my vendor store?",
      answer:
        "Once your vendor account is approved and the relevant seller tools are available, follow the product-listing process. Provide accurate product names, descriptions, prices, images, stock information, and any required product details.",
    },
    {
      question: "How do vendor payments work?",
      answer:
        "Vendor payment arrangements depend on the seller terms and payment process established by Nex-IV. Review the terms provided during onboarding and confirm payout schedules, fees, and any applicable conditions before selling.",
    },
    {
      question: "Can I update my products and prices?",
      answer:
        "If your vendor dashboard supports product management, use it to update listings, prices, descriptions, and stock information. Keep listings accurate and promptly update products that are unavailable.",
    },
    {
      question: "Who handles customer orders and returns?",
      answer:
        "Order fulfilment and return responsibilities depend on the vendor agreement and the policies that apply to the order. Review your vendor terms so you understand your responsibilities for processing orders, responding to customer concerns, and handling eligible returns.",
    },
    {
      question: "How can I get help with my vendor account?",
      answer:
        "Contact Nex-IV support using the available support channel. Include your vendor account details and a clear description of the issue, but do not share your password or confidential payment credentials.",
    },
  ],
};

function FAQPage() {
  const location = useLocation();

  const [selectedCategory, setSelectedCategory] = useState("about");
  const [openQuestion, setOpenQuestion] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  /* The footer links straight to /faq#delivery and /faq#returns —
     switch category and clear any search when the hash changes. */
  useEffect(() => {
    const hashCategory = location.hash.replace("#", "");

    if (
      location.pathname === "/faq" &&
      ["delivery", "returns"].includes(hashCategory)
    ) {
      // Syncing state from the URL hash — this mirrors the reference help-centre behavior.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedCategory(hashCategory);
      setSearchTerm("");
      setOpenQuestion(null);
    }
  }, [location.pathname, location.hash]);

  /* Smooth-scroll to the questions once the selected category has
     actually rendered (frame-deferred like the reference app). */
  useEffect(() => {
    const hashCategory = location.hash.replace("#", "");

    if (
      location.pathname !== "/faq" ||
      !["delivery", "returns"].includes(hashCategory) ||
      selectedCategory !== hashCategory
    ) {
      return;
    }

    let secondFrame;

    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        const target = document.getElementById("faq-questions");

        if (target) {
          const top =
            target.getBoundingClientRect().top + window.scrollY - 100;

          window.scrollTo({ top, behavior: "smooth" });
        }
      });
    });

    return () => {
      cancelAnimationFrame(firstFrame);
      if (secondFrame) cancelAnimationFrame(secondFrame);
    };
  }, [location.pathname, location.hash, selectedCategory]);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const currentQuestions = faqData[selectedCategory] || [];

  const filteredQuestions = currentQuestions.filter((faq) => {
    return (
      faq.question.toLowerCase().includes(normalizedSearch) ||
      faq.answer.toLowerCase().includes(normalizedSearch)
    );
  });

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setOpenQuestion(null);
  };

  return (
    <main className="nx-faq">
      <section className="nx-faq-hero">
        <div className="nx-faq-hero-glow" />

        <motion.div
          className="nx-faq-hero-content"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <span className="nx-faq-kicker">
            <span className="nx-faq-kicker-dot" />
            NEX-IV HELP CENTRE
          </span>

          <h1>
            Questions?
            <br />
            <span>We've got answers.</span>
          </h1>
          <label className="nx-faq-search">
            <Search size={19} aria-hidden="true" />

            <input
              type="search"
              placeholder="Search for answers..."
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setOpenQuestion(null);
              }}
              aria-label="Search frequently asked questions"
            />

            {searchTerm && (
              <button
                type="button"
                className="nx-faq-clear"
                onClick={() => {
                  setSearchTerm("");
                  setOpenQuestion(null);
                }}
                aria-label="Clear search"
              >
              </button>
            )}
          </label>

          <div className="nx-faq-hero-note">
            <span>Shopping</span>
            <span className="nx-faq-note-dot" />
            <span>Payments</span>
            <span className="nx-faq-note-dot" />
            <span>Seller support</span>
          </div>
        </motion.div>
      </section>

      <section className="nx-faq-content">
        <div className="nx-faq-section-heading">
          <div>
            <span className="nx-faq-overline">FAQ CATEGORY</span>
            <h2>How can we help you?</h2>
          </div>
        </div>

        <div className="nx-faq-layout" id="faq-questions">
          <aside className="nx-faq-categories" aria-label="FAQ categories">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = selectedCategory === category.id;

              return (
                <button
                  type="button"
                  key={category.id}
                  className={`nx-faq-category ${
                    isActive ? "is-active" : ""
                  }`}
                  onClick={() => handleCategoryChange(category.id)}
                  aria-pressed={isActive}
                >
                  <span className="nx-faq-category-icon">
                    <Icon size={18} />
                  </span>

                  <span>{category.label}</span>

                  <ChevronRight
                    className="nx-faq-category-arrow"
                    size={17}
                  />
                </button>
              );
            })}
          </aside>

          <div className="nx-faq-questions">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedCategory}-${normalizedSearch}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
              >
                <div className="nx-faq-current-heading">
                  <div>
                    <h3>
                      {categories.find(
                        (category) => category.id === selectedCategory
                      )?.label}
                    </h3>
                  </div>
                </div>

                {filteredQuestions.length > 0 ? (
                  <div className="nx-faq-list">
                    {filteredQuestions.map((faq, index) => {
                      const isOpen = openQuestion === faq.question;

                      return (
                        <motion.article
                          key={faq.question}
                          className={`nx-faq-item ${
                            isOpen ? "is-open" : ""
                          }`}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.25,
                            delay: index * 0.035,
                          }}
                        >
                          <button
                            type="button"
                            className="nx-faq-question"
                            onClick={() =>
                              setOpenQuestion(isOpen ? null : faq.question)
                            }
                            aria-expanded={isOpen}
                          >
                            <span className="nx-faq-question-text">
                              {faq.question}
                            </span>

                            <motion.span
                              className="nx-faq-plus"
                              animate={{
                                rotate: isOpen ? 90 : 0,
                              }}
                              transition={{ duration: 0.2 }}
                            >
                              <Plus size={19} />
                            </motion.span>
                          </button>

                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                className="nx-faq-answer-wrap"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{
                                  height: {
                                    duration: 0.28,
                                    ease: "easeInOut",
                                  },
                                  opacity: { duration: 0.2 },
                                }}
                              >
                                <p className="nx-faq-answer">{faq.answer}</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="nx-faq-empty">
                    <Search size={30} />
                    <h3>No answers found</h3>
                    <p>
                      Try another search term or choose a different category.
                    </p>

                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                    >
                      Clear search
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      <section className="nx-faq-contact">
        <div className="nx-faq-contact-icon">
          <MessageCircle size={24} />
        </div>

        <div className="nx-faq-contact-copy">
          <h2>Can't find your answer?</h2>
          <p>
            Our support team can help you find the information you need.
          </p>
        </div>

        <a className="nx-faq-contact-link" href="mailto:support@nex-iv.com">
          Contact support
          <ArrowRight size={17} />
        </a>
      </section>
    </main>
  );
}

export default FAQPage;