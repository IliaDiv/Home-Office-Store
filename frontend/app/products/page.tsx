import { Header } from "@/components/header"
import { ProductGrid } from "@/components/product-grid"
import { ProductFilters } from "@/components/product-filters"
import { Footer } from "@/components/footer"

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container px-4 mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">All Products</h1>
          <p className="text-lg text-muted-foreground">
            Discover our complete collection of handcrafted wooden furniture
          </p>
        </div>
        <div className="grid lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <ProductFilters />
          </aside>
          <div className="lg:col-span-3">
            <ProductGrid />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
