import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Heart, ArrowLeft } from "lucide-react"
import { Product } from "@/lib/api"
import { ProductReviews } from "@/components/product-reviews"
import Link from "next/link"
import { ProductDetailClient } from "./product-detail-client"

export function generateStaticParams() {
  // Generate multiple product IDs to pre-build
  // Add all the product IDs you expect to have
  const productIds = Array.from({ length: 30 }, (_, i) => (i + 1).toString())
  
  return productIds.map(id => ({
    id: id
  }))
}

interface ProductDetailPageProps {
  params: {
    id: string
  }
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ProductDetailClient productId={params.id} />
      <Footer />
    </div>
  )
}
