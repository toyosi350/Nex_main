import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  TrendingUp,
  Rocket,
  Globe2,
  MapPin,
  Briefcase,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Send,
} from "lucide-react";
import { useSubmitCareerApplicationMutation } from "../api/shopApi";
import "../styles/Careers.css";

const values = [
  {
    icon: Rocket,
    title: "Build what matters",
    description:
      "Work on a marketplace that thousands of shoppers and vendors rely on every day — from product discovery to checkout to fulfillment.",
  },
  {
    icon: TrendingUp,
    title: "Grow fast, learn faster",
    description:
      "We are early. Every person here owns real surface area — you will ship, learn, and see the impact of your work quickly.",
  },
  {
    icon: Users,
    title: "People first",
    description:
      "We care about the people who build Nex-IV as much as the people who shop on it. Respectful, ambitious, no ego.",
  },
  {
    icon: Globe2,
    title: "Commerce for everyone",
    description:
      "Our mission is to open up market access for independent vendors and give shoppers everywhere more choice.",
  },
];

const roles = [
  {
    title: "Senior Frontend Engineer (React)",
    department: "Engineering",
    location: "Lagos, Nigeria",
    type: "Full-time · Hybrid",
  },
  {
    title: "Backend Engineer (Node.js)",
    department: "Engineering",
    location: "Lagos, Nigeria",
    type: "Full-time · Hybrid",
  },
  {
    title: "Vendor Success Manager",
    department: "Vendor Operations",
    location: "Lagos, Nigeria",
    type: "Full-time · On-site",
  },
  {
    title: "Marketplace Operations Associate",
    department: "Operations",
    location: "Lagos, Nigeria",
    type: "Full-time · On-site",
  },
  {
    title: "Customer Support Specialist",
    department: "Customer Support",
    location: "Remote (Nigeria)",
    type: "Full-time · Remote",
  },
  {
    title: "Content & Marketing Associate",
    department: "Marketing",
    location: "Lagos, Nigeria",
    type: "Full-time · Hybrid",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 35 },
  visible: { opacity: 1, y: 0 },
};

