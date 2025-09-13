"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { User, Package, Settings, Heart } from "lucide-react"
import { useSession } from "@/lib/session-context"

export default function AccountPage() {
  const { user, isLoggedIn, isLoading } = useSession()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("profile")
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "+1 (555) 123-4567",
  })

  // Update profile when user data is available
  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: "+1 (555) 123-4567", // This would come from user data in a real app
      })
    }
  }, [user])

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      window.location.href = '/login'
    }
  }, [isLoggedIn, isLoading])

  // Handle URL parameters for tab switching
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['profile', 'orders', 'wishlist', 'settings'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const orders = [
    {
      id: "ORD-001",
      date: "2024-01-15",
      status: "Delivered",
      total: 899.99,
      items: ["Executive Oak Desk", "Ergonomic Chair"],
    },
    {
      id: "ORD-002",
      date: "2024-01-10",
      status: "Shipped",
      total: 299.99,
      items: ["Floating Shelves Set"],
    },
  ]

  const wishlist = [
    {
      id: 1,
      name: "Standing Desk Converter",
      price: 449.99,
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: 2,
      name: "Wooden Monitor Stand",
      price: 129.99,
      image: "/placeholder.svg?height=100&width=100",
    },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container px-4 mx-auto py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!isLoggedIn) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container px-4 mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Account</h1>
          <p className="text-muted-foreground">Manage your profile, orders, and preferences</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Wishlist
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold">Order {order.id}</h3>
                        <p className="text-sm text-muted-foreground">Placed on {order.date}</p>
                      </div>
                      <Badge variant={order.status === "Delivered" ? "default" : "secondary"}>{order.status}</Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm">Items: {order.items.join(", ")}</p>
                      <p className="font-semibold">Total: ${order.total}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="wishlist">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlist.map((item) => (
                <Card key={item.id}>
                  <CardContent className="pt-6">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="w-full h-32 object-cover rounded-md mb-4"
                    />
                    <h3 className="font-semibold mb-2">{item.name}</h3>
                    <p className="text-lg font-bold text-primary mb-4">${item.price}</p>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        Add to Cart
                      </Button>
                      <Button size="sm" variant="outline">
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Password</h4>
                  <Button variant="outline">Change Password</Button>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold">Notifications</h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked />
                      <span className="text-sm">Email notifications for orders</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked />
                      <span className="text-sm">Marketing emails</span>
                    </label>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold">Account Actions</h4>
                  <Button variant="destructive">Delete Account</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  )
}
