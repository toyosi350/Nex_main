/* Storefront shell (merged app):
 * header + footer + cart context + scroll handling for every
 * marketplace route. ERP routes render outside of this shell. */
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ShopProvider, useShop } from "./context/ShopContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Payment from "./pages/Payment";
import "./App.css";

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));

      // The target section may render after the catalog loads, so retry
      // briefly instead of scrolling only once.
      let attempts = 0;
      const timer = window.setInterval(() => {
        attempts += 1;

        const target = document.getElementById(id);
        if (!target && attempts < 20) return;

        window.clearInterval(timer);
        target?.scrollIntoView();
      }, 100);

      return () => window.clearInterval(timer);
    }

    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    return undefined;
  }, [pathname, hash]);

  return null;
}

/** Checkout payment needs the live cart total from the shop context. */
export function ShopPaymentRoute() {
  const { cartTotal } = useShop();
  return <Payment amount={cartTotal} />;
}

export default function ShopShell() {
  return (
    <ShopProvider>
      <div className="shop-scope">
        <ScrollToTop />
        <Header />
        <Outlet />
        <Footer />
      </div>
    </ShopProvider>
  );
}
