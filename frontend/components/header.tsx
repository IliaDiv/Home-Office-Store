"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Menu, Search, ShoppingCart, User } from "lucide-react"
import { useSession } from "@/lib/session-context"
import { useCart } from "@/lib/cart-context"

export function Header() {
  const { user, isLoggedIn, logout, isLoading } = useSession()
  const { itemCount } = useCart()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">HO</span>
          </div>
          <span className="font-bold text-xl">Home Office Store</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/products" className="text-foreground hover:text-primary transition-colors">
            All Products
          </Link>
          <Link href="/categories/desks" className="text-foreground hover:text-primary transition-colors">
            Desks
          </Link>
          <Link href="/categories/chairs" className="text-foreground hover:text-primary transition-colors">
            Chairs
          </Link>
          <Link href="/categories/storage" className="text-foreground hover:text-primary transition-colors">
            Storage
          </Link>
          <Link href="/categories/accessories" className="text-foreground hover:text-primary transition-colors">
            Accessories
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search products..."
              className="px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent w-64"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const searchTerm = (e.target as HTMLInputElement).value
                  if (searchTerm.trim()) {
                    window.location.href = `/products?search=${encodeURIComponent(searchTerm.trim())}`
                  }
                }
              }}
            />
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {isLoading ? (
                <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
              ) : isLoggedIn && user ? (
                <>
                  <div className="px-2 py-1.5 text-sm font-medium text-foreground">
                    {user.first_name} {user.last_name}
                  </div>
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    {user.email}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account?tab=profile">My Account</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account?tab=orders">Order History</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account?tab=wishlist">Wishlist</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>Sign Out</DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/login">Sign In</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/register">Create Account</Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {itemCount}
                </Badge>
              )}
            </Link>
          </Button>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col space-y-4 mt-8">
                <Link href="/products" className="text-lg font-medium hover:text-primary transition-colors">
                  All Products
                </Link>
                <Link href="/categories/desks" className="text-lg font-medium hover:text-primary transition-colors">
                  Desks
                </Link>
                <Link href="/categories/chairs" className="text-lg font-medium hover:text-primary transition-colors">
                  Chairs
                </Link>
                <Link href="/categories/storage" className="text-lg font-medium hover:text-primary transition-colors">
                  Storage
                </Link>
                <Link
                  href="/categories/accessories"
                  className="text-lg font-medium hover:text-primary transition-colors"
                >
                  Accessories
                </Link>
                <div className="border-t pt-4 mt-4">
                  {isLoading ? (
                    <div className="text-lg font-medium text-muted-foreground">Loading...</div>
                  ) : isLoggedIn && user ? (
                    <>
                      <div className="text-lg font-medium text-foreground mb-1">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground mb-4">
                        {user.email}
                      </div>
                      <Link
                        href="/account?tab=profile"
                        className="text-lg font-medium hover:text-primary transition-colors block mb-2"
                      >
                        My Account
                      </Link>
                      <Button
                        variant="ghost"
                        className="text-lg font-medium hover:text-primary transition-colors p-0 h-auto"
                        onClick={logout}
                      >
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="text-lg font-medium hover:text-primary transition-colors block mb-2"
                      >
                        Sign In
                      </Link>
                      <Link href="/register" className="text-lg font-medium hover:text-primary transition-colors block">
                        Create Account
                      </Link>
                    </>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
