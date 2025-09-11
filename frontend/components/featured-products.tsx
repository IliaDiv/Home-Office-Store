import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Heart } from "lucide-react"

const featuredProducts = [
  {
    id: 1,
    name: "Executive Oak Desk",
    price: 899,
    originalPrice: 1099,
    rating: 4.8,
    reviews: 124,
    image: "/executive-oak-wooden-desk.jpg",
    badge: "Best Seller",
    isNew: false,
  },
  {
    id: 2,
    name: "Ergonomic Walnut Chair",
    price: 549,
    originalPrice: null,
    rating: 4.9,
    reviews: 89,
    image: "/ergonomic-walnut-office-chair.jpg",
    badge: "New",
    isNew: true,
  },
  {
    id: 3,
    name: "Modular Shelf System",
    price: 299,
    originalPrice: 399,
    rating: 4.7,
    reviews: 156,
    image: "/modular-wooden-shelf-system.jpg",
    badge: "Sale",
    isNew: false,
  },
  {
    id: 4,
    name: "Standing Desk Converter",
    price: 449,
    originalPrice: null,
    rating: 4.6,
    reviews: 78,
    image: "/wooden-standing-desk-converter.jpg",
    badge: null,
    isNew: false,
  },
]

export function FeaturedProducts() {
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
          {featuredProducts.map((product) => (
            <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
              <CardContent className="p-0">
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
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center">
          <Button variant="outline" size="lg">
            View All Products
          </Button>
        </div>
      </div>
    </section>
  )
}
