"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiService, WishlistItem } from './api'
import { useSession } from './session-context'

interface WishlistContextType {
  items: WishlistItem[]
  isLoading: boolean
  addToWishlist: (productId: number) => Promise<void>
  removeFromWishlist: (productId: number) => Promise<void>
  isInWishlist: (productId: number) => boolean
  refreshWishlist: () => Promise<void>
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { isLoggedIn } = useSession()

  const fetchWishlist = async () => {
    if (!isLoggedIn) {
      setItems([])
      return
    }

    try {
      setIsLoading(true)
      const response = await apiService.getWishlist()
      setItems(response.items)
    } catch (error) {
      console.error('Error fetching wishlist:', error)
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWishlist()
  }, [isLoggedIn])

  const addToWishlist = async (productId: number) => {
    if (!isLoggedIn) {
      window.location.href = '/login'
      return
    }

    try {
      await apiService.addToWishlist(productId)
      await fetchWishlist() // Refresh wishlist after adding
    } catch (error) {
      console.error('Error adding to wishlist:', error)
      throw error
    }
  }

  const removeFromWishlist = async (productId: number) => {
    if (!isLoggedIn) return

    try {
      await apiService.removeFromWishlist(productId)
      await fetchWishlist() // Refresh wishlist after removing
    } catch (error) {
      console.error('Error removing from wishlist:', error)
      throw error
    }
  }

  const isInWishlist = (productId: number): boolean => {
    return items.some(item => item.product_id === productId)
  }

  const refreshWishlist = async () => {
    await fetchWishlist()
  }

  const value = {
    items,
    isLoading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    refreshWishlist
  }

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}
