import ForYou from "../components/ForYou"
import Newsletter from "../components/Newsletter"
import BestSellers from "../components/BestSellers"
import PopularVendors from "../components/PopularVendors"
import Marketplace from "../components/Marketplace";
import SalesSection from "../components/SalesSection";

function Home() {
  return (
    <>
    <Marketplace/>
    <SalesSection/>
    <ForYou />
    <BestSellers />
    <PopularVendors />
    <Newsletter />
    </>
  );
}

export default Home;