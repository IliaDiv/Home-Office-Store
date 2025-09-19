"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { ProductGrid } from "@/components/product-grid"
import { ProductFilters } from "@/components/product-filters"
import { Footer } from "@/components/footer"

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
    maxPrice: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
    woodType: searchParams.get('wood_type') || '',
  })

  useEffect(() => {
    setFilters({
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      minPrice: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
      maxPrice: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
      woodType: searchParams.get('wood_type') || '',
    })
  }, [searchParams])

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container px-4 mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">
            {filters.search ? `Search results for "${filters.search}"` : 'All Products'}
          </h1>
          <p className="text-lg text-muted-foreground">
            {filters.search 
              ? 'Find the perfect products for your home office'
              : 'Discover our complete collection of handcrafted wooden furniture'
            }
          </p>
        </div>
        <div className="grid lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <ProductFilters 
              onFilterChange={handleFilterChange}
              currentFilters={filters}
            />
          </aside>
          <div className="lg:col-span-3">
            <ProductGrid 
              category={filters.category}
              search={filters.search}
              minPrice={filters.minPrice}
              maxPrice={filters.maxPrice}
              woodType={filters.woodType}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
