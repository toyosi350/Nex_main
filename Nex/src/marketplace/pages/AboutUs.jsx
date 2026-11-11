import Logo from "../images/logo.png"
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Store,
  ShoppingBag,
  Search,
  ShieldCheck,
  Truck,
  HeartHandshake,
  ArrowUpRight,
  Sparkles,
  Users,
  Globe2,
  Import,
} from "lucide-react";
import "../styles/AboutUs.css";

const services = [
  {
    icon: Store,
    title: "Discover Unique Vendors",
    description:
      "Explore independent stores and discover brands offering products that match your style, needs and interests.",
  },
  {
    icon: ShoppingBag,
    title: "Shop Across Categories",
    description:
      "From fashion and beauty to electronics and home essentials, find different products in one convenient marketplace.",
  },
  {
    icon: Search,
    title: "Find What You Love",
    description:
      "Enjoy an easy shopping experience with smart product discovery, intuitive navigation and curated collections.",
  },
  {
    icon: ShieldCheck,
    title: "Shop With Confidence",
    description:
      "We aim to make discovering products and shopping from different vendors feel simple, clear and reliable.",
  },
];

const values = [
  {
    number: "01",
    title: "Choice without limits",
    description:
      "We believe shopping should open doors to different products, brands and possibilities.",
  },
  {
    number: "02",
    title: "A place for every vendor",
    description:
      "We want independent businesses and growing brands to have a place to showcase what they do best.",
  },
  {
    number: "03",
    title: "Shopping made simpler",
    description:
      "We bring different stores together to make product discovery and everyday shopping more convenient.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 35 },
  visible: { opacity: 1, y: 0 },
};

export default function AboutUs() {
  return (
    <main className="about-page">
      <section className="about-intro">
        <div className="about-intro-inner">

          <motion.div
            className="about-copy"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.8 }}
          >

            <h1>
              ABOUT
              <span> US</span>
            </h1>

            <p className="about-lead">
              More than a marketplace.
              A world of possibilities
            </p>

            <p className="about-description">
              Nex-IV brings different vendors, independent
              businesses and exciting products together in
              one place. We are creating a marketplace where
              discovering something new feels just as good
              as finding exactly what you need.
            </p>

            <div className="about-line" />

            <div className="about-intro-bottom">
              <div>
                <span>OUR PURPOSE</span>
                <p>
                  Making shopping more connected,
                  convenient and full of possibilities.
                </p>
              </div>

              <div>
                <span>OUR VISION</span>
                <p>
                  Creating a marketplace where great
                  products and great businesses meet.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="about-image-grid"
            initial={{ opacity: 0, x: 45 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
          >
            <div className="about-photo about-photo-one">
              <img
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1000"
                alt="Beautifully arranged retail store"
              />
            </div>

            <div className="about-photo about-photo-two">
              <img
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000"
                alt="Fashion and lifestyle collection"
              />
            </div>
            
          </motion.div>

        </div>
      </section>

      <section className="about-services">
        <motion.div
          className="about-section-heading"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          transition={{ duration: 0.7 }}
        >
          <span className="about-eyebrow">
            THE NEX-IV EXPERIENCE
          </span>

          <h2>What We Do</h2>
        </motion.div>

        <div className="about-services-grid">
          {services.map((service, index) => {
            const Icon = service.icon;

            return (
              <motion.article
                className="about-service-card"
                key={service.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                transition={{
                  duration: 0.6,
                  delay: index * 0.12,
                }}
              >
                <div className="about-service-icon">
                  <Icon size={25} strokeWidth={1.6} />
                </div>

                <span className="about-card-number">
                  0{index + 1}
                </span>

                <h3>{service.title}</h3>

                <p>{service.description}</p>

                <div className="about-card-bottom">
                  <span>THE NEX-IV DIFFERENCE</span>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section className="about-story">
        <div className="about-story-image">
          <img
            src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200"
            alt="A customer shopping online"
            loading="lazy"
          />
        </div>

        <motion.div
          className="about-story-content"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          transition={{ duration: 0.7 }}
        >
          <span className="about-eyebrow">OUR STORY</span>

          <h2>
            Different stores.
            <br />
            One destination.
          </h2>

          <p>
            Shopping should be an experience of discovery.
            It should give customers access to different
            brands, fresh ideas and products they might not
            have found otherwise.
          </p>

          <p>
            That is the idea behind Nex-IV. We are building
            a space that connects shoppers with vendors
            across different categories, making it easier
            to explore, compare and shop.
          </p>

          <p>
            Whether you are searching for an everyday
            essential or something completely new, there
            is always more to discover.
          </p>
        </motion.div>
      </section>


      <section className="about-community">
        <div className="about-community-content">
          <span className="about-eyebrow" style={{color: "#FFF8E7"}}>
            MORE THAN A SHOPPING DESTINATION
          </span>

          <h2>
            Good things happen
            <br />
            when we connect.
          </h2>

          <div className="about-community-icons">
            <div>
              <Users size={21} />
              <span>COMMUNITY</span>
            </div>

            <div>
              <HeartHandshake size={21} />
              <span>CONNECTION</span>
            </div>

            <div>
              <Globe2 size={21} />
              <span>DISCOVERY</span>
            </div>
          </div>

          <Link to="/home" className="about-cta-button">
          Explore the marketplace
          <ArrowUpRight size={19} />
        </Link>
        </div>

        <div className="about-community-decoration">
          <img src={Logo}/>
        </div>
      </section>
      
    </main>
  );
}
