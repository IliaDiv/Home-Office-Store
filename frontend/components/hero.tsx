import { Button } from "@/components/ui/button"
import Link from "next/link"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background to-muted py-20 lg:py-32">
      <div className="container px-4 mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold text-balance leading-tight">
                Craft Your Perfect
                <span className="text-primary block">Home Office</span>
              </h1>
              <p className="text-xl text-muted-foreground text-pretty max-w-lg">
                Discover our curated collection of premium wooden furniture designed to elevate your workspace with
                timeless craftsmanship and modern functionality.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="text-lg px-8">
                <Link href="/products">Shop Collection</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 bg-transparent">
                <Link href="/categories">Browse Categories</Link>
              </Button>
            </div>
            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Free Shipping</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Handcrafted Quality</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>30-Day Returns</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square rounded-2xl overflow-hidden bg-muted">
              <img
                src="/modern-wooden-desk-in-bright-home-office.jpg"
                alt="Modern wooden desk in a bright home office setting"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-card border rounded-xl p-4 shadow-lg">
              <div className="text-sm text-muted-foreground">Starting from</div>
              <div className="text-2xl font-bold text-primary">$299</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
