"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"

interface CategoryFiltersProps {
  category: string
}

export function CategoryFilters({ category }: CategoryFiltersProps) {
  const [priceRange, setPriceRange] = useState([0, 2000])
  const [selectedWoodTypes, setSelectedWoodTypes] = useState<string[]>([])

  const handleWoodTypeChange = (woodType: string, checked: boolean) => {
    if (checked) {
      setSelectedWoodTypes([...selectedWoodTypes, woodType])
    } else {
      setSelectedWoodTypes(selectedWoodTypes.filter((w) => w !== woodType))
    }
  }

  const clearFilters = () => {
    setPriceRange([0, 2000])
    setSelectedWoodTypes([])
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Price Range</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Slider value={priceRange} onValueChange={setPriceRange} max={2000} step={50} className="w-full" />
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
