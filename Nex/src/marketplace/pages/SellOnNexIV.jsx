import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Globe2,
  LayoutDashboard,
  Truck,
  Megaphone,
  ShieldCheck,
  HeartHandshake,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Send,
  Store,
  ClipboardCheck,
  PackageOpen,
  Rocket,
} from "lucide-react";
import { SHOP_CATEGORIES } from "../../constants/shop.js";
import { useSubmitVendorApplicationMutation } from "../api/shopApi";
import "../styles/SellOnNexIV.css";

const benefits = [
  {
    icon: Globe2,
    title: "Reach customers nationwide",
    description:
      "Put your store in front of shoppers across Nigeria, not just your local area.",
  },
  {
    icon: LayoutDashboard,
    title: "Vendor dashboard & analytics",
    description:
      "Track orders, stock, sales performance and store analytics from one workspace.",
  },
  {
    icon: Truck,
    title: "Delivery & fulfillment support",
    description:
      "Tap into marketplace delivery options so your products get to customers reliably.",
  },
  {
    icon: Megaphone,
    title: "Marketing & deals placements",
    description:
      "Get featured in deals, curated collections and campaigns like Deals & Offers.",
  },
  {
    icon: ShieldCheck,
    title: "Secure, transparent payouts",
    description:
      "Clear payout flows and order tracking, so you always know where your money is.",
  },
  {
    icon: HeartHandshake,
    title: "Dedicated vendor success",
    description:
      "A team that helps you onboard, list products and grow your store over time.",
  },
];

const steps = [
  {
    number: "01",
    icon: ClipboardCheck,
    title: "Apply with your details",
    description:
      "Tell us about your business, what you sell and how to reach you.",
  },
  {
    number: "02",
    icon: ShieldCheck,
    title: "Verification & review",
    description:
      "Our vendor success team reviews your application and may request verification documents.",
  },
  {
    number: "03",
    icon: Store,
    title: "Set up your store",
    description:
      "Get onboarded, set up your storefront and list your products with photos and prices.",
  },
  {
    number: "04",
    icon: Rocket,
    title: "Start selling",
    description:
      "Go live to shoppers across the marketplace and start fulfilling orders.",
  },
];

const requirements = [
  "A registered business or eligible seller account",
  "Valid contact details and business information",
  "Products that meet Nex-IV's marketplace rules",
  "Verification documents when requested during onboarding",
];

const fadeUp = {
  hidden: { opacity: 0, y: 35 },
  visible: { opacity: 1, y: 0 },
};

