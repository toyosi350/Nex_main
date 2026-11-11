import { SlEnvolopeLetter } from "react-icons/sl";
import { IoIosArrowRoundForward } from "react-icons/io";
import "../styles/Newsletter.css";

function Newsletter() {
  const handleSubmit = (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");

    alert(`Thanks for subscribing with ${email}!`);
    event.currentTarget.reset();
  };

  return (
    <main>
      <section className="Newsletter">
      <div className="content">
        <SlEnvolopeLetter
          style={{ width: "28px", height: "28px" }}
        />

        <div className="Newsletter-content">
          <h1>Join the newsletter</h1>
          <span>
            Be the first to know about new arrivals,
            exclusive deals and special offers.
          </span>
        </div>
      </div>

      <form className="subscribe" onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Enter your email address"
          required
        />

        <button type="submit">
          Subscribe <IoIosArrowRoundForward size={20} />
        </button>
      </form>
    </section>
    </main>
  );
}

export default Newsletter;