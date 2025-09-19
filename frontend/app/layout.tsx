import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Suspense } from "react"
import { ChatWidget } from "@/components/chat-widget"
import { SessionProvider } from "@/lib/session-context"
import { CartProvider } from "@/lib/cart-context"
import { WishlistProvider } from "@/lib/wishlist-context"
import "./globals.css"

export const metadata: Metadata = {
  title: "Home Office Store - Curated Wooden Furniture",
  description:
    "Premium wooden furniture for your home office. Desks, chairs, shelving, and storage solutions crafted with quality and style.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <SessionProvider>
          <CartProvider>
            <WishlistProvider>
              <Suspense fallback={null}>{children}</Suspense>
              <ChatWidget />
            </WishlistProvider>
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
