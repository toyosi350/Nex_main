import { createContext, useContext, useState } from "react";

const ShopContext = createContext(null);
export const FREE_SHIPPING_MINIMUM = 50000;

export function formatMoney(amount) {
  return `₦${Math.round(amount).toLocaleString()}`;
}

export function discountPercent(item) {
  if (!item.originalPrice || item.originalPrice <= item.price) return 0;
  return Math.round((1 - item.price / item.originalPrice) * 100);
}

export function groupByVendor(items) {
  const groups = [];
  items.forEach((item) => {
    const existingGroup = groups.find((group) => group.vendor === item.vendor);
    if (existingGroup) {
      existingGroup.items.push(item);
    } else {
      groups.push({ vendor: item.vendor, items: [item] })
    }
  })
  return groups;
}

export function ShopProvider({ children }) {
  const [cartItems, setCartItems] = useState([])
  const [wishlistItems, setWishlistItems] = useState([])
  const [recommendations] = useState([])
  const [couponSavings] = useState(0)
  const [shippingAddress] = useState("")
  const [unselectedIds, setUnselectedIds] = useState([])

  const activeItems = cartItems.filter((item) => !item.isOutOfStock)
  const soldOutItems = cartItems.filter((item) => item.isOutOfStock)
  const selectedItems = activeItems.filter((item) => !unselectedIds.includes(item.id))
  const allSelected = activeItems.length > 0 && selectedItems.length === activeItems.length

  const isItemSelected = (itemId) => !unselectedIds.includes(itemId)

  const toggleItem = (itemId) => {
    setUnselectedIds((previous) =>
      previous.includes(itemId)
        ? previous.filter((unselectedId) => unselectedId !== itemId)
        : [...previous, itemId]
    )
  }

  const toggleGroup = (groupItems) => {
    const groupIds = groupItems.map((item) => item.id);
    const everyItemSelected = groupIds.every((itemId) => !unselectedIds.includes(itemId));

    setUnselectedIds((previous) =>
      everyItemSelected
        ? [...previous, ...groupIds.filter((itemId) => !previous.includes(itemId))]
        : previous.filter((unselectedId) => !groupIds.includes(unselectedId))
    );
  };

  const toggleAll = () => {
    setUnselectedIds(allSelected ? activeItems.map((item) => item.id) : []);
  };


  const changeQuantity = (itemId, quantity) => {
    setCartItems((previous) =>
      previous.map((item) => {
        if (item.id !== itemId) return item;

        const stock = Number(item.stockLeft ?? item.stock);
        const safeQuantity = Math.max(1, quantity);
        if (Number.isFinite(stock)) {
          return {
            ...item,
            quantity: Math.min(safeQuantity, stock),
          };
        }

        return { ...item, quantity: safeQuantity };
      })
    );
  };

  const addToCart = (product) => {
    const stockValue = product.stockLeft ?? product.stock;
    const hasStockLimit =
      stockValue !== undefined &&
      stockValue !== null &&
      Number.isFinite(Number(stockValue));

    const stock = hasStockLimit ? Number(stockValue) : Infinity;
    if (stock <= 0) {
      return false;
    }

    const existingItem = cartItems.find(
      (item) => item.id === product.id
    );

    const currentQuantity = existingItem?.quantity ?? 0;
    if (currentQuantity >= stock) {
      return false;
    }

    const normalizedProduct = {
      ...product,
      stockLeft: stock,
      isOutOfStock: false,
    };

    setCartItems((previous) => {
      const existing = previous.find(
        (item) => item.id === product.id
      );
      if (existing) {
        if (
          Number.isFinite(Number(existing.stockLeft)) &&
          existing.quantity >= Number(existing.stockLeft)
        ) {
          return previous;
        }
        return previous.map((item) =>
          item.id === product.id
            ? {
              ...item,
              quantity: Math.min(
                item.quantity + 1,
                Number(item.stockLeft ?? Infinity)
              ),
            }
            : item
        );
      }
      return [
        ...previous,
        { ...normalizedProduct, quantity: 1 },
      ];
    });

    window.dispatchEvent(new Event("nexiv-cart-open"));

    return true;
  };


  const removeFromCart = (itemId) => {
    setCartItems((previous) => previous.filter((item) => item.id !== itemId));
  };


  const removeFromWishlist = (itemId) => {
    setWishlistItems((previous) => previous.filter((item) => item.id !== itemId));
  };

  const addToWishlist = (product) => {
    setWishlistItems((previous) => {
      if (previous.some((item) => item.id === product.id)) {
        return previous;
      }

      return [
        ...previous,
        {
          ...product,
          addedAt: new Date().toISOString(),
        },
      ];
    });
  };

  const toggleWishlist = (product) => {
    setWishlistItems((previous) => {
      const alreadySaved = previous.some(
        (item) => item.id === product.id
      );

      if (alreadySaved) {
        return previous.filter((item) => item.id !== product.id);
      }

      return [
        ...previous,
        {
          ...product,
          addedAt: new Date().toISOString(),
        },
      ];
    });
  };

  const isWishlisted = (productId) =>
    wishlistItems.some((item) => item.id === productId);

  const moveToWishlist = (item) => {
    addToWishlist(item);
    removeFromCart(item.id);
  };

  const retailPrice = selectedItems.reduce(
    (total, item) => total + (item.originalPrice || item.price) * item.quantity,
    0
  );
  const subtotal = selectedItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const promotionSavings = retailPrice - subtotal;
  const couponAmount = selectedItems.length > 0 ? Math.min(couponSavings, subtotal) : 0;
  const finalPrice = subtotal - couponAmount;
  const totalSaved = promotionSavings + couponAmount;
  const selectedCount = selectedItems.reduce((total, item) => total + item.quantity, 0);
  const cartCount = activeItems.reduce((total, item) => total + item.quantity, 0);
  const freeShippingGap =
    selectedItems.length > 0 ? Math.max(0, FREE_SHIPPING_MINIMUM - finalPrice) : 0;

  return (
    <ShopContext.Provider
      value={{
        cartItems,
        activeItems,
        soldOutItems,
        selectedItems,
        allSelected,
        isItemSelected,
        toggleItem,
        toggleGroup,
        toggleAll,
        changeQuantity,
        removeFromCart,
        addToCart,
        moveToWishlist,
        wishlistItems,
        removeFromWishlist,
        addToWishlist,
        toggleWishlist,
        isWishlisted,
        recommendations,
        shippingAddress,
        retailPrice,
        promotionSavings,
        couponAmount,
        finalPrice,
        totalSaved,
        selectedCount,
        cartCount,
        freeShippingGap,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const shop = useContext(ShopContext);
  return shop;
}