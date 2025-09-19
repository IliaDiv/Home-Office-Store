"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { apiService, Category } from "@/lib/api"

const categoryImages: Record<string, string> = {
  "Desks": "/wooden-standing-desk.jpg",
  "Chairs": "/wooden-office-chair.jpg",
  "Storage": "/wooden-office-shelving-unit.jpg",
  "Accessories": "/wooden-desk-accessories.jpg",
}

const categoryDescriptions: Record<string, string> = {
  "Desks": "Standing & sitting desks",
  "Chairs": "Ergonomic office chairs",
  "Storage": "Shelves & cabinets",
  "Accessories": "Desk organizers & more",
}

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        const response = await apiService.getCategories()
        setCategories(response.categories)
      } catch (err) {
        console.error('Error fetching categories:', err)
        setError('Failed to load categories')
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  if (loading) {
    return (
      <section className="py-16 lg:py-24">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Shop by Category</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find the perfect pieces for your home office from our carefully curated categories
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
      <section className="py-16 lg:py-24">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Shop by Category</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {error}
            </p>
          </div>
        </div>
      </section>
    )
  }
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
            <Link key={category.category} href={`/categories/${category.category.toLowerCase()}`}>
              <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={categoryImages[category.category] || "/placeholder.svg"}
                      alt={category.category}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="font-semibold text-lg mb-1">{category.category}</h3>
                    <p className="text-muted-foreground text-sm mb-2">
                      {categoryDescriptions[category.category] || "Office furniture"}
                    </p>
                    <p className="text-primary text-sm font-medium">
                      {category.count} product{category.count !== 1 ? 's' : ''}
                    </p>
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
