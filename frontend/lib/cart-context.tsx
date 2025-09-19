"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiService, CartItem } from './api'
import { useSession } from './session-context'

interface CartContextType {
  items: CartItem[]
  itemCount: number
  totalPrice: number
  isLoading: boolean
  addToCart: (productId: number, quantity?: number) => Promise<void>
  updateQuantity: (productId: number, quantity: number) => Promise<void>
  removeFromCart: (productId: number) => Promise<void>
  clearCart: () => Promise<void>
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { isLoggedIn } = useSession()

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const fetchCart = async () => {
    if (!isLoggedIn) {
      setItems([])
      return
    }

    try {
      setIsLoading(true)
      const response = await apiService.getCart()
      setItems(response.items)
    } catch (error) {
      console.error('Error fetching cart:', error)
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCart()
  }, [isLoggedIn])

  const addToCart = async (productId: number, quantity: number = 1) => {
    if (!isLoggedIn) {
      window.location.href = '/login'
      return
    }

    try {
      await apiService.addToCart(productId, quantity)
      await fetchCart() // Refresh cart after adding
    } catch (error) {
      console.error('Error adding to cart:', error)
      throw error
    }
  }

  const updateQuantity = async (productId: number, quantity: number) => {
    if (!isLoggedIn) return

    try {
      await apiService.updateCartItem(productId, quantity)
      await fetchCart() // Refresh cart after updating
    } catch (error) {
      console.error('Error updating cart:', error)
      throw error
    }
  }

  const removeFromCart = async (productId: number) => {
    if (!isLoggedIn) return

    try {
      await apiService.updateCartItem(productId, 0) // Setting quantity to 0 removes the item
      await fetchCart() // Refresh cart after removing
    } catch (error) {
      console.error('Error removing from cart:', error)
      throw error
    }
  }

  const clearCart = async () => {
    if (!isLoggedIn) return

    try {
      await apiService.clearCart()
      setItems([])
    } catch (error) {
      console.error('Error clearing cart:', error)
      throw error
    }
  }

  const refreshCart = async () => {
    await fetchCart()
  }

  const value = {
    items,
    itemCount,
    totalPrice,
    isLoading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
