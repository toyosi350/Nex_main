import { motion, useReducedMotion } from "framer-motion";
import ForYou from "../components/ForYou"
import Newsletter from "../components/Newsletter"
import BestSellers from "../components/BestSellers"
import PopularVendors from "../components/PopularVendors"
import Marketplace from "../components/Marketplace";
import SalesSection from "../components/SalesSection";

const OFFSETS = {
  up: { y: 80 },
  left: { x: -110 },
  zoom: { scale: 0.9, y: 40 },
};

function Reveal({ from = "up", amount = 0.12, children }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, ...OFFSETS[from] }}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Home() {
  return (
    <div style={{ overflowX: "clip" }}>
      <Reveal from="zoom" amount={0.05}>
        <Marketplace/>
      </Reveal>

      <SalesSection/>
      <ForYou />

      <Reveal from="left">
        <BestSellers />
      </Reveal>

      <PopularVendors />

      <Reveal from="up">
        <Newsletter />
      </Reveal>
    </div>
  );
}

export default Home;
