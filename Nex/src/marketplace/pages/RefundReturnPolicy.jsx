import { Link } from "react-router-dom";
import { CheckCircle2, Mail, ArrowUpRight } from "lucide-react";
import "../styles/Policy.css";

const sections = [
  {
    id: "eligibility",
    title: "Return eligibility",
    body: [
      "Whether a product can be returned depends on the product category, the condition of the item, and the return terms attached to the listing. Not every item is eligible for a return.",
    ],
    list: [
      "Items received damaged, incorrect, or materially different from their listing are eligible for return guidance.",
      "Products showing signs of use, missing packaging, or missing accessories may not qualify.",
      "Some categories carry specific return restrictions — check the product page before ordering.",
    ],
  },
  {
    id: "how-to-return",
    title: "How to request a return",
    body: [
      "Open your account, go to Orders, and select the relevant order. If a return option is available for that order, follow the instructions provided there.",
      "If you cannot find a return option, contact support with your order number, the item details, and the reason for the return. We will guide you through the next steps.",
    ],
  },
  {
    id: "damaged",
    title: "Damaged or incorrect items",
    body: [
      "If you receive a damaged or incorrect item, contact support as soon as possible and include:",
    ],
    list: [
      "Your order number,",
      "A description of the problem, and",
      "Clear photographs of the item and its packaging where appropriate.",
    ],
    bodyAfter:
      "Keep the item and its original packaging until you receive instructions on what to do next — disposing of them may affect your claim.",
  },
  {
    id: "refund-timing",
    title: "When you will receive your refund",
    body: [
      "Refund timing depends on the outcome of the return or refund review and on your payment provider's processing time.",
      "Once a refund is approved, follow the status updates in your Orders section. If you need clarification at any stage, contact support with your order number.",
    ],
  },
  {
    id: "cancellations",
    title: "Cancelling an order",
    body: [
      "Cancellation may be possible before your order has been processed or dispatched. Check your Orders section for a cancellation option.",
      "If the option is unavailable, contact support promptly. A dispatched order may need to follow the return process instead of being cancelled.",
    ],
  },
  {
    id: "not-returnable",
    title: "Items that may not be returnable",
    body: [
      "Some products are restricted for hygiene, safety, or category reasons — for example opened personal care items, certain perishables, or digital products. Check the return terms on the product page before you purchase, and ask support if you are unsure about a specific item.",
    ],
  },
];

export default function RefundReturnPolicy() {
  return (
    <main className="policy-page">
      {/* Hero */}
      <section className="policy-hero">
        <div className="policy-hero-inner">
          <div className="policy-hero-copy">
            <span className="policy-eyebrow">REFUNDS & RETURNS</span>
            <h1>
              Our return
              <br />
              policy, <span>plainly</span>
            </h1>
            <p className="policy-lead">
              What you can return, how to request it, and what to expect from
              the refund process when you shop on Nex-IV.
            </p>
          </div>

          <div className="policy-hero-meta">
            <div>
              <span>NEED HELP NOW?</span>
              <p>
                Email{" "}
                <a href="mailto:support@nex-iv.com">support@nex-iv.com</a> with
                your order number and we will walk you through it.
              </p>
            </div>
            <div>
              <span>BEFORE YOU ORDER</span>
              <p>
                Check the return terms on the product page — eligibility can
                vary by category and item condition.
              </p>
            </div>
            <div>
              <span>AFTER DELIVERY</span>
              <p>
                Unhappy with your item? Contact support as soon as possible and
                keep the packaging.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="policy-body">
        <nav className="policy-toc" aria-label="On this page">
          <strong>On this page</strong>
          <ol>
            {sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{section.title}</a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="policy-content">
          {sections.map((section, index) => (
            <section id={section.id} key={section.id}>
              <span className="policy-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h2>{section.title}</h2>
              {section.body.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
              {section.list && (
                <ul>
                  {section.list.map((item) => (
                    <li key={item}>
                      <CheckCircle2 size={16} aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
              {section.bodyAfter && <p>{section.bodyAfter}</p>}
            </section>
          ))}
        </div>
      </div>

      {/* Contact strip */}
      <div className="policy-contact">
        <div>
          <h3>Still have questions?</h3>
          <p>
            Read the <Link to="/faq">FAQ</Link> or contact support — include
            your order number for the fastest help.
          </p>
        </div>
        <a className="policy-mail" href="mailto:support@nex-iv.com">
          <Mail size={17} aria-hidden="true" />
          support@nex-iv.com
          <ArrowUpRight size={15} aria-hidden="true" />
        </a>
      </div>
    </main>
  );
}
