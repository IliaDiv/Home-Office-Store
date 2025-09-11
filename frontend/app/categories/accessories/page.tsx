import { Header } from "@/components/header"
import { ProductGrid } from "@/components/product-grid"
import { CategoryFilters } from "@/components/category-filters"
import { Footer } from "@/components/footer"

export default function AccessoriesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container px-4 mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">Accessories</h1>
          <p className="text-lg text-muted-foreground">
            Discover our collection of handcrafted wooden accessories for your home office
          </p>
        </div>
        <div className="grid lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <CategoryFilters category="accessories" />
          </aside>
          <div className="lg:col-span-3">
            <ProductGrid category="accessories" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
