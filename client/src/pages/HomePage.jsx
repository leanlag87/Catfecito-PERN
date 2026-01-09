import "../styles/CustomBar.css";
import "../styles/index.css";
import "../styles/App.css";
import "animate.css";
import MetaData from "../components/ui/MetaData/MetaData";

import { NavBar } from "../components/CustomBarComponents/NavBar";
import { Header } from "../components/CustomBarComponents/Header";
import { Banner } from "../components/CustomBarComponents/Banner";
import { Footer } from "../components/FooterComponent/Footer";


export const HomePage = ({
  cartItems,
  itemCount,
  isCartOpen,
  onOpenCart,
  onCloseCart,
  onUpdateQuantity,
  onRemoveItem,
  onOpenAuthModal = null,
}) => {
  return (
    <>
      <MetaData title="Catfecito" />
      <Header
              cartItems={cartItems}
              itemCount={itemCount}
              isCartOpen={isCartOpen}
              onOpenCart={onOpenCart}
              onCloseCart={onCloseCart}
              onUpdateQuantity={onUpdateQuantity}
              onRemoveItem={onRemoveItem}
              onOpenAuthModal={onOpenAuthModal}
            />
      <NavBar />
      <Banner />
      <Footer />
    </>
  );
};
