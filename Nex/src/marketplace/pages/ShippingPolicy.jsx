import { Link } from "react-router-dom";
import { CheckCircle2, Mail, ArrowUpRight } from "lucide-react";
import "../styles/Policy.css";

const sections = [
  {
    id: "coverage",
    title: "Where we deliver",
    body: [
      "Delivery availability depends on the service areas supported by Nex-IV and on the seller or delivery option attached to your order.",
      "When you check out, you will see the delivery options available for your address and for the items in your cart. If what you need is not available, contact support and we will help you figure out the options.",
    ],
  },
  {
    id: "fees",
    title: "Delivery fees",
    body: [
      "Delivery charges vary depending on your delivery address, the size and nature of your order, the vendor fulfilling it, and the delivery service selected.",
      "The delivery fee for your order is always displayed at checkout before you confirm — review it alongside your order total so there are no surprises.",
    ],
  },
  {
    id: "timelines",
    title: "Delivery timelines",
    body: [
      "How long an order takes to arrive depends on where you are, whether your items are in stock, how quickly the vendor processes the order, and the delivery service used.",
      "You will see an estimated delivery window at checkout and again in your Orders section. Track the estimate there; if your order runs over, contact support with your order number.",
    ],
  },
  {
    id: "tracking",
    title: "Tracking your order",
    body: [
      "When tracking is available for your order, you can follow its progress in your account's Orders section.",
    ],
    list: [
      "Open your account and go to Orders.",
      "Select the order to see its status and any tracking updates.",
      "If tracking is not showing or has not updated, contact support with your order number.",
    ],
  },
  {
    id: "delayed",
    title: "Delayed or missing orders",
    body: [
      "If your order has not arrived, here is what to do first:",
    ],
    list: [
      "Check your order status and any delivery updates in Orders.",
      "Confirm that the delivery details on your order are correct.",
      "If the order is overdue or tracking does not help, contact support with your order number and we will investigate.",
    ],
  },
  {
    id: "changes",
    title: "Changing your delivery address",
    body: [
      "Address changes depend on whether your order has already been processed or dispatched.",
      "If you need to change your address, contact support as soon as possible. Once an order is on its way, an address change may not be possible.",
    ],
  },
];

export default function ShippingPolicy() {
  return (
    <main className="policy-page">
      {/* Hero */}
      <section className="policy-hero">
        <div className="policy-hero-inner">
          <div className="policy-hero-copy">
            <span className="policy-eyebrow">SHIPPING & DELIVERY</span>
            <h1>
              How your order
              <br />
              gets to <span>you</span>
            </h1>
            <p className="policy-lead">
              Where we deliver, what it costs, how long it takes, and how to
              track your order from the moment you place it.
            </p>
          </div>

          <div className="policy-hero-meta">
            <div>
              <span>DELIVERY FEES</span>
              <p>
                Always shown at checkout before you confirm — review them with
                your order total.
              </p>
            </div>
            <div>
              <span>ESTIMATES</span>
              <p>
                You'll see a delivery window at checkout and again in Orders.
                Track it from your account.
              </p>
            </div>
            <div>
              <span>DELAYED?</span>
              <p>
                Check your Orders section, then contact{" "}
                <a href="mailto:support@nex-iv.com">support@nex-iv.com</a>{" "}
                with your order number.
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
            </section>
          ))}
        </div>
      </div>

      {/* Contact strip */}
      <div className="policy-contact">
        <div>
          <h3>Questions about your delivery?</h3>
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
