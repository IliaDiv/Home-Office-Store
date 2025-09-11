"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, Heart, Grid, List } from "lucide-react"

// Mock product data - in real app, this would come from your Flask API
const products = [
  {
    id: 1,
    name: "Executive Oak Desk",
    price: 899,
    originalPrice: 1099,
    rating: 4.8,
    reviews: 124,
    image: "/executive-oak-wooden-desk.jpg",
    category: "Desks",
    wood: "Oak",
    badge: "Best Seller",
  },
  {
    id: 2,
    name: "Ergonomic Walnut Chair",
    price: 549,
    originalPrice: null,
    rating: 4.9,
    reviews: 89,
    image: "/ergonomic-walnut-office-chair.jpg",
    category: "Chairs",
    wood: "Walnut",
    badge: "New",
  },
  {
    id: 3,
    name: "Modular Shelf System",
    price: 299,
    originalPrice: 399,
    rating: 4.7,
    reviews: 156,
    image: "/modular-wooden-shelf-system.jpg",
    category: "Storage",
    wood: "Pine",
    badge: "Sale",
  },
  {
    id: 4,
    name: "Standing Desk Converter",
    price: 449,
    originalPrice: null,
    rating: 4.6,
    reviews: 78,
    image: "/wooden-standing-desk-converter.jpg",
    category: "Desks",
    wood: "Maple",
    badge: null,
  },
  {
    id: 5,
    name: "Cherry Wood Bookshelf",
    price: 379,
    originalPrice: null,
    rating: 4.5,
    reviews: 92,
    image: "/cherry-wood-bookshelf.jpg",
    category: "Storage",
    wood: "Cherry",
    badge: null,
  },
  {
    id: 6,
    name: "Adjustable Desk Organizer",
    price: 89,
    originalPrice: 119,
    rating: 4.4,
    reviews: 203,
    image: "/wooden-desk-organizer.png",
    category: "Accessories",
    wood: "Oak",
    badge: "Sale",
  },
]

interface ProductGridProps {
  category?: string
}

export function ProductGrid({ category }: ProductGridProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("featured")

  const filteredProducts = category
    ? products.filter((product) => product.category.toLowerCase() === category.toLowerCase())
    : products

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <p className="text-muted-foreground">Showing {filteredProducts.length} products</p>
        <div className="flex items-center gap-4">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
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
        {filteredProducts.map((product) => (
          <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
            <CardContent className="p-0">
              {viewMode === "grid" ? (
                <>
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={product.image || "/placeholder.svg"}
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
                      className="absolute top-3 right-3 bg-background/80 hover:bg-background"
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 text-balance">{product.name}</h3>
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{product.rating}</span>
                      <span className="text-sm text-muted-foreground">({product.reviews})</span>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl font-bold">${product.price}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">${product.originalPrice}</span>
                      )}
                    </div>
                    <Button className="w-full">Add to Cart</Button>
                  </div>
                </>
              ) : (
                <div className="flex gap-4 p-4">
                  <div className="relative w-32 h-32 flex-shrink-0 overflow-hidden rounded-md">
                    <img
                      src={product.image || "/placeholder.svg"}
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
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{product.rating}</span>
                      <span className="text-sm text-muted-foreground">({product.reviews} reviews)</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {product.wood} wood • {product.category}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold">${product.price}</span>
                        {product.originalPrice && (
                          <span className="text-sm text-muted-foreground line-through">${product.originalPrice}</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon">
                          <Heart className="h-4 w-4" />
                        </Button>
                        <Button>Add to Cart</Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
