"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, Heart, Grid, List, Loader2 } from "lucide-react"
import { apiService, Product } from "@/lib/api"
import { useSession } from "@/lib/session-context"
import { useCart } from "@/lib/cart-context"
import { useWishlist } from "@/lib/wishlist-context"

interface ProductGridProps {
  category?: string
  search?: string
  minPrice?: number
  maxPrice?: number
  woodType?: string
}

export function ProductGrid({ category, search, minPrice, maxPrice, woodType }: ProductGridProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("featured")
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isLoggedIn } = useSession()
  const { addToCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const response = await apiService.getProducts({
          category,
          search,
          min_price: minPrice,
          max_price: maxPrice,
          wood_type: woodType,
          sort_by: sortBy,
          limit: 50,
          offset: 0
        })
        setProducts(response.products)
      } catch (err) {
        console.error('Error fetching products:', err)
        setError('Failed to load products')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [category, search, minPrice, maxPrice, woodType, sortBy])

  const handleAddToCart = async (productId: number) => {
    if (!isLoggedIn) {
      window.location.href = '/login'
      return
    }

    try {
      await addToCart(productId, 1)
      console.log('Product added to cart')
    } catch (err) {
      console.error('Error adding to cart:', err)
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
      <div className="space-y-6">
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <p className="text-muted-foreground">Showing {products.length} products</p>
        <div className="flex items-center gap-4">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className={viewMode === "grid" ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
        {products.map((product) => (
          <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer">
            <Link href={`/products/${product.id}`}>
              <CardContent className="p-0">
                {viewMode === "grid" ? (
                  <>
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
                  </>
                ) : (
                  <div className="flex gap-4 p-4">
                    <div className="relative w-32 h-32 flex-shrink-0 overflow-hidden rounded-md">
                      <img
                        src={product.image_url || "/placeholder.svg"}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      {product.badge && (
                        <Badge
                          className={`absolute top-2 left-2 text-xs ${
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
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="font-semibold text-lg hover:text-primary transition-colors cursor-pointer">{product.name}</h3>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{product.rating}</span>
                        <span className="text-sm text-muted-foreground">({product.review_count} reviews)</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {product.wood_type} wood • {product.category}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold">${product.price}</span>
                          {product.original_price && (
                            <span className="text-sm text-muted-foreground line-through">${product.original_price}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Link>
            {viewMode === "list" && (
              <div className="flex gap-2 p-4 pt-0">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className={`hover:bg-red-50 transition-all duration-200 ${
                    isInWishlist(product.id) ? 'text-red-500 bg-red-50' : 'text-gray-600 hover:text-red-500'
                  }`}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleWishlistToggle(product.id)
                  }}
                >
                  <Heart className={`h-5 w-5 ${isInWishlist(product.id) ? 'fill-current' : 'hover:fill-red-500'}`} />
                </Button>
                <Button onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleAddToCart(product.id)
                }}>Add to Cart</Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}