import { createContext, useContext, useMemo, useState ,useEffect } from 'react'
import { addCartItem  , getCartItems } from '../api/cart'
const AppContext = createContext(undefined)

export function AppProvider({ children }) {
  const [cart, setCart] = useState([])
  const [wishlist, setWishlist] = useState([])

 const addToCart = async (product) => {
  
  try {
    await addCartItem({
      productId: product.id,
      quantity: 1,
    });

    await loadCart();
  } catch (err) {
    console.error(err);
  }
};

const loadCart = async () => {
  try {
    const response = await getCartItems();
    setCart(response.data.items);
  } catch (err) {
    console.error(err);
  }
};

useEffect(() => {
  loadCart();
}, []);
  const addToWishlist = (product) => {
    setWishlist((prev) => (prev.some((item) => item.id === product.id) ? prev : [...prev, product]))
  }

  const removeFromWishlist = (id) => {
    setWishlist((prev) => prev.filter((item) => item.id !== id))
  }

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id))
  }

  const updateQuantity = (id, quantity) => {
    setCart((prev) => prev.map((item) => (item.id === id ? { ...item, quantity } : item)))
  }

  const value = useMemo(
    () => ({ cart, wishlist, addToCart, addToWishlist, removeFromWishlist, removeFromCart, updateQuantity }),
    [cart, wishlist],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useAppContext must be used within AppProvider')
  return context
}