export default function Careers() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    link: "",
    note: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitApplication, { isLoading }] =
    useSubmitCareerApplicationMutation();

  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");
    try {
      await submitApplication({
        fullName: form.name,
        email: form.email,
        phone: form.phone,
        role: form.role,
        link: form.link,
        note: form.note,
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
    <main className="careers-page">
      {/* Hero */}
      <section className="careers-hero">
        <div className="careers-hero-inner">
          <motion.div
            className="careers-hero-copy"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.8 }}
          >
            <span className="careers-eyebrow">CAREERS AT NEX-IV</span>
            <h1>
              Build the
              <br />
              marketplace
              <span> of tomorrow</span>
            </h1>
            <p className="careers-lead">
              Join a team making it easier for vendors to sell and for
              shoppers to discover great products — all in one place.
            </p>
            <div className="careers-hero-actions">
              <a href="#open-roles" className="careers-cta-primary">
                See open roles
                <ArrowRight size={18} />
              </a>
              <a href="mailto:careers@nex-iv.com" className="careers-cta-secondary">
                careers@nex-iv.com
              </a>
            </div>
          </motion.div>

          <motion.div
            className="careers-hero-image"
            initial={{ opacity: 0, x: 45 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
          >
            <img
              src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80"
              alt="The Nex-IV team collaborating"
            />
          </motion.div>
        </div>
      </section>

      {/* Why work here */}
      <section className="careers-values">
        <div className="careers-section-heading">
          <span className="careers-eyebrow">WHY NEX-IV</span>
          <h2>What you will find here</h2>
        </div>

        <div className="careers-values-grid">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <motion.article
                className="careers-value-card"
                key={value.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="careers-value-icon">
                  <Icon size={24} strokeWidth={1.6} />
                </div>
                <h3>{value.title}</h3>
                <p>{value.description}</p>
              </motion.article>
            );
          })}
        </div>
      </section>

      {/* Open roles */}
      <section id="open-roles" className="careers-roles">
        <span className="careers-eyebrow">OPEN ROLES</span>
        <h2>Come do your best work</h2>

        <div className="careers-role-list">
          {roles.map((role) => (
            <a
              key={role.title}
              href="#apply"
              className="careers-role-row"
              onClick={() =>
                setForm((current) => ({ ...current, role: role.title }))
              }
            >
              <div className="careers-role-main">
                <h3>{role.title}</h3>
                <div className="careers-role-meta">
                  <span>
                    <Briefcase size={13} aria-hidden="true" />
                    {role.department}
                  </span>
                  <span>
                    <MapPin size={13} aria-hidden="true" />
                    {role.location}
                  </span>
                  <span>{role.type}</span>
                </div>
              </div>
              <span className="careers-role-action">
                Apply
                <ArrowRight size={18} aria-hidden="true" />
              </span>
            </a>
          ))}
        </div>

        <p className="careers-roles-footnote">
          Don&apos;t see the right role?{" "}
          <a href="mailto:careers@nex-iv.com">
            Send us your CV anyway <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </p>
      </section>

      {/* Application form */}
      <section id="apply" className="careers-apply">
        <div className="careers-apply-copy">
          <span className="careers-eyebrow">APPLY</span>
          <h2>Tell us about yourself</h2>
          <p>
            Fill in the form and our team will review your application. If it
            looks like a fit, we will reach out to schedule a conversation.
          </p>
          <ul className="careers-apply-points">
            <li>
              <CheckCircle2 size={17} aria-hidden="true" />
              We review every application, usually within 3–5 business days.
            </li>
            <li>
              <CheckCircle2 size={17} aria-hidden="true" />
              No cover letter gymnastics — just tell us why you want in.
            </li>
            <li>
              <CheckCircle2 size={17} aria-hidden="true" />
              Questions? Email{" "}
              <a href="mailto:careers@nex-iv.com">careers@nex-iv.com</a>
            </li>
          </ul>
        </div>

        {submitted ? (
          <div className="careers-apply-success" role="status">
            <CheckCircle2 size={42} strokeWidth={1.5} />
            <h3>Application received</h3>
            <p>
              Thanks, {form.name.split(" ")[0] || "there"}! Our team will
              review your application and get back to you at{" "}
              <strong>{form.email}</strong>.
            </p>
            <Link to="/home" className="careers-cta-primary">
              Back to the marketplace
              <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <form className="careers-form" onSubmit={handleSubmit}>
            <div className="careers-form-row">
              <label>
                Full name
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={update("name")}
                  placeholder="Ada Lovelace"
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={update("email")}
                  placeholder="you@example.com"
                  required
                />
              </label>
            </div>

            <div className="careers-form-row">
              <label>
                Phone (optional)
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={update("phone")}
                  placeholder="+234 ..."
                />
              </label>
              <label>
                Role
                <select
                  name="role"
                  value={form.role}
                  onChange={update("role")}
                  required
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={role.title} value={role.title}>
                      {role.title}
                    </option>
                  ))}
                  <option value="General application">
                    General application
                  </option>
                </select>
              </label>
            </div>

            <label>
              Portfolio / LinkedIn / CV link (optional)
              <input
                type="url"
                name="link"
                value={form.link}
                onChange={update("link")}
                placeholder="https://"
              />
            </label>

            <label>
              Why Nex-IV?
              <textarea
                name="note"
                value={form.note}
                onChange={update("note")}
                placeholder="A few sentences about you and what you want to build..."
                rows={4}
                required
              />
            </label>

            {submitError && (
              <p className="careers-submit-error" role="alert">
                {submitError}
              </p>
            )}

            <button type="submit" className="careers-submit" disabled={isLoading}>
              {isLoading ? "Submitting..." : "Submit application"}
              <Send size={17} aria-hidden="true" />
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
