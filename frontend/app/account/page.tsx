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
import { User, Package, Settings, Heart, MessageCircle } from "lucide-react"
import { useSession } from "@/lib/session-context"
import { useWishlist } from "@/lib/wishlist-context"
import { apiService, Order } from "@/lib/api"

interface Ticket {
  id: number
  category: string
  description: string
  status: string
  priority: string
  created_at: string
  updated_at: string
}
import Link from "next/link"

export default function AccountPage() {
  const { user, isLoggedIn, isLoading } = useSession()
  const { items: wishlistItems, removeFromWishlist } = useWishlist()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("profile")
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [ticketsLoading, setTicketsLoading] = useState(false)
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "+1 (555) 123-4567",
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [deleteForm, setDeleteForm] = useState({
    confirmText: "",
    password: "",
  })

  const [notifications, setNotifications] = useState<{
    type: 'success' | 'error' | 'info'
    message: string
  } | null>(null)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [fieldErrors, setFieldErrors] = useState<{
    firstName?: string
    lastName?: string
    phone?: string
    currentPassword?: string
    newPassword?: string
    confirmPassword?: string
    deletePassword?: string
  }>({})

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
    if (tab && ['profile', 'orders', 'tickets', 'wishlist', 'settings'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  // Fetch orders when orders tab is active
  useEffect(() => {
    if (activeTab === 'orders' && isLoggedIn) {
      const fetchOrders = async () => {
        try {
          setOrdersLoading(true)
          const response = await apiService.getUserOrders()
          setOrders(response.orders)
        } catch (error) {
          console.error('Error fetching orders:', error)
        } finally {
          setOrdersLoading(false)
        }
      }
      fetchOrders()
    }
  }, [activeTab, isLoggedIn])

  // Fetch tickets when tickets tab is active
  useEffect(() => {
    if (activeTab === 'tickets' && isLoggedIn) {
      const fetchTickets = async () => {
        try {
          setTicketsLoading(true)
          const response = await apiService.getUserTickets()
          setTickets(response.tickets)
        } catch (error) {
          console.error('Error fetching tickets:', error)
        } finally {
          setTicketsLoading(false)
        }
      }
      fetchTickets()
    }
  }, [activeTab, isLoggedIn])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'shipped':
        return 'bg-blue-100 text-blue-800'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'pending':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleProfileChange = (field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous field errors
    setFieldErrors({})
    
    // Basic validation
    const errors: any = {}
    if (!profile.firstName.trim()) {
      errors.firstName = 'First name is required'
    }
    if (!profile.lastName.trim()) {
      errors.lastName = 'Last name is required'
    }
    if (!profile.phone.trim()) {
      errors.phone = 'Phone number is required'
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    
    try {
      const result = await apiService.updateProfile({
        first_name: profile.firstName,
        last_name: profile.lastName,
        phone: profile.phone
      })
      
      setNotifications({
        type: 'success',
        message: 'Profile updated successfully!'
      })
      
      // Update the user context with new data
      if (user) {
        const updatedUser = { ...user, ...result.user }
        localStorage.setItem('user', JSON.stringify(updatedUser))
        // Trigger a re-render by updating the user context
        window.location.reload()
      }
      
    } catch (error: any) {
      console.error('Error updating profile:', error)
      setNotifications({
        type: 'error',
        message: error.message || 'Failed to update profile. Please try again.'
      })
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous field errors
    setFieldErrors({})
    
    // Basic validation
    const errors: any = {}
    if (!passwordForm.currentPassword.trim()) {
      errors.currentPassword = 'Current password is required'
    }
    if (!passwordForm.newPassword.trim()) {
      errors.newPassword = 'New password is required'
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = 'New password must be at least 8 characters long'
    }
    if (!passwordForm.confirmPassword.trim()) {
      errors.confirmPassword = 'Please confirm your new password'
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    try {
      await apiService.changePassword({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword
      })
      
      setNotifications({
        type: 'success',
        message: 'Password updated successfully!'
      })
      
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error: any) {
      console.error('Error updating password:', error)
      if (error.message && error.message.includes('Current password')) {
        setFieldErrors({ currentPassword: 'Current password is incorrect' })
      } else {
        setNotifications({
          type: 'error',
          message: error.message || 'Failed to update password. Please try again.'
        })
      }
    }
  }

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous field errors
    setFieldErrors({})
    
    // Basic validation
    const errors: any = {}
    if (deleteForm.confirmText !== 'DELETE') {
      setNotifications({
        type: 'error',
        message: 'Please type "DELETE" to confirm account deletion'
      })
      return
    }

    if (!deleteForm.password.trim()) {
      errors.deletePassword = 'Password is required to delete account'
      setFieldErrors(errors)
      return
    }

    // Show confirmation notification instead of browser confirm
    setShowDeleteConfirm(true)
  }

  const confirmDeleteAccount = async () => {
    try {
      await apiService.deleteAccount(deleteForm.password)
      
      setNotifications({
        type: 'success',
        message: 'Account deleted successfully. You will be redirected to the home page.'
      })
      
      // Clear user data and redirect
      setTimeout(() => {
        localStorage.removeItem('user')
        window.location.href = '/'
      }, 2000)
      
    } catch (error: any) {
      console.error('Error deleting account:', error)
      if (error.message && error.message.includes('Password')) {
        setFieldErrors({ deletePassword: 'Password is incorrect' })
        setShowDeleteConfirm(false)
      } else {
        setNotifications({
          type: 'error',
          message: error.message || 'Failed to delete account. Please try again.'
        })
        setShowDeleteConfirm(false)
      }
    }
  }

  const cancelDeleteAccount = () => {
    setShowDeleteConfirm(false)
    setDeleteForm({
      confirmText: "",
      password: "",
    })
  }

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

        {/* Notifications */}
        {notifications && (
          <div className={`mb-6 p-4 rounded-lg border ${
            notifications.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : notifications.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-center justify-between">
              <p className="font-medium">{notifications.message}</p>
              <button
                onClick={() => setNotifications(null)}
                className="ml-4 text-lg font-bold hover:opacity-70"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Tickets
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
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={profile.firstName}
                        onChange={(e) => handleProfileChange('firstName', e.target.value)}
                        required
                        className={fieldErrors.firstName ? 'border-red-500' : ''}
                      />
                      {fieldErrors.firstName && (
                        <p className="text-sm text-red-500">{fieldErrors.firstName}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profile.lastName}
                        onChange={(e) => handleProfileChange('lastName', e.target.value)}
                        required
                        className={fieldErrors.lastName ? 'border-red-500' : ''}
                      />
                      {fieldErrors.lastName && (
                        <p className="text-sm text-red-500">{fieldErrors.lastName}</p>
                      )}
                    </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                      disabled
                      className="bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                    <p className="text-sm text-muted-foreground">Email cannot be changed</p>
                </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => handleProfileChange('phone', e.target.value)}
                      required
                      className={fieldErrors.phone ? 'border-red-500' : ''}
                    />
                    {fieldErrors.phone && (
                      <p className="text-sm text-red-500">{fieldErrors.phone}</p>
                    )}
                  </div>
                  <Button type="submit">Save Changes</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            {ordersLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : orders.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h4 className="text-lg font-semibold mb-2">No orders yet</h4>
                  <p className="text-muted-foreground mb-4">
                    You haven't placed any orders yet. Start shopping to see your orders here.
                  </p>
                  <Button asChild>
                    <Link href="/products">Start Shopping</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id}>
                    <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                          <h4 className="font-semibold">Order #{order.id}</h4>
                          <p className="text-sm text-muted-foreground">
                            Placed on {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="font-medium">Total:</span>
                          <span>${order.total_amount.toFixed(2)}</span>
                    </div>
                        <div>
                          <p className="font-medium mb-2">Items:</p>
                    <div className="space-y-2">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex items-center gap-3">
                                <img
                                  src={item.product_image || "/placeholder.svg"}
                                  alt={item.product_name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{item.product_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Qty: {item.quantity} × ${item.price.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            )}
          </TabsContent>

          <TabsContent value="tickets">
            {ticketsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : tickets.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h4 className="text-lg font-semibold mb-2">No support tickets</h4>
                  <p className="text-muted-foreground mb-4">
                    You haven't created any support tickets yet. Use the chat widget to get help with your orders.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <Card key={ticket.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-semibold">Ticket #{ticket.id}</h4>
                          <p className="text-sm text-muted-foreground">
                            Created on {new Date(ticket.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={ticket.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                          </Badge>
                          <Badge variant="outline">
                            {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="font-medium mb-1">Category:</p>
                          <p className="text-sm text-muted-foreground capitalize">{ticket.category}</p>
                        </div>
                        <div>
                          <p className="font-medium mb-1">Description:</p>
                          <p className="text-sm text-muted-foreground">{ticket.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="wishlist">
            {wishlistItems.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h4 className="text-lg font-semibold mb-2">Your wishlist is empty</h4>
                  <p className="text-muted-foreground mb-4">
                    Save items you love to your wishlist to view them later.
                  </p>
                  <Button asChild>
                    <Link href="/products">Start Shopping</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlistItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="pt-6">
                    <img
                        src={item.image_url || "/placeholder.svg"}
                      alt={item.name}
                      className="w-full h-32 object-cover rounded-md mb-4"
                    />
                    <h3 className="font-semibold mb-2">{item.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {item.wood_type} wood • {item.category}
                      </p>
                      <p className="text-lg font-bold text-primary mb-4">${item.price.toFixed(2)}</p>
                    <div className="flex gap-2">
                        <Button size="sm" className="flex-1" asChild>
                          <Link href={`/products/${item.product_id}`}>View Details</Link>
                      </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={async () => {
                            try {
                              await removeFromWishlist(item.product_id)
                              console.log('Removed from wishlist:', item.product_id)
                            } catch (error) {
                              console.error('Error removing from wishlist:', error)
                            }
                          }}
                        >
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            )}
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6">
            <Card>
              <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
              </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        placeholder="Enter current password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                        required
                        className={fieldErrors.currentPassword ? 'border-red-500' : ''}
                      />
                      {fieldErrors.currentPassword && (
                        <p className="text-sm text-red-500">{fieldErrors.currentPassword}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Enter new password"
                        value={passwordForm.newPassword}
                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                        required
                        minLength={8}
                        className={fieldErrors.newPassword ? 'border-red-500' : ''}
                      />
                      {fieldErrors.newPassword && (
                        <p className="text-sm text-red-500">{fieldErrors.newPassword}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm new password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                        required
                        minLength={8}
                        className={fieldErrors.confirmPassword ? 'border-red-500' : ''}
                      />
                      {fieldErrors.confirmPassword && (
                        <p className="text-sm text-red-500">{fieldErrors.confirmPassword}</p>
                      )}
                    </div>
                    <Button type="submit">Update Password</Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-destructive">Delete Account</CardTitle>
                  <CardDescription>
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm text-destructive font-medium mb-2">Warning</p>
                    <p className="text-sm text-destructive/80">
                      Deleting your account will permanently remove:
                    </p>
                    <ul className="text-sm text-destructive/80 mt-2 ml-4 list-disc">
                      <li>Your profile information</li>
                      <li>Order history</li>
                      <li>Wishlist items</li>
                      <li>Product reviews</li>
                      <li>All other account data</li>
                    </ul>
                  </div>
                  <form onSubmit={handleDeleteAccount} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="deletePassword">Enter your password</Label>
                      <Input
                        id="deletePassword"
                        type="password"
                        placeholder="Enter your current password"
                        value={deleteForm.password}
                        onChange={(e) => setDeleteForm(prev => ({ ...prev, password: e.target.value }))}
                        required
                        className={fieldErrors.deletePassword ? 'border-red-500' : ''}
                      />
                      {fieldErrors.deletePassword && (
                        <p className="text-sm text-red-500">{fieldErrors.deletePassword}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deleteConfirm">Type "DELETE" to confirm</Label>
                      <Input
                        id="deleteConfirm"
                        placeholder="Type DELETE to confirm"
                        value={deleteForm.confirmText}
                        onChange={(e) => setDeleteForm(prev => ({ ...prev, confirmText: e.target.value }))}
                        required
                      />
                </div>
                    <Button 
                      type="submit" 
                      variant="destructive" 
                      disabled={deleteForm.confirmText !== 'DELETE' || !deleteForm.password}
                    >
                      Delete Account
                    </Button>
                  </form>
              </CardContent>
            </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-red-600 mb-4">Confirm Account Deletion</h3>
            <p className="text-gray-700 mb-6">
              Are you absolutely sure you want to delete your account? This action cannot be undone and will permanently remove:
            </p>
            <ul className="text-sm text-gray-600 mb-6 space-y-1">
              <li>• Your profile and account information</li>
              <li>• All order history</li>
              <li>• Wishlist items</li>
              <li>• Product reviews</li>
              <li>• All other account data</li>
            </ul>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={cancelDeleteAccount}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteAccount}
              >
                Yes, Delete My Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
