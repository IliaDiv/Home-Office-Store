import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function Newsletter() {
  return (
    <section className="py-16 lg:py-24">
      <div className="container px-4 mx-auto">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Stay Updated</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Get the latest updates on new arrivals, exclusive offers, and design inspiration delivered to your inbox.
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input type="email" placeholder="Enter your email" className="flex-1" required />
            <Button type="submit" className="sm:w-auto">
              Subscribe
            </Button>
          </form>
          <p className="text-sm text-muted-foreground mt-4">No spam, unsubscribe at any time.</p>
        </div>
      </div>
    </section>
  )
}
