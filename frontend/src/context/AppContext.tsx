import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { CartItem, Product } from '../types'

interface AppContextValue {
  cart: CartItem[]
  wishlist: Product[]
  addToCart: (product: Product) => void
  addToWishlist: (product: Product) => void
  removeFromWishlist: (id: number) => void
  removeFromCart: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [wishlist, setWishlist] = useState<Product[]>([])

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        return prev.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const addToWishlist = (product: Product) => {
    setWishlist((prev) => (prev.some((item) => item.id === product.id) ? prev : [...prev, product]))
  }

  const removeFromWishlist = (id: number) => {
    setWishlist((prev) => prev.filter((item) => item.id !== id))
  }

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id))
  }

  const updateQuantity = (id: number, quantity: number) => {
    setCart((prev) => prev.map((item) => item.id === id ? { ...item, quantity } : item))
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
