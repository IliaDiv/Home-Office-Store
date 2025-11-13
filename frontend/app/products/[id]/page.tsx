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

// Required for static export
export const dynamicParams = true

export async function generateStaticParams() {
  // For static export, we'll generate a few common product IDs
  // The rest will be handled by client-side routing
  return []
}

export const dynamic = 'force-dynamic' // Force all routes to be dynamic

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
