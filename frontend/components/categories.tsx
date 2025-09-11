import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

const categories = [
  {
    name: "Desks",
    description: "Standing & sitting desks",
    image: "/wooden-standing-desk.jpg",
    href: "/categories/desks",
    count: "24 products",
  },
  {
    name: "Chairs",
    description: "Ergonomic office chairs",
    image: "/wooden-office-chair.jpg",
    href: "/categories/chairs",
    count: "18 products",
  },
  {
    name: "Storage",
    description: "Shelves & cabinets",
    image: "/wooden-office-shelving-unit.jpg",
    href: "/categories/storage",
    count: "32 products",
  },
  {
    name: "Accessories",
    description: "Desk organizers & more",
    image: "/wooden-desk-accessories.jpg",
    href: "/categories/accessories",
    count: "15 products",
  },
]

export function Categories() {
  return (
    <section className="py-16 lg:py-24">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Shop by Category</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find the perfect pieces for your home office from our carefully curated categories
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link key={category.name} href={category.href}>
              <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={category.image || "/placeholder.svg"}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="font-semibold text-lg mb-1">{category.name}</h3>
                    <p className="text-muted-foreground text-sm mb-2">{category.description}</p>
                    <p className="text-primary text-sm font-medium">{category.count}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