export default function SellOnNexIV() {
  const [form, setForm] = useState({
    business: "",
    contact: "",
    email: "",
    phone: "",
    category: "",
    details: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitApplication, { isLoading }] =
    useSubmitVendorApplicationMutation();

  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");
    try {
      await submitApplication({
        businessName: form.business,
        contactName: form.contact,
        email: form.email,
        phone: form.phone,
        category: form.category,
        details: form.details,
      }).unwrap();
      setSubmitted(true);
    } catch (error) {
      setSubmitError(
        error?.data?.message ||
          "Could not submit your application. Please try again."
      );
    }
  };

  return (
    <main className="sell-page">
      {/* Hero */}
      <section className="sell-hero">
        <div className="sell-hero-inner">
          <motion.div
            className="sell-hero-copy"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.8 }}
          >
            <span className="sell-eyebrow">SELL ON NEX-IV</span>
            <h1>
              Your store,
              <br />
              in front of
              <span> all of Nigeria</span>
            </h1>
            <p className="sell-lead">
              Join the vendors already selling on Nex-IV — set up your
              storefront, reach new customers, and grow with a partner that
              wants you to succeed.
            </p>
            <div className="sell-hero-actions">
              <a href="#apply" className="sell-cta-primary">
                Become a vendor
                <ArrowRight size={18} />
              </a>
              <a href="#how" className="sell-cta-secondary">
                How it works
              </a>
            </div>
          </motion.div>

          <motion.div
            className="sell-hero-image"
            initial={{ opacity: 0, x: 45 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
          >
            <img
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80"
              alt="A vendor's retail store"
            />
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="sell-benefits">
        <div className="sell-section-heading">
          <span className="sell-eyebrow">WHY SELL WITH US</span>
          <h2>Everything you need to grow</h2>
        </div>

        <div className="sell-benefits-grid">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.article
                className="sell-benefit-card"
                key={benefit.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                transition={{ duration: 0.6, delay: index * 0.08 }}
              >
                <div className="sell-benefit-icon">
                  <Icon size={24} strokeWidth={1.6} />
                </div>
                <h3>{benefit.title}</h3>
                <p>{benefit.description}</p>
              </motion.article>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="sell-steps">
        <span className="sell-eyebrow">HOW IT WORKS</span>
        <h2>From application to first sale</h2>

        <div className="sell-steps-grid">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div className="sell-step" key={step.number}>
                <span className="sell-step-number">{step.number}</span>
                <div className="sell-step-icon">
                  <Icon size={22} strokeWidth={1.6} />
                </div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            );
          })}
        </div>

        <div className="sell-requirements">
          <div>
            <span className="sell-eyebrow">WHAT YOU NEED</span>
            <h3>Who can sell on Nex-IV</h3>
          </div>
          <ul>
            {requirements.map((requirement) => (
              <li key={requirement}>
                <PackageOpen size={16} aria-hidden="true" />
                {requirement}
              </li>
            ))}
          </ul>
          <p className="sell-requirements-note">
            Questions about eligibility?{" "}
            <Link to="/faq">
              Read the vendor FAQ <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </p>
        </div>
      </section>

      {/* Application form */}
      <section id="apply" className="sell-apply">
        <div className="sell-apply-copy">
          <span className="sell-eyebrow">BECOME A VENDOR</span>
          <h2>Apply to sell</h2>
          <p>
            Complete the form and our vendor success team will review your
            application. If it looks like a good fit, we will reach out with
            the next steps for onboarding.
          </p>
          <ul className="sell-apply-points">
            <li>
              <CheckCircle2 size={17} aria-hidden="true" />
              Applications are reviewed within 3–5 business days.
            </li>
            <li>
              <CheckCircle2 size={17} aria-hidden="true" />
              We may request verification documents before your store goes
              live.
            </li>
            <li>
              <CheckCircle2 size={17} aria-hidden="true" />
              Questions? Email{" "}
              <a href="mailto:vendors@nex-iv.com">vendors@nex-iv.com</a>
            </li>
          </ul>
        </div>

        {submitted ? (
          <div className="sell-apply-success" role="status">
            <CheckCircle2 size={42} strokeWidth={1.5} />
            <h3>Application received</h3>
            <p>
              Thanks, <strong>{form.business}</strong>! Our vendor success
              team will review your application and reach out at{" "}
              <strong>{form.email}</strong> within 3–5 business days.
            </p>
            <Link to="/home" className="sell-cta-primary">
              Back to the marketplace
              <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <form className="sell-form" onSubmit={handleSubmit}>
            <div className="sell-form-row">
              <label>
                Business name
                <input
                  type="text"
                  name="business"
                  value={form.business}
                  onChange={update("business")}
                  placeholder="Your store or business name"
                  required
                />
              </label>
              <label>
                Contact person
                <input
                  type="text"
                  name="contact"
                  value={form.contact}
                  onChange={update("contact")}
                  placeholder="Full name"
                  required
                />
              </label>
            </div>

            <div className="sell-form-row">
              <label>
                Email
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={update("email")}
                  placeholder="you@business.com"
                  required
                />
              </label>
              <label>
                Phone
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={update("phone")}
                  placeholder="+234 ..."
                  required
                />
              </label>
            </div>

            <label>
              Primary category
              <select
                name="category"
                value={form.category}
                onChange={update("category")}
                required
              >
                <option value="">Select a category</option>
                {SHOP_CATEGORIES.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
                <option value="other">Other</option>
              </select>
            </label>

            <label>
              What do you sell?
              <textarea
                name="details"
                value={form.details}
                onChange={update("details")}
                placeholder="Tell us about your products, your business and your experience..."
                rows={4}
                required
              />
            </label>

            {submitError && (
              <p className="sell-submit-error" role="alert">
                {submitError}
              </p>
            )}

            <button type="submit" className="sell-submit" disabled={isLoading}>
              {isLoading ? "Submitting..." : "Submit application"}
              <Send size={17} aria-hidden="true" />
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
