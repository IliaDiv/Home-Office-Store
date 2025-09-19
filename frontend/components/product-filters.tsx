"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { apiService, Category } from "@/lib/api"

interface ProductFiltersProps {
  onFilterChange: (filters: {
    category?: string
    minPrice?: number
    maxPrice?: number
    woodType?: string
  }) => void
  currentFilters: {
    category: string
    minPrice?: number
    maxPrice?: number
    woodType: string
  }
}

export function ProductFilters({ onFilterChange, currentFilters }: ProductFiltersProps) {
  const [priceRange, setPriceRange] = useState([0, 2000])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedWoodTypes, setSelectedWoodTypes] = useState<string[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiService.getCategories()
        setCategories(response.categories)
      } catch (err) {
        console.error('Error fetching categories:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  useEffect(() => {
    // Initialize filters from current filters
    if (currentFilters.category) {
      setSelectedCategories([currentFilters.category])
    }
    if (currentFilters.woodType) {
      setSelectedWoodTypes([currentFilters.woodType])
    }
    if (currentFilters.minPrice !== undefined || currentFilters.maxPrice !== undefined) {
      setPriceRange([
        currentFilters.minPrice || 0,
        currentFilters.maxPrice || 2000
      ])
    }
  }, [currentFilters])

  const handleCategoryChange = (category: string, checked: boolean) => {
    let newCategories: string[]
    if (checked) {
      newCategories = [category] // Only allow one category selection
    } else {
      newCategories = []
    }
    setSelectedCategories(newCategories)
    onFilterChange({ category: newCategories[0] || '' })
  }

  const handleWoodTypeChange = (woodType: string, checked: boolean) => {
    let newWoodTypes: string[]
    if (checked) {
      newWoodTypes = [woodType] // Only allow one wood type selection
    } else {
      newWoodTypes = []
    }
    setSelectedWoodTypes(newWoodTypes)
    onFilterChange({ woodType: newWoodTypes[0] || '' })
  }

  const handlePriceRangeChange = (newRange: number[]) => {
    setPriceRange(newRange)
    onFilterChange({
      minPrice: newRange[0],
      maxPrice: newRange[1]
    })
  }

  const clearFilters = () => {
    setPriceRange([0, 2000])
    setSelectedCategories([])
    setSelectedWoodTypes([])
    onFilterChange({
      category: '',
      minPrice: undefined,
      maxPrice: undefined,
      woodType: ''
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Price Range</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="px-2">
            <Slider 
              value={priceRange} 
              onValueChange={handlePriceRangeChange} 
              max={2000} 
              min={0}
              step={50} 
              className="w-full" 
            />
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1]}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Wood Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {["Oak", "Walnut", "Cherry", "Maple", "Pine"].map((wood) => (
            <div key={wood} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
              <Checkbox
                id={wood.toLowerCase()}
                checked={selectedWoodTypes.includes(wood)}
                onCheckedChange={(checked) => handleWoodTypeChange(wood, checked as boolean)}
                className="border-2 border-primary/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <label htmlFor={wood.toLowerCase()} className="text-sm font-medium cursor-pointer flex-1">
                {wood}
              </label>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full bg-transparent" onClick={clearFilters}>
        Clear Filters
      </Button>
    </div>
  )
}
