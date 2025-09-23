import { getBaseApiUrl } from './config'

export interface Product {
  id: number
  name: string
  description: string
  price: number
  original_price?: number
  category: string
  wood_type: string
  image_url: string
  rating: number
  review_count: number
  badge?: string
  is_featured: boolean
  stock_quantity: number
  created_at: string
  updated_at: string
}

export interface CartItem {
  id: number
  user_id: number
  product_id: number
  quantity: number
  name: string
  price: number
  image_url: string
  wood_type: string
  category: string
  created_at: string
  updated_at: string
}

export interface Category {
  category: string
  count: number
}

export interface ProductDetail {
  product_name: string
  quantity: number
  price: number
}

export interface Order {
  id: number
  user_id: number
  product_details: ProductDetail[]
  total_amount: number
  status: string
  shipping_address: string
  billing_address: string
  payment_method: string
  payment_status: string
  created_at: string
  updated_at: string
  items: OrderItem[]
}

export interface OrderItem {
  id: number
  product_id: number
  quantity: number
  price: number
  product_name: string
  product_image: string
}

export interface WishlistItem {
  id: number
  user_id: number
  product_id: number
  name: string
  price: number
  image_url: string
  wood_type: string
  category: string
  rating: number
  review_count: number
  created_at: string
}

export interface Review {
  id: number
  user_id: number
  product_id: number
  rating: number
  title: string
  comment: string
  first_name: string
  last_name: string
  created_at: string
  updated_at: string
}

export interface ApiResponse<T> {
  success?: boolean
  error?: string
  data?: T
}

class ApiService {
  private baseUrl: string

  constructor() {
    this.baseUrl = getBaseApiUrl()
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Add user ID to headers if available
    const user = this.getCurrentUser()
    if (user) {
      defaultHeaders['X-User-ID'] = user.id.toString()
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error)
      throw error
    }
  }

  private getCurrentUser() {
    try {
      const user = localStorage.getItem('user')
      return user ? JSON.parse(user) : null
    } catch {
      return null
    }
  }

  // Product API methods
  async getProducts(params: {
    category?: string
    search?: string
    min_price?: number
    max_price?: number
    wood_type?: string
    sort_by?: string
    limit?: number
    offset?: number
  } = {}): Promise<{ products: Product[]; total: number }> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString())
      }
    })

    const queryString = searchParams.toString()
    const endpoint = `/products${queryString ? `?${queryString}` : ''}`
    
    return this.request<{ products: Product[]; total: number }>(endpoint)
  }

  async getProduct(id: number): Promise<{ product: Product }> {
    return this.request<{ product: Product }>(`/products/${id}`)
  }

  async getFeaturedProducts(limit: number = 4): Promise<{ products: Product[] }> {
    return this.request<{ products: Product[] }>(`/products/featured?limit=${limit}`)
  }

  async getCategories(): Promise<{ categories: Category[] }> {
    return this.request<{ categories: Category[] }>('/categories')
  }

  // Cart API methods
  async getCart(): Promise<{ items: CartItem[] }> {
    return this.request<{ items: CartItem[] }>('/cart')
  }

  async addToCart(productId: number, quantity: number = 1): Promise<{ message: string }> {
    return this.request<{ message: string }>('/cart/add', {
      method: 'POST',
      body: JSON.stringify({
        product_id: productId,
        quantity,
      }),
    })
  }

  async updateCartItem(productId: number, quantity: number): Promise<{ message: string }> {
    return this.request<{ message: string }>('/cart/update', {
      method: 'PUT',
      body: JSON.stringify({
        product_id: productId,
        quantity,
      }),
    })
  }

  async clearCart(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/cart/clear', {
      method: 'DELETE',
    })
  }

  // User API methods
  async login(email: string, password: string): Promise<{ user: any; message: string }> {
    return this.request<{ user: any; message: string }>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async register(userData: {
    firstName: string
    lastName: string
    email: string
    password: string
  }): Promise<{ user: any; message: string }> {
    return this.request<{ user: any; message: string }>('/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  // Chat API methods
  async sendMessage(message: string, sessionId?: string): Promise<{
    reply: string
    ticket?: string
    sessionId: string
  }> {
    const currentUser = this.getCurrentUser()
    const userId = currentUser?.id
    
    console.log('Sending chat message:', {
      message,
      sessionId: sessionId || this.generateSessionId(),
      userId,
      user: currentUser
    })
    
    return this.request<{
      reply: string
      ticket?: string
      sessionId: string
    }>('/webhook/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        sessionId: sessionId || this.generateSessionId(),
        userId: userId
      }),
    })
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  // Order API methods
  async createOrder(orderData: {
    items: Array<{
      product_id: number
      quantity: number
      price: number
    }>
    total_amount: number
    shipping_address?: string
    billing_address?: string
    payment_method?: string
  }): Promise<{ order: Order }> {
    return this.request<{ order: Order }>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    })
  }

  async getUserOrders(): Promise<{ orders: Order[] }> {
    return this.request<{ orders: Order[] }>('/orders')
  }

  async getUserTickets(): Promise<{ tickets: any[] }> {
    return this.request<{ tickets: any[] }>('/tickets')
  }

  // Wishlist API methods
  async getWishlist(): Promise<{ items: WishlistItem[] }> {
    return this.request<{ items: WishlistItem[] }>('/wishlist')
  }

  async addToWishlist(productId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>('/wishlist/add', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId }),
    })
  }

  async removeFromWishlist(productId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>('/wishlist/remove', {
      method: 'DELETE',
      body: JSON.stringify({ product_id: productId }),
    })
  }

  // Review API methods
  async getProductReviews(productId: number): Promise<{ reviews: Review[] }> {
    return this.request<{ reviews: Review[] }>(`/reviews/${productId}`)
  }

  async addReview(reviewData: {
    product_id: number
    rating: number
    title: string
    comment: string
  }): Promise<{ review: Review }> {
    return this.request<{ review: Review }>('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    })
  }

  // User account management methods
  async changePassword(passwordData: {
    current_password: string
    new_password: string
  }): Promise<{ message: string }> {
    return this.request<{ message: string }>('/user/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    })
  }

  async deleteAccount(password: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/user/delete-account', {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    })
  }

  async updateProfile(profileData: {
    first_name: string
    last_name: string
    phone: string
  }): Promise<{ message: string; user: any }> {
    return this.request<{ message: string; user: any }>('/user/update-profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    })
  }
}

export const apiService = new ApiService()
