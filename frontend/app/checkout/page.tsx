"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/lib/cart-context"
import { useSession } from "@/lib/session-context"
import { apiService } from "@/lib/api"
import { CreditCard, MapPin, User, Loader2, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalPrice, clearCart, refreshCart } = useCart()
  const { isLoggedIn, user } = useSession()
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  const [orderId, setOrderId] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    shippingAddress: {
      firstName: user?.first_name || '',
      lastName: user?.last_name || '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States'
    },
    billingAddress: {
      sameAsShipping: true,
      firstName: '',
      lastName: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States'
    },
    paymentMethod: 'credit_card',
    cardNumber: '',
    expiryDate: '',
      cvv: '',
    email: user?.email || '',
    phone: ''
  })

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    if (items.length === 0) {
      router.push('/cart')
      return
    }
  }, [isLoggedIn, items.length, router])

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      const orderData = {
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price
        })),
        total_amount: totalPrice,
        shipping_address: `${formData.shippingAddress.firstName} ${formData.shippingAddress.lastName}\n${formData.shippingAddress.address}\n${formData.shippingAddress.city}, ${formData.shippingAddress.state} ${formData.shippingAddress.zipCode}\n${formData.shippingAddress.country}`,
        billing_address: formData.billingAddress.sameAsShipping 
          ? `${formData.shippingAddress.firstName} ${formData.shippingAddress.lastName}\n${formData.shippingAddress.address}\n${formData.shippingAddress.city}, ${formData.shippingAddress.state} ${formData.shippingAddress.zipCode}\n${formData.shippingAddress.country}`
          : `${formData.billingAddress.firstName} ${formData.billingAddress.lastName}\n${formData.billingAddress.address}\n${formData.billingAddress.city}, ${formData.billingAddress.state} ${formData.billingAddress.zipCode}\n${formData.billingAddress.country}`,
        payment_method: formData.paymentMethod
      }

      const response = await apiService.createOrder(orderData)
      setOrderId(response.order.id)
      setOrderComplete(true)
      await clearCart()
    } catch (error) {
      console.error('Error creating order:', error)
      alert('There was an error processing your order. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isLoggedIn) {
    return null // Will redirect via useEffect
  }

  if (items.length === 0 && !orderComplete) {
    return null // Will redirect via useEffect
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container px-4 mx-auto py-16">
          <div className="max-w-2xl mx-auto text-center">
            <CheckCircle className="h-16 w-16 mx-auto mb-6 text-green-500" />
            <h1 className="text-3xl font-bold mb-4">Order Confirmed!</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Thank you for your order. Your order #{orderId} has been placed successfully.
            </p>
            <div className="space-y-4">
              <Button asChild size="lg">
                <Link href="/account?tab=orders">View Order Details</Link>
              </Button>
              <Button variant="outline" asChild size="lg">
                <Link href="/products">Continue Shopping</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container px-4 mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Checkout</h1>
          <p className="text-muted-foreground">Complete your order</p>
        </div>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="space-y-8">
            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shippingFirstName">First Name</Label>
                    <Input
                      id="shippingFirstName"
                      value={formData.shippingAddress.firstName}
                      onChange={(e) => handleInputChange('shippingAddress.firstName', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="shippingLastName">Last Name</Label>
                    <Input
                      id="shippingLastName"
                      value={formData.shippingAddress.lastName}
                      onChange={(e) => handleInputChange('shippingAddress.lastName', e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="shippingAddress">Address</Label>
                  <Input
                    id="shippingAddress"
                    value={formData.shippingAddress.address}
                    onChange={(e) => handleInputChange('shippingAddress.address', e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="shippingCity">City</Label>
                    <Input
                      id="shippingCity"
                      value={formData.shippingAddress.city}
                      onChange={(e) => handleInputChange('shippingAddress.city', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="shippingState">State</Label>
                    <Input
                      id="shippingState"
                      value={formData.shippingAddress.state}
                      onChange={(e) => handleInputChange('shippingAddress.state', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="shippingZipCode">ZIP Code</Label>
                    <Input
                      id="shippingZipCode"
                      value={formData.shippingAddress.zipCode}
                      onChange={(e) => handleInputChange('shippingAddress.zipCode', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Billing Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Billing Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="sameAsShipping"
                    checked={formData.billingAddress.sameAsShipping}
                    onChange={(e) => handleInputChange('billingAddress.sameAsShipping', e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="sameAsShipping">Same as shipping address</Label>
                </div>

                {!formData.billingAddress.sameAsShipping && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="billingFirstName">First Name</Label>
                        <Input
                          id="billingFirstName"
                          value={formData.billingAddress.firstName}
                          onChange={(e) => handleInputChange('billingAddress.firstName', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="billingLastName">Last Name</Label>
                        <Input
                          id="billingLastName"
                          value={formData.billingAddress.lastName}
                          onChange={(e) => handleInputChange('billingAddress.lastName', e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="billingAddress">Address</Label>
                      <Input
                        id="billingAddress"
                        value={formData.billingAddress.address}
                        onChange={(e) => handleInputChange('billingAddress.address', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="billingCity">City</Label>
                        <Input
                          id="billingCity"
                          value={formData.billingAddress.city}
                          onChange={(e) => handleInputChange('billingAddress.city', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="billingState">State</Label>
                        <Input
                          id="billingState"
                          value={formData.billingAddress.state}
                          onChange={(e) => handleInputChange('billingAddress.state', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="billingZipCode">ZIP Code</Label>
                        <Input
                          id="billingZipCode"
                          value={formData.billingAddress.zipCode}
                          onChange={(e) => handleInputChange('billingAddress.zipCode', e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) => handleInputChange('paymentMethod', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="debit_card">Debit Card</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={formData.cardNumber}
                      onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      placeholder="MM/YY"
                      value={formData.expiryDate}
                      onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      value={formData.cvv}
                      onChange={(e) => handleInputChange('cvv', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <img
                      src={item.image_url || "/placeholder.svg"}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.wood_type} wood • Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-sm text-muted-foreground">Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span className="text-sm text-muted-foreground">Calculated at checkout</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing Order...
                    </>
                  ) : (
                    'Place Order'
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  By placing this order, you agree to our terms and conditions.
                  This is a demo checkout - no actual payment will be processed.
                </p>
              </CardContent>
            </Card>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  )
}
