"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Heart, ArrowLeft, Loader2 } from "lucide-react"
import { apiService, Product } from "@/lib/api"
import { useSession } from "@/lib/session-context"
import { useCart } from "@/lib/cart-context"
import { useWishlist } from "@/lib/wishlist-context"
import { ProductReviews } from "@/components/product-reviews"
import Link from "next/link"

export default function ProductDetailPage() {
  const params = useParams()
  const productId = params.id as string
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const { isLoggedIn } = useSession()
  const { addToCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const response = await apiService.getProduct(parseInt(productId))
        setProduct(response.product)
      } catch (err) {
        console.error('Error fetching product:', err)
        setError('Product not found')
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchProduct()
    }
  }, [productId])

  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      window.location.href = '/login'
      return
    }

    if (!product) return

    setAddingToCart(true)
    try {
      await addToCart(product.id, quantity)
      console.log('Product added to cart')
    } catch (err) {
      console.error('Error adding to cart:', err)
    } finally {
      setAddingToCart(false)
    }
  }

  const handleWishlistToggle = async () => {
    if (!isLoggedIn) {
      window.location.href = '/login'
      return
    }
    if (product) {
      try {
        if (isInWishlist(product.id)) {
          await removeFromWishlist(product.id)
          console.log('Product removed from wishlist')
        } else {
          await addToWishlist(product.id)
          console.log('Product added to wishlist')
        }
      } catch (err) {
        console.error('Error toggling wishlist:', err)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container px-4 mx-auto py-16">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container px-4 mx-auto py-16">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Product not found</h1>
            <p className="text-muted-foreground mb-6">
              The product you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container px-4 mx-auto py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/products" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Products
            </Link>
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-lg">
              <img
                src={product.image_url || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              {product.badge && (
                <Badge
                  className={`mb-4 ${
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
              <h1 className="text-3xl lg:text-4xl font-bold mb-4">{product.name}</h1>
              <div className="flex items-center gap-1 mb-4">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="text-lg font-medium">{product.rating}</span>
                <span className="text-muted-foreground">({product.review_count} reviews)</span>
              </div>
              <div className="flex items-center gap-4 mb-6">
                <span className="text-3xl font-bold">${product.price}</span>
                {product.original_price && (
                  <span className="text-xl text-muted-foreground line-through">${product.original_price}</span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{product.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Category</h4>
                  <p className="text-sm">{product.category}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Wood Type</h4>
                  <p className="text-sm">{product.wood_type}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Stock</h4>
                  <p className="text-sm">
                    {product.stock_quantity > 0 
                      ? `${product.stock_quantity} in stock` 
                      : 'Out of stock'
                    }
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">SKU</h4>
                  <p className="text-sm">#{product.id.toString().padStart(6, '0')}</p>
                </div>
              </div>
            </div>

            {/* Add to Cart */}
            <div className="space-y-4 pt-6 border-t">
              <div className="flex items-center gap-4">
                <div className="flex items-center border rounded-md">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </Button>
                  <span className="px-4 py-2 min-w-[3rem] text-center">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </Button>
                </div>
                <Button
                  className="flex-1 h-10"
                  onClick={handleAddToCart}
                  disabled={addingToCart || product.stock_quantity === 0}
                >
                  {addingToCart ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Adding...
                    </>
                  ) : product.stock_quantity === 0 ? (
                    'Out of Stock'
                  ) : (
                    'Add to Cart'
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className={`h-10 w-10 hover:bg-red-50 transition-all duration-200 ${
                    isInWishlist(product.id) ? 'text-red-500 border-red-500 bg-red-50' : 'hover:text-red-500 hover:border-red-500'
                  }`}
                  onClick={handleWishlistToggle}
                >
                  <Heart className={`h-5 w-5 ${isInWishlist(product.id) ? 'fill-current' : 'hover:fill-red-500'}`} />
                </Button>
              </div>

              {product.stock_quantity > 0 && (
                <p className="text-sm text-muted-foreground">
                  Free shipping on orders over $500. Estimated delivery: 3-5 business days.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-16 space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-6">Product Specifications</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Materials</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Premium {product.wood_type} wood construction</li>
                    <li>• Eco-friendly finishes</li>
                    <li>• Durable hardware</li>
                    <li>• Handcrafted quality</li>
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Care Instructions</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Dust regularly with a soft cloth</li>
                    <li>• Use wood polish monthly</li>
                    <li>• Avoid direct sunlight</li>
                    <li>• Keep away from moisture</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <ProductReviews productId={product.id} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
