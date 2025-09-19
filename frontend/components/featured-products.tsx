"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Heart, Loader2 } from "lucide-react"
import Link from "next/link"
import { apiService, Product } from "@/lib/api"
import { useSession } from "@/lib/session-context"
import { useCart } from "@/lib/cart-context"
import { useWishlist } from "@/lib/wishlist-context"

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isLoggedIn } = useSession()
  const { addToCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true)
        const response = await apiService.getFeaturedProducts(4)
        setProducts(response.products)
      } catch (err) {
        console.error('Error fetching featured products:', err)
        setError('Failed to load featured products')
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedProducts()
  }, [])

  const handleAddToCart = async (productId: number) => {
    if (!isLoggedIn) {
      // Redirect to login or show login modal
      window.location.href = '/login'
      return
    }

    try {
      await addToCart(productId, 1)
      // You could add a toast notification here
      console.log('Product added to cart')
    } catch (err) {
      console.error('Error adding to cart:', err)
      // You could add error notification here
    }
  }

  const handleWishlistToggle = async (productId: number) => {
    if (!isLoggedIn) {
      window.location.href = '/login'
      return
    }

    try {
      if (isInWishlist(productId)) {
        await removeFromWishlist(productId)
        console.log('Product removed from wishlist')
      } else {
        await addToWishlist(productId)
        console.log('Product added to wishlist')
      }
    } catch (err) {
      console.error('Error toggling wishlist:', err)
    }
  }

  if (loading) {
    return (
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Featured Products</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Handpicked favorites that combine exceptional craftsmanship with modern design
            </p>
          </div>
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Featured Products</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {error}
            </p>
          </div>
        </div>
      </section>
    )
  }
  return (
    <section className="py-16 lg:py-24 bg-muted/30">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Featured Products</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Handpicked favorites that combine exceptional craftsmanship with modern design
          </p>
        </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                  {products.map((product) => (
                    <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer">
                      <Link href={`/products/${product.id}`}>
                        <CardContent className="p-0">
                          <div className="relative aspect-square overflow-hidden">
                            <img
                              src={product.image_url || "/placeholder.svg"}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {product.badge && (
                              <Badge
                                className={`absolute top-3 left-3 ${
                                  product.badge === "Sale"
                                    ? "bg-destructive"
                                    : product.badge === "New"
                                      ? "bg-secondary"
                                      : "bg-primary"
                                }`}
                              >
                                {product.badge}
                              </Badge>
                            )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`absolute top-3 right-3 bg-white/90 hover:bg-white shadow-md hover:shadow-lg transition-all duration-200 ${
                          isInWishlist(product.id) ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-gray-600 hover:text-red-500'
                        }`}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleWishlistToggle(product.id)
                        }}
                      >
                        <Heart className={`h-5 w-5 ${isInWishlist(product.id) ? 'fill-current' : 'group-hover:fill-red-500'}`} />
                      </Button>
                          </div>
                            <div className="p-4">
                              <h3 className="font-semibold text-lg mb-2 text-balance hover:text-primary transition-colors">{product.name}</h3>
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{product.rating}</span>
                    <span className="text-sm text-muted-foreground">({product.review_count})</span>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl font-bold">${product.price}</span>
                    {product.original_price && (
                      <span className="text-sm text-muted-foreground line-through">${product.original_price}</span>
                    )}
                  </div>
                            <Button
                              className="w-full"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleAddToCart(product.id)
                              }}
                            >
                              Add to Cart
                            </Button>
                          </div>
                        </CardContent>
                      </Link>
                    </Card>
          ))}
        </div>
        <div className="text-center">
          <Button variant="outline" size="lg" onClick={() => window.location.href = '/products'}>
            View All Products
          </Button>
        </div>
      </div>
    </section>
  )
}
