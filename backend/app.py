from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import json
import os
import uuid
import redis
import psycopg2
import bcrypt
from psycopg2.extras import RealDictCursor

app = Flask(__name__)
# Read allowed origins from env (comma-separated)
cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://frontend:3000"
).split(",")

CORS(app, origins=cors_origins, supports_credentials=True)

# N8N webhook URL
N8N_WEBHOOK_URL = os.getenv(
    "N8N_WEBHOOK_URL",
    "http://n8n:5678/webhook/chat"
)

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'postgres'),
    'port': os.getenv('DB_PORT', '5432'),
    'database': os.getenv('DB_NAME', 'home_office_store'),
    'user': os.getenv('DB_USER', 'n8n'),
    'password': os.getenv('DB_PASSWORD', 'n8n')
}

class DatabaseManager:
    def __init__(self):
        self.config = DB_CONFIG
    
    def get_connection(self):
        """Get database connection"""
        try:
            conn = psycopg2.connect(**self.config)
            return conn
        except psycopg2.Error as e:
            print(f"Database connection error: {e}")
            return None
    
    def create_database_and_tables(self):
        """Create database and tables if they don't exist"""
        try:
            # First connect to default postgres database to create our database
            default_config = self.config.copy()
            default_config['database'] = 'postgres'
            
            conn = psycopg2.connect(**default_config)
            conn.autocommit = True
            cursor = conn.cursor()
            
            # Create database if it doesn't exist
            cursor.execute(f"SELECT 1 FROM pg_database WHERE datname = '{self.config['database']}'")
            if not cursor.fetchone():
                cursor.execute(f"CREATE DATABASE {self.config['database']}")
                print(f"Database '{self.config['database']}' created successfully")
            
            cursor.close()
            conn.close()
            
            # Now connect to our database and create tables
            conn = self.get_connection()
            if conn:
                cursor = conn.cursor()
                
                # Create users table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS users (
                        id SERIAL PRIMARY KEY,
                        first_name VARCHAR(100) NOT NULL,
                        last_name VARCHAR(100) NOT NULL,
                        email VARCHAR(255) UNIQUE NOT NULL,
                        password_hash VARCHAR(255) NOT NULL,
                        phone VARCHAR(20),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                # Add phone column if it doesn't exist (for existing databases)
                cursor.execute("""
                    ALTER TABLE users 
                    ADD COLUMN IF NOT EXISTS phone VARCHAR(20)
                """)
                
                # Create products table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS products (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        description TEXT,
                        price DECIMAL(10,2) NOT NULL,
                        original_price DECIMAL(10,2),
                        category VARCHAR(100) NOT NULL,
                        wood_type VARCHAR(50),
                        image_url VARCHAR(500),
                        rating DECIMAL(3,2) DEFAULT 0,
                        review_count INTEGER DEFAULT 0,
                        badge VARCHAR(50),
                        is_featured BOOLEAN DEFAULT FALSE,
                        stock_quantity INTEGER DEFAULT 0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                # Create cart table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS cart_items (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                        quantity INTEGER NOT NULL DEFAULT 1,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(user_id, product_id)
                    )
                """)
                
                # Create orders table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS orders (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                        total_amount DECIMAL(10,2) NOT NULL,
                        status VARCHAR(50) DEFAULT 'pending',
                        shipping_address TEXT,
                        billing_address TEXT,
                        payment_method VARCHAR(50),
                        payment_status VARCHAR(50) DEFAULT 'pending',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                # Create order_items table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS order_items (
                        id SERIAL PRIMARY KEY,
                        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
                        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                        quantity INTEGER NOT NULL,
                        price DECIMAL(10,2) NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                # Create wishlist table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS wishlist (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(user_id, product_id)
                    )
                """)
                
                # Create reviews table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS reviews (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
                        title VARCHAR(255),
                        comment TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(user_id, product_id)
                    )
                """)
                
                # Create order status table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS order_statuses (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(50) UNIQUE NOT NULL
                    )
                """)
                
                # Insert default order statuses
                cursor.execute("""
                    INSERT INTO order_statuses (name) VALUES 
                    ('pending'), ('confirmed'), ('processing'), ('shipped'), ('delivered'), ('cancelled')
                    ON CONFLICT (name) DO NOTHING
                """)
                
                # Create tickets table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS tickets (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                        category VARCHAR(100) NOT NULL,
                        description TEXT NOT NULL,
                        status VARCHAR(50) DEFAULT 'active',
                        priority VARCHAR(20) DEFAULT 'medium',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                conn.commit()
                cursor.close()
                conn.close()
                print("Users table created successfully")
                
        except psycopg2.Error as e:
            print(f"Database setup error: {e}")

class UserService:
    def __init__(self):
        self.db = DatabaseManager()
    
    def hash_password(self, password):
        """Hash password using bcrypt"""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    def verify_password(self, password, hashed):
        """Verify password against hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    
    def create_user(self, first_name, last_name, email, password):
        """Create a new user"""
        try:
            conn = self.db.get_connection()
            if not conn:
                return {"success": False, "error": "Database connection failed"}
            
            cursor = conn.cursor()
            
            # Check if user already exists
            cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
            if cursor.fetchone():
                cursor.close()
                conn.close()
                return {"success": False, "error": "User with this email already exists"}
            
            # Hash password and create user
            password_hash = self.hash_password(password)
            
            cursor.execute("""
                INSERT INTO users (first_name, last_name, email, password_hash, phone)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, created_at
            """, (first_name, last_name, email, password_hash, ""))
            
            result = cursor.fetchone()
            user_id, created_at = result
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                "success": True,
                "user": {
                    "id": user_id,
                    "first_name": first_name,
                    "last_name": last_name,
                    "email": email,
                    "created_at": created_at.isoformat()
                }
            }
            
        except psycopg2.Error as e:
            print(f"Database error: {e}")
            return {"success": False, "error": "Database error occurred"}
    
    def authenticate_user(self, email, password):
        """Authenticate user with email and password"""
        try:
            conn = self.db.get_connection()
            if not conn:
                return {"success": False, "error": "Database connection failed"}
            
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            # Get user by email
            cursor.execute("""
                SELECT id, first_name, last_name, email, password_hash, created_at
                FROM users WHERE email = %s
            """, (email,))
            
            user = cursor.fetchone()
            cursor.close()
            conn.close()
            
            if not user:
                return {"success": False, "error": "Invalid email or password"}
            
            # Verify password
            if not self.verify_password(password, user['password_hash']):
                return {"success": False, "error": "Invalid email or password"}
            
            return {
                "success": True,
                "user": {
                    "id": user['id'],
                    "first_name": user['first_name'],
                    "last_name": user['last_name'],
                    "email": user['email'],
                    "created_at": user['created_at'].isoformat()
                }
            }
            
        except psycopg2.Error as e:
            print(f"Database error: {e}")
            return {"success": False, "error": "Database error occurred"}
    
    def change_password(self, user_id, current_password, new_password):
        """Change user password"""
        try:
            conn = self.db.get_connection()
            if not conn:
                return {"success": False, "error": "Database connection failed"}
            
            cursor = conn.cursor()
            
            # First verify current password
            cursor.execute("SELECT password_hash FROM users WHERE id = %s", (user_id,))
            result = cursor.fetchone()
            
            if not result:
                return {"success": False, "error": "User not found"}
            
            stored_hash = result[0]
            
            # Verify current password
            if not bcrypt.checkpw(current_password.encode('utf-8'), stored_hash.encode('utf-8')):
                return {"success": False, "error": "Current password is incorrect"}
            
            # Hash new password
            new_password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            # Update password
            cursor.execute("UPDATE users SET password_hash = %s WHERE id = %s", (new_password_hash, user_id))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {"success": True, "message": "Password updated successfully"}
            
        except psycopg2.Error as e:
            print(f"Database error: {e}")
            return {"success": False, "error": "Database error occurred"}
    
    def delete_account(self, user_id, password):
        """Delete user account and all associated data"""
        try:
            conn = self.db.get_connection()
            if not conn:
                return {"success": False, "error": "Database connection failed"}
            
            cursor = conn.cursor()
            
            # First verify password
            cursor.execute("SELECT password_hash FROM users WHERE id = %s", (user_id,))
            result = cursor.fetchone()
            
            if not result:
                return {"success": False, "error": "User not found"}
            
            stored_hash = result[0]
            
            # Verify password
            if not bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8')):
                return {"success": False, "error": "Password is incorrect"}
            
            # Delete user and all associated data (CASCADE will handle related records)
            cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {"success": True, "message": "Account and all associated data deleted successfully"}
            
        except psycopg2.Error as e:
            print(f"Database error: {e}")
            return {"success": False, "error": "Database error occurred"}
    
    def update_profile(self, user_id, first_name, last_name, phone):
        """Update user profile information"""
        try:
            conn = self.db.get_connection()
            if not conn:
                return {"success": False, "error": "Database connection failed"}
            
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            # Update user profile
            cursor.execute("""
                UPDATE users 
                SET first_name = %s, last_name = %s, phone = %s
                WHERE id = %s
                RETURNING id, first_name, last_name, email, phone, created_at
            """, (first_name, last_name, phone, user_id))
            
            result = cursor.fetchone()
            
            if not result:
                return {"success": False, "error": "User not found"}
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                "success": True, 
                "message": "Profile updated successfully",
                "user": {
                    "id": result['id'],
                    "first_name": result['first_name'],
                    "last_name": result['last_name'],
                    "email": result['email'],
                    "phone": result['phone'],
                    "created_at": result['created_at'].isoformat()
                }
            }
            
        except psycopg2.Error as e:
            print(f"Database error: {e}")
            return {"success": False, "error": "Database error occurred"}

class ProductService:
    def __init__(self):
        self.db = DatabaseManager()
    
    def get_products(self, category=None, search=None, min_price=None, max_price=None, wood_type=None, sort_by='featured', limit=50, offset=0):
        """Get products with optional filtering and sorting"""
        try:
            conn = self.db.get_connection()
            if not conn:
                return {"success": False, "error": "Database connection failed"}
            
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            # Build query
            query = "SELECT * FROM products WHERE 1=1"
            params = []
            
            if category:
                query += " AND LOWER(category) = LOWER(%s)"
                params.append(category)
            
            if search:
                query += " AND (LOWER(name) LIKE LOWER(%s) OR LOWER(description) LIKE LOWER(%s))"
                search_term = f"%{search}%"
                params.extend([search_term, search_term])
            
            if min_price is not None:
                query += " AND price >= %s"
                params.append(min_price)
            
            if max_price is not None:
                query += " AND price <= %s"
                params.append(max_price)
            
            if wood_type:
                query += " AND LOWER(wood_type) = LOWER(%s)"
                params.append(wood_type)
            
            # Add sorting
            if sort_by == 'price-low':
                query += " ORDER BY price ASC"
            elif sort_by == 'price-high':
                query += " ORDER BY price DESC"
            elif sort_by == 'rating':
                query += " ORDER BY rating DESC"
            elif sort_by == 'newest':
                query += " ORDER BY created_at DESC"
            else:  # featured
                query += " ORDER BY is_featured DESC, rating DESC"
            
            # Add pagination
            query += " LIMIT %s OFFSET %s"
            params.extend([limit, offset])
            
            cursor.execute(query, params)
            products = cursor.fetchall()
            
            # Convert Decimal to float for JSON serialization
            for product in products:
                product['price'] = float(product['price'])
                if product['original_price']:
                    product['original_price'] = float(product['original_price'])
                if product['rating']:
                    product['rating'] = float(product['rating'])
            
            cursor.close()
            conn.close()
            
            return {"success": True, "products": products}
            
        except psycopg2.Error as e:
            print(f"Database error: {e}")
            return {"success": False, "error": "Database error occurred"}
    
    def get_product_by_id(self, product_id):
        """Get a single product by ID"""
        try:
            conn = self.db.get_connection()
            if not conn:
                return {"success": False, "error": "Database connection failed"}
            
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute("SELECT * FROM products WHERE id = %s", (product_id,))
            product = cursor.fetchone()
            
            if product:
                # Convert Decimal to float for JSON serialization
                product['price'] = float(product['price'])
                if product['original_price']:
                    product['original_price'] = float(product['original_price'])
                if product['rating']:
                    product['rating'] = float(product['rating'])
            
            cursor.close()
            conn.close()
            
            if product:
                return {"success": True, "product": product}
            else:
                return {"success": False, "error": "Product not found"}
                
        except psycopg2.Error as e:
            print(f"Database error: {e}")
            return {"success": False, "error": "Database error occurred"}
    
    def get_featured_products(self, limit=4):
        """Get featured products"""
        return self.get_products(sort_by='featured', limit=limit)
    
    def get_categories(self):
        """Get all product categories with counts"""
        try:
            conn = self.db.get_connection()
            if not conn:
                return {"success": False, "error": "Database connection failed"}
            
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute("""
                SELECT category, COUNT(*) as count 
                FROM products 
                GROUP BY category 
                ORDER BY category
            """)
            categories = cursor.fetchall()
            
            cursor.close()
            conn.close()
            
            return {"success": True, "categories": categories}
            
        except psycopg2.Error as e:
            print(f"Database error: {e}")
            return {"success": False, "error": "Database error occurred"}

class CartService:
    def __init__(self):
        self.db = DatabaseManager()
    
    def get_cart(self, user_id):
        """Get user's cart with product details"""
        try:
            conn = self.db.get_connection()
            if not conn:
                return {"success": False, "error": "Database connection failed"}
            
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute("""
                SELECT ci.*, p.name, p.price, p.image_url, p.wood_type, p.category
                FROM cart_items ci
                JOIN products p ON ci.product_id = p.id
                WHERE ci.user_id = %s
                ORDER BY ci.created_at DESC
            """, (user_id,))
            
            items = cursor.fetchall()
            
            # Convert Decimal to float for JSON serialization
            for item in items:
                item['price'] = float(item['price'])
            
            cursor.close()
            conn.close()
            
            return {"success": True, "items": items}
            
        except psycopg2.Error as e:
            print(f"Database error: {e}")
            return {"success": False, "error": "Database error occurred"}
    
    def add_to_cart(self, user_id, product_id, quantity=1):
        """Add item to cart or update quantity if exists"""
        try:
            conn = self.db.get_connection()
            if not conn:
                return {"success": False, "error": "Database connection failed"}
            
            cursor = conn.cursor()
            
            # Check if item already exists in cart
            cursor.execute("""
                SELECT id, quantity FROM cart_items 
                WHERE user_id = %s AND product_id = %s
            """, (user_id, product_id))
            
            existing_item = cursor.fetchone()
            
            if existing_item:
                # Update quantity
                new_quantity = existing_item[1] + quantity
                cursor.execute("""
                    UPDATE cart_items 
                    SET quantity = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                """, (new_quantity, existing_item[0]))
            else:
                # Insert new item
                cursor.execute("""
                    INSERT INTO cart_items (user_id, product_id, quantity)
                    VALUES (%s, %s, %s)
                """, (user_id, product_id, quantity))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {"success": True, "message": "Item added to cart"}
            
        except psycopg2.Error as e:
            print(f"Database error: {e}")
            return {"success": False, "error": "Database error occurred"}
    
    def update_cart_item(self, user_id, product_id, quantity):
        """Update cart item quantity"""
        try:
            conn = self.db.get_connection()
            if not conn:
                return {"success": False, "error": "Database connection failed"}
            
            cursor = conn.cursor()
            
            if quantity <= 0:
                # Remove item from cart
                cursor.execute("""
                    DELETE FROM cart_items 
                    WHERE user_id = %s AND product_id = %s
                """, (user_id, product_id))
            else:
                # Update quantity
                cursor.execute("""
                    UPDATE cart_items 
                    SET quantity = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = %s AND product_id = %s
                """, (quantity, user_id, product_id))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {"success": True, "message": "Cart updated"}
            
        except psycopg2.Error as e:
            print(f"Database error: {e}")
            return {"success": False, "error": "Database error occurred"}
    
    def clear_cart(self, user_id):
        """Clear user's cart"""
        try:
            conn = self.db.get_connection()
            if not conn:
                return {"success": False, "error": "Database connection failed"}
            
            cursor = conn.cursor()
            cursor.execute("DELETE FROM cart_items WHERE user_id = %s", (user_id,))
            conn.commit()
            cursor.close()
            conn.close()
            
            return {"success": True, "message": "Cart cleared"}
            
        except psycopg2.Error as e:
            print(f"Database error: {e}")
            return {"success": False, "error": "Database error occurred"}

class OrderService:
    def __init__(self):
        self.db = DatabaseManager()
    
    def create_order(self, user_id, order_data):
        """Create a new order from cart items"""
        try:
            conn = self.db.get_connection()
            if not conn:
                return {"success": False, "error": "Database connection failed"}
            
            cursor = conn.cursor()
            
            # Create order
            cursor.execute("""
                INSERT INTO orders (user_id, total_amount, status, shipping_address, billing_address, payment_method, payment_status)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id, created_at
            """, (
                user_id,
                order_data['total_amount'],
                'pending',
                order_data.get('shipping_address', ''),
                order_data.get('billing_address', ''),
                order_data.get('payment_method', 'credit_card'),
                'pending'
            ))
            
            order_result = cursor.fetchone()
            order_id, created_at = order_result
            
            # Add order items
            for item in order_data['items']:
                cursor.execute("""
                    INSERT INTO order_items (order_id, product_id, quantity, price)
                    VALUES (%s, %s, %s, %s)
                """, (order_id, item['product_id'], item['quantity'], item['price']))
            
            # Clear user's cart
            cursor.execute("DELETE FROM cart_items WHERE user_id = %s", (user_id,))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                "success": True,
                "order": {
                    "id": order_id,
                    "total_amount": order_data['total_amount'],
                    "status": "pending",
                    "created_at": created_at.isoformat()
                }
            }
            
        except psycopg2.Error as e:
            print(f"Database error: {e}")
            return {"success": False, "error": "Database error occurred"}
    
    def get_user_orders(self, user_id):
        """Get all orders for a user"""
        try:
            conn = self.db.get_connection()
            if not conn:
                return {"success": False, "error": "Database connection failed"}
            
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute("""
                SELECT o.*, 
                       COALESCE(
                           json_agg(
                               json_build_object(
                                   'id', oi.id,
                                   'product_id', oi.product_id,
                                   'quantity', oi.quantity,
                                   'price', oi.price,
                                   'product_name', p.name,
                                   'product_image', p.image_url
                               )
                           ) FILTER (WHERE oi.id IS NOT NULL), 
                           '[]'::json
                       ) as items
                FROM orders o
                LEFT JOIN order_items oi ON o.id = oi.order_id
                LEFT JOIN products p ON oi.product_id = p.id
                WHERE o.user_id = %s
                GROUP BY o.id
                ORDER BY o.created_at DESC
            """, (user_id,))
            
            orders = cursor.fetchall()
            
            # Convert Decimal to float for JSON serialization
            for order in orders:
                order['total_amount'] = float(order['total_amount'])
                if order['items']:
                    for item in order['items']:
                        item['price'] = float(item['price'])
            
            cursor.close()
            conn.close()
            
            return {"success": True, "orders": orders}
            
        except psycopg2.Error as e:
            print(f"Database error: {e}")
            return {"success": False, "error": "Database error occurred"}

class WishlistService:
    def __init__(self):
        self.db = DatabaseManager()
    
    def add_to_wishlist(self, user_id, product_id):
        """Add product to user's wishlist"""
        try:
            conn = self.db.get_connection()
            if not conn:
                return {"success": False, "error": "Database connection failed"}
            
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO wishlist (user_id, product_id)
                VALUES (%s, %s)
                ON CONFLICT (user_id, product_id) DO NOTHING
                RETURNING id
            """, (user_id, product_id))
            
            result = cursor.fetchone()
            conn.commit()
            cursor.close()
            conn.close()
            
            if result:
                return {"success": True, "message": "Added to wishlist"}
            else:
                return {"success": True, "message": "Already in wishlist"}
                
        except psycopg2.Error as e:
            print(f"Database error: {e}")
            return {"success": False, "error": "Database error occurred"}
    
    def remove_from_wishlist(self, user_id, product_id):
        """Remove product from user's wishlist"""
        try:
            conn = self.db.get_connection()
            if not conn:
                return {"success": False, "error": "Database connection failed"}
            
            cursor = conn.cursor()
            cursor.execute("""
                DELETE FROM wishlist 
                WHERE user_id = %s AND product_id = %s
            """, (user_id, product_id))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {"success": True, "message": "Removed from wishlist"}
            
        except psycopg2.Error as e:
            print(f"Database error: {e}")
            return {"success": False, "error": "Database error occurred"}
    
    def get_wishlist(self, user_id):
        """Get user's wishlist with product details"""
        try:
            conn = self.db.get_connection()
            if not conn:
                return {"success": False, "error": "Database connection failed"}
            
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute("""
                SELECT w.*, p.name, p.price, p.image_url, p.wood_type, p.category, p.rating, p.review_count
                FROM wishlist w
                JOIN products p ON w.product_id = p.id
                WHERE w.user_id = %s
                ORDER BY w.created_at DESC
            """, (user_id,))
            
            items = cursor.fetchall()
            
            # Convert Decimal to float for JSON serialization
            for item in items:
                item['price'] = float(item['price'])
                if item['rating']:
                    item['rating'] = float(item['rating'])
            
            cursor.close()
            conn.close()
            
            return {"success": True, "items": items}
            
        except psycopg2.Error as e:
            print(f"Database error: {e}")
            return {"success": False, "error": "Database error occurred"}

class ReviewService:
    def __init__(self):
        self.db = DatabaseManager()
    
    def add_review(self, user_id, product_id, rating, title, comment):
        """Add or update a product review"""
        try:
            conn = self.db.get_connection()
            if not conn:
                return {"success": False, "error": "Database connection failed"}
            
            cursor = conn.cursor()
            
            # Check if user already reviewed this product
            cursor.execute("""
                SELECT id FROM reviews 
                WHERE user_id = %s AND product_id = %s
            """, (user_id, product_id))
            
            existing_review = cursor.fetchone()
            
            if existing_review:
                # Update existing review
                cursor.execute("""
                    UPDATE reviews 
                    SET rating = %s, title = %s, comment = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = %s AND product_id = %s
                    RETURNING id, created_at, updated_at
                """, (rating, title, comment, user_id, product_id))
            else:
                # Create new review
                cursor.execute("""
                    INSERT INTO reviews (user_id, product_id, rating, title, comment)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id, created_at, updated_at
                """, (user_id, product_id, rating, title, comment))
            
            review_result = cursor.fetchone()
            review_id, created_at, updated_at = review_result
            
            # Update product rating and review count
            cursor.execute("""
                UPDATE products 
                SET rating = (
                    SELECT AVG(rating)::DECIMAL(3,2) 
                    FROM reviews 
                    WHERE product_id = %s
                ),
                review_count = (
                    SELECT COUNT(*) 
                    FROM reviews 
                    WHERE product_id = %s
                )
                WHERE id = %s
            """, (product_id, product_id, product_id))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                "success": True,
                "review": {
                    "id": review_id,
                    "rating": rating,
                    "title": title,
                    "comment": comment,
                    "created_at": created_at.isoformat(),
                    "updated_at": updated_at.isoformat()
                }
            }
            
        except psycopg2.Error as e:
            print(f"Database error: {e}")
            return {"success": False, "error": "Database error occurred"}
    
    def get_product_reviews(self, product_id):
        """Get all reviews for a product"""
        try:
            conn = self.db.get_connection()
            if not conn:
                return {"success": False, "error": "Database connection failed"}
            
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute("""
                SELECT r.*, u.first_name, u.last_name
                FROM reviews r
                JOIN users u ON r.user_id = u.id
                WHERE r.product_id = %s
                ORDER BY r.created_at DESC
            """, (product_id,))
            
            reviews = cursor.fetchall()
            
            cursor.close()
            conn.close()
            
            return {"success": True, "reviews": reviews}
            
        except psycopg2.Error as e:
            print(f"Database error: {e}")
            return {"success": False, "error": "Database error occurred"}

class TicketService:
    def __init__(self):
        self.db = DatabaseManager()
    
    def create_ticket(self, user_id, category, description, priority='medium'):
        """Create a new support ticket"""
        try:
            conn = self.db.get_connection()
            if not conn:
                return {"success": False, "error": "Database connection failed"}
            
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO tickets (user_id, category, description, priority, status)
                VALUES (%s, %s, %s, %s, 'active')
                RETURNING id, created_at
            """, (user_id, category, description, priority))
            
            result = cursor.fetchone()
            ticket_id = result[0]
            created_at = result[1]
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                "success": True,
                "ticket": {
                    "id": ticket_id,
                    "user_id": user_id,
                    "category": category,
                    "description": description,
                    "priority": priority,
                    "status": "active",
                    "created_at": created_at.isoformat()
                }
            }
            
        except psycopg2.Error as e:
            print(f"Database error: {e}")
            return {"success": False, "error": "Database error occurred"}
    
    def get_user_tickets(self, user_id):
        """Get all tickets for a user"""
        try:
            conn = self.db.get_connection()
            if not conn:
                return {"success": False, "error": "Database connection failed"}
            
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute("""
                SELECT id, category, description, status, priority, created_at, updated_at
                FROM tickets
                WHERE user_id = %s
                ORDER BY created_at DESC
            """, (user_id,))
            
            tickets = cursor.fetchall()
            
            # Convert datetime objects to strings
            for ticket in tickets:
                ticket['created_at'] = ticket['created_at'].isoformat()
                ticket['updated_at'] = ticket['updated_at'].isoformat()
            
            cursor.close()
            conn.close()
            
            return {"success": True, "tickets": tickets}
            
        except psycopg2.Error as e:
            print(f"Database error: {e}")
            return {"success": False, "error": "Database error occurred"}

class CustomerSupportService:
    def __init__(self):
        self.n8n_url = N8N_WEBHOOK_URL
    
    def process_customer_query(self, user_message, session_id=None):
        """Send customer query to n8n workflow"""
        if not session_id:
            session_id = str(uuid.uuid4())
        
        payload = {
            "query": {
                "sessionId": session_id,
                "chatInput": user_message
            }
        }
        
        print(f"Sending to n8n: {self.n8n_url}")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        try:
            response = requests.post(
                self.n8n_url,
                json=payload,
                timeout=30,
                headers={'Content-Type': 'application/json'}
            )
            print(f"n8n response status: {response.status_code}")
            print(f"n8n response: {response.text}")
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Request error: {e}")
            return {
                "ticket": None,
                "reply": f"Sorry, I'm having trouble processing your request right now. Please try again later."
            }

support_service = CustomerSupportService()
user_service = UserService()
product_service = ProductService()
cart_service = CartService()
order_service = OrderService()
wishlist_service = WishlistService()
review_service = ReviewService()
ticket_service = TicketService()

def populate_sample_products():
    """Populate database with sample products"""
    try:
        conn = DatabaseManager().get_connection()
        if not conn:
            return
        
        cursor = conn.cursor()
        
        # Check if products already exist
        cursor.execute("SELECT COUNT(*) FROM products")
        count = cursor.fetchone()[0]
        
        if count > 0:
            print("Products already exist, skipping population")
            cursor.close()
            conn.close()
            return
        
        # Sample products data
        sample_products = [
            {
                'name': 'Executive Oak Desk',
                'description': 'Handcrafted executive desk made from premium oak wood. Features spacious drawers and elegant design perfect for any home office.',
                'price': 899.00,
                'original_price': 1099.00,
                'category': 'Desks',
                'wood_type': 'Oak',
                'image_url': '/executive-oak-wooden-desk.jpg',
                'rating': 4.8,
                'review_count': 124,
                'badge': 'Best Seller',
                'is_featured': True,
                'stock_quantity': 15
            },
            {
                'name': 'Ergonomic Walnut Chair',
                'description': 'Premium ergonomic office chair with walnut wood accents. Designed for comfort during long work sessions.',
                'price': 549.00,
                'original_price': None,
                'category': 'Chairs',
                'wood_type': 'Walnut',
                'image_url': '/ergonomic-walnut-office-chair.jpg',
                'rating': 4.9,
                'review_count': 89,
                'badge': 'New',
                'is_featured': True,
                'stock_quantity': 8
            },
            {
                'name': 'Modular Shelf System',
                'description': 'Versatile modular shelving system perfect for organizing books, files, and office supplies. Made from sustainable pine wood.',
                'price': 299.00,
                'original_price': 399.00,
                'category': 'Storage',
                'wood_type': 'Pine',
                'image_url': '/modular-wooden-shelf-system.jpg',
                'rating': 4.7,
                'review_count': 156,
                'badge': 'Sale',
                'is_featured': True,
                'stock_quantity': 22
            },
            {
                'name': 'Standing Desk Converter',
                'description': 'Adjustable standing desk converter made from maple wood. Easily converts any desk into a standing workstation.',
                'price': 449.00,
                'original_price': None,
                'category': 'Desks',
                'wood_type': 'Maple',
                'image_url': '/wooden-standing-desk-converter.jpg',
                'rating': 4.6,
                'review_count': 78,
                'badge': None,
                'is_featured': False,
                'stock_quantity': 12
            },
            {
                'name': 'Cherry Wood Bookshelf',
                'description': 'Elegant cherry wood bookshelf with adjustable shelves. Perfect for displaying books and decorative items.',
                'price': 379.00,
                'original_price': None,
                'category': 'Storage',
                'wood_type': 'Cherry',
                'image_url': '/cherry-wood-bookshelf.jpg',
                'rating': 4.5,
                'review_count': 92,
                'badge': None,
                'is_featured': False,
                'stock_quantity': 18
            },
            {
                'name': 'Adjustable Desk Organizer',
                'description': 'Compact desk organizer made from oak wood. Features multiple compartments for pens, papers, and small office supplies.',
                'price': 89.00,
                'original_price': 119.00,
                'category': 'Accessories',
                'wood_type': 'Oak',
                'image_url': '/wooden-desk-organizer.png',
                'rating': 4.4,
                'review_count': 203,
                'badge': 'Sale',
                'is_featured': False,
                'stock_quantity': 35
            },
            {
                'name': 'Modern Wooden Desk',
                'description': 'Sleek modern desk featuring clean lines and premium walnut construction. Perfect for contemporary home offices.',
                'price': 1299.00,
                'original_price': None,
                'category': 'Desks',
                'wood_type': 'Walnut',
                'image_url': '/modern-wooden-desk-in-bright-home-office.jpg',
                'rating': 4.9,
                'review_count': 67,
                'badge': 'New',
                'is_featured': True,
                'stock_quantity': 6
            },
            {
                'name': 'Wooden Office Chair',
                'description': 'Classic wooden office chair with ergonomic design and cherry wood finish. Comfortable and stylish.',
                'price': 399.00,
                'original_price': None,
                'category': 'Chairs',
                'wood_type': 'Cherry',
                'image_url': '/wooden-office-chair.jpg',
                'rating': 4.3,
                'review_count': 145,
                'badge': None,
                'is_featured': False,
                'stock_quantity': 20
            },
            {
                'name': 'Wooden Office Shelving Unit',
                'description': 'Sturdy shelving unit designed for office storage. Made from pine wood with adjustable shelf heights.',
                'price': 249.00,
                'original_price': None,
                'category': 'Storage',
                'wood_type': 'Pine',
                'image_url': '/wooden-office-shelving-unit.jpg',
                'rating': 4.2,
                'review_count': 98,
                'badge': None,
                'is_featured': False,
                'stock_quantity': 25
            },
            {
                'name': 'Wooden Desk Accessories',
                'description': 'Set of wooden desk accessories including pen holders, paper trays, and document organizers.',
                'price': 129.00,
                'original_price': None,
                'category': 'Accessories',
                'wood_type': 'Oak',
                'image_url': '/wooden-desk-accessories.jpg',
                'rating': 4.6,
                'review_count': 87,
                'badge': None,
                'is_featured': False,
                'stock_quantity': 40
            },
            {
                'name': 'Wooden Standing Desk',
                'description': 'Full-size standing desk with electric height adjustment. Made from premium maple wood with modern design.',
                'price': 1899.00,
                'original_price': None,
                'category': 'Desks',
                'wood_type': 'Maple',
                'image_url': '/wooden-standing-desk.jpg',
                'rating': 4.8,
                'review_count': 43,
                'badge': 'New',
                'is_featured': True,
                'stock_quantity': 4
            }
        ]
        
        # Insert sample products
        for product in sample_products:
            cursor.execute("""
                INSERT INTO products (name, description, price, original_price, category, wood_type, 
                                   image_url, rating, review_count, badge, is_featured, stock_quantity)
                VALUES (%(name)s, %(description)s, %(price)s, %(original_price)s, %(category)s, 
                       %(wood_type)s, %(image_url)s, %(rating)s, %(review_count)s, %(badge)s, 
                       %(is_featured)s, %(stock_quantity)s)
            """, product)
        
        conn.commit()
        cursor.close()
        conn.close()
        print("Sample products populated successfully")
        
    except Exception as e:
        print(f"Error populating sample products: {e}")

# Initialize database and tables
try:
    db_manager = DatabaseManager()
    db_manager.create_database_and_tables()
    populate_sample_products()
    print("Database initialization completed successfully")
except Exception as e:
    print(f"Database initialization failed: {e}")
    # Continue running even if database init fails


@app.route("/")
def home():
    return jsonify({"message": "Flask backend is running!"})


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy", "message": "Backend is running"})


@app.route("/api/test", methods=["GET", "POST"])
def test():
    return jsonify({
        "message": "Test endpoint working",
        "method": request.method,
        "data": request.get_json() if request.method == "POST" else None
    })


@app.route("/api/register", methods=["POST"])
def register():
    try:
        print("Registration endpoint called")
        data = request.get_json()
        print(f"Received data: {data}")
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Validate required fields
        required_fields = ["firstName", "lastName", "email", "password"]
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"{field} is required"}), 400
        
        # Validate email format
        email = data.get("email")
        if "@" not in email or "." not in email.split("@")[1]:
            return jsonify({"error": "Invalid email format"}), 400
        
        # Validate password length
        password = data.get("password")
        if len(password) < 8:
            return jsonify({"error": "Password must be at least 8 characters long"}), 400
        
        # Create user
        result = user_service.create_user(
            first_name=data.get("firstName"),
            last_name=data.get("lastName"),
            email=email,
            password=password
        )
        
        if result["success"]:
            return jsonify({
                "message": "User registered successfully",
                "user": result["user"]
            }), 201
        else:
            return jsonify({"error": result["error"]}), 400
            
    except Exception as e:
        print(f"Error in register endpoint: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/login", methods=["POST"])
def login():
    try:
        print("Login endpoint called")
        data = request.get_json()
        print(f"Received data: {data}")
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Validate required fields
        required_fields = ["email", "password"]
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"{field} is required"}), 400
        
        email = data.get("email")
        password = data.get("password")
        
        # Authenticate user
        result = user_service.authenticate_user(email, password)
        
        if result["success"]:
            return jsonify({
                "message": "Login successful",
                "user": result["user"]
            }), 200
        else:
            return jsonify({"error": result["error"]}), 401
            
    except Exception as e:
        print(f"Error in login endpoint: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/webhook/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        user_message = data.get("message", "")
        session_id = data.get("sessionId")
        user_id = data.get("userId")  # Get user_id from request
        
        if not user_message:
            return jsonify({"error": "Message is required"}), 400
        
        # Process the message through the customer support service
        result = support_service.process_customer_query(user_message, session_id)
        
        # If the AI response contains ticket data and we have a user_id, create a ticket
        ticket_data = result.get("ticket")
        created_ticket = None
        
        if ticket_data and user_id:
            try:
                ticket_result = ticket_service.create_ticket(
                    user_id=user_id,
                    category=ticket_data.get("category", "general"),
                    description=ticket_data.get("description", ""),
                    priority="medium"
                )
                
                if ticket_result.get("success"):
                    created_ticket = ticket_result.get("ticket")
                    print(f"Created ticket {created_ticket['id']} for user {user_id}")
                else:
                    print(f"Failed to create ticket: {ticket_result.get('error')}")
            except Exception as e:
                print(f"Error creating ticket: {e}")
        
        return jsonify({
            "reply": result.get("reply", "I'm sorry, I couldn't process your request."),
            "ticket": created_ticket if created_ticket else result.get("ticket"),
            "sessionId": session_id
        })
        
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        return jsonify({"error": "Internal server error"}), 500


# Product API endpoints
@app.route("/api/products", methods=["GET"])
def get_products():
    try:
        # Get query parameters
        category = request.args.get('category')
        search = request.args.get('search')
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)
        wood_type = request.args.get('wood_type')
        sort_by = request.args.get('sort_by', 'featured')
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        result = product_service.get_products(
            category=category,
            search=search,
            min_price=min_price,
            max_price=max_price,
            wood_type=wood_type,
            sort_by=sort_by,
            limit=limit,
            offset=offset
        )
        
        if result["success"]:
            return jsonify({
                "products": result["products"],
                "total": len(result["products"])
            })
        else:
            return jsonify({"error": result["error"]}), 500
            
    except Exception as e:
        print(f"Error in get_products endpoint: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/products/<int:product_id>", methods=["GET"])
def get_product(product_id):
    try:
        result = product_service.get_product_by_id(product_id)
        
        if result["success"]:
            return jsonify({"product": result["product"]})
        else:
            return jsonify({"error": result["error"]}), 404
            
    except Exception as e:
        print(f"Error in get_product endpoint: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/products/featured", methods=["GET"])
def get_featured_products():
    try:
        limit = request.args.get('limit', 4, type=int)
        result = product_service.get_featured_products(limit)
        
        if result["success"]:
            return jsonify({"products": result["products"]})
        else:
            return jsonify({"error": result["error"]}), 500
            
    except Exception as e:
        print(f"Error in get_featured_products endpoint: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/categories", methods=["GET"])
def get_categories():
    try:
        result = product_service.get_categories()
        
        if result["success"]:
            return jsonify({"categories": result["categories"]})
        else:
            return jsonify({"error": result["error"]}), 500
            
    except Exception as e:
        print(f"Error in get_categories endpoint: {e}")
        return jsonify({"error": "Internal server error"}), 500


# Cart API endpoints
@app.route("/api/cart", methods=["GET"])
def get_cart():
    try:
        # Get user ID from request headers or session
        user_id = request.headers.get('X-User-ID')
        if not user_id:
            return jsonify({"error": "User ID required"}), 401
        
        result = cart_service.get_cart(int(user_id))
        
        if result["success"]:
            return jsonify({"items": result["items"]})
        else:
            return jsonify({"error": result["error"]}), 500
            
    except Exception as e:
        print(f"Error in get_cart endpoint: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/cart/add", methods=["POST"])
def add_to_cart():
    try:
        data = request.get_json()
        user_id = request.headers.get('X-User-ID')
        
        if not user_id:
            return jsonify({"error": "User ID required"}), 401
        
        if not data or not data.get('product_id'):
            return jsonify({"error": "Product ID required"}), 400
        
        product_id = data.get('product_id')
        quantity = data.get('quantity', 1)
        
        result = cart_service.add_to_cart(int(user_id), product_id, quantity)
        
        if result["success"]:
            return jsonify({"message": result["message"]})
        else:
            return jsonify({"error": result["error"]}), 500
            
    except Exception as e:
        print(f"Error in add_to_cart endpoint: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/cart/update", methods=["PUT"])
def update_cart_item():
    try:
        data = request.get_json()
        user_id = request.headers.get('X-User-ID')
        
        if not user_id:
            return jsonify({"error": "User ID required"}), 401
        
        if not data or not data.get('product_id'):
            return jsonify({"error": "Product ID required"}), 400
        
        product_id = data.get('product_id')
        quantity = data.get('quantity', 1)
        
        result = cart_service.update_cart_item(int(user_id), product_id, quantity)
        
        if result["success"]:
            return jsonify({"message": result["message"]})
        else:
            return jsonify({"error": result["error"]}), 500
            
    except Exception as e:
        print(f"Error in update_cart_item endpoint: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/cart/clear", methods=["DELETE"])
def clear_cart():
    try:
        user_id = request.headers.get('X-User-ID')
        
        if not user_id:
            return jsonify({"error": "User ID required"}), 401
        
        result = cart_service.clear_cart(int(user_id))
        
        if result["success"]:
            return jsonify({"message": result["message"]})
        else:
            return jsonify({"error": result["error"]}), 500
            
    except Exception as e:
        print(f"Error in clear_cart endpoint: {e}")
        return jsonify({"error": "Internal server error"}), 500


# Order API endpoints
@app.route("/api/orders", methods=["POST"])
def create_order():
    try:
        data = request.get_json()
        user_id = request.headers.get('X-User-ID')
        
        if not user_id:
            return jsonify({"error": "User ID required"}), 401
        
        if not data or not data.get('items'):
            return jsonify({"error": "Order items required"}), 400
        
        result = order_service.create_order(int(user_id), data)
        
        if result["success"]:
            return jsonify({"order": result["order"]}), 201
        else:
            return jsonify({"error": result["error"]}), 500
            
    except Exception as e:
        print(f"Error in create_order endpoint: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/orders", methods=["GET"])
def get_user_orders():
    try:
        user_id = request.headers.get('X-User-ID')
        
        if not user_id:
            return jsonify({"error": "User ID required"}), 401
        
        result = order_service.get_user_orders(int(user_id))
        
        if result["success"]:
            return jsonify({"orders": result["orders"]})
        else:
            return jsonify({"error": result["error"]}), 500
            
    except Exception as e:
        print(f"Error in get_user_orders endpoint: {e}")
        return jsonify({"error": "Internal server error"}), 500


# Tickets API endpoints
@app.route("/api/tickets", methods=["GET"])
def get_user_tickets():
    try:
        user_id = request.headers.get('X-User-ID')
        
        if not user_id:
            return jsonify({"error": "User ID required"}), 401
        
        result = ticket_service.get_user_tickets(int(user_id))
        
        if result["success"]:
            return jsonify({"tickets": result["tickets"]})
        else:
            return jsonify({"error": result["error"]}), 500
            
    except Exception as e:
        print(f"Error in get_user_tickets endpoint: {e}")
        return jsonify({"error": "Internal server error"}), 500


# Wishlist API endpoints
@app.route("/api/wishlist", methods=["GET"])
def get_wishlist():
    try:
        user_id = request.headers.get('X-User-ID')
        
        if not user_id:
            return jsonify({"error": "User ID required"}), 401
        
        result = wishlist_service.get_wishlist(int(user_id))
        
        if result["success"]:
            return jsonify({"items": result["items"]})
        else:
            return jsonify({"error": result["error"]}), 500
            
    except Exception as e:
        print(f"Error in get_wishlist endpoint: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/wishlist/add", methods=["POST"])
def add_to_wishlist():
    try:
        data = request.get_json()
        user_id = request.headers.get('X-User-ID')
        
        if not user_id:
            return jsonify({"error": "User ID required"}), 401
        
        if not data or not data.get('product_id'):
            return jsonify({"error": "Product ID required"}), 400
        
        product_id = data.get('product_id')
        
        result = wishlist_service.add_to_wishlist(int(user_id), product_id)
        
        if result["success"]:
            return jsonify({"message": result["message"]})
        else:
            return jsonify({"error": result["error"]}), 500
            
    except Exception as e:
        print(f"Error in add_to_wishlist endpoint: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/wishlist/remove", methods=["DELETE"])
def remove_from_wishlist():
    try:
        data = request.get_json()
        user_id = request.headers.get('X-User-ID')
        
        if not user_id:
            return jsonify({"error": "User ID required"}), 401
        
        if not data or not data.get('product_id'):
            return jsonify({"error": "Product ID required"}), 400
        
        product_id = data.get('product_id')
        
        result = wishlist_service.remove_from_wishlist(int(user_id), product_id)
        
        if result["success"]:
            return jsonify({"message": result["message"]})
        else:
            return jsonify({"error": result["error"]}), 500
            
    except Exception as e:
        print(f"Error in remove_from_wishlist endpoint: {e}")
        return jsonify({"error": "Internal server error"}), 500


# Review API endpoints
@app.route("/api/reviews/<int:product_id>", methods=["GET"])
def get_product_reviews(product_id):
    try:
        result = review_service.get_product_reviews(product_id)
        
        if result["success"]:
            return jsonify({"reviews": result["reviews"]})
        else:
            return jsonify({"error": result["error"]}), 500
            
    except Exception as e:
        print(f"Error in get_product_reviews endpoint: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/reviews", methods=["POST"])
def add_review():
    try:
        data = request.get_json()
        user_id = request.headers.get('X-User-ID')
        
        if not user_id:
            return jsonify({"error": "User ID required"}), 401
        
        if not data or not all(k in data for k in ['product_id', 'rating', 'title', 'comment']):
            return jsonify({"error": "Product ID, rating, title, and comment are required"}), 400
        
        product_id = data.get('product_id')
        rating = data.get('rating')
        title = data.get('title')
        comment = data.get('comment')
        
        # Validate rating
        if not isinstance(rating, int) or rating < 1 or rating > 5:
            return jsonify({"error": "Rating must be an integer between 1 and 5"}), 400
        
        result = review_service.add_review(int(user_id), product_id, rating, title, comment)
        
        if result["success"]:
            return jsonify({"review": result["review"]}), 201
        else:
            return jsonify({"error": result["error"]}), 500
            
    except Exception as e:
        print(f"Error in add_review endpoint: {e}")
        return jsonify({"error": "Internal server error"}), 500


# User account management endpoints
@app.route("/api/user/change-password", methods=["POST"])
def change_password():
    try:
        data = request.get_json()
        user_id = request.headers.get('X-User-ID')
        
        if not user_id:
            return jsonify({"error": "User ID required"}), 401
        
        if not data or not all(k in data for k in ['current_password', 'new_password']):
            return jsonify({"error": "Current password and new password are required"}), 400
        
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        # Validate new password length
        if len(new_password) < 8:
            return jsonify({"error": "New password must be at least 8 characters long"}), 400
        
        result = user_service.change_password(int(user_id), current_password, new_password)
        
        if result["success"]:
            return jsonify({"message": "Password updated successfully"})
        else:
            return jsonify({"error": result["error"]}), 400
            
    except Exception as e:
        print(f"Error in change_password endpoint: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/user/delete-account", methods=["DELETE"])
def delete_account():
    try:
        data = request.get_json()
        user_id = request.headers.get('X-User-ID')
        
        if not user_id:
            return jsonify({"error": "User ID required"}), 401
        
        if not data or not data.get('password'):
            return jsonify({"error": "Password is required to delete account"}), 400
        
        password = data.get('password')
        
        result = user_service.delete_account(int(user_id), password)
        
        if result["success"]:
            return jsonify({"message": "Account deleted successfully"})
        else:
            return jsonify({"error": result["error"]}), 400
            
    except Exception as e:
        print(f"Error in delete_account endpoint: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/user/update-profile", methods=["PUT"])
def update_profile():
    try:
        data = request.get_json()
        user_id = request.headers.get('X-User-ID')
        
        if not user_id:
            return jsonify({"error": "User ID required"}), 401
        
        if not data or not all(k in data for k in ['first_name', 'last_name', 'phone']):
            return jsonify({"error": "First name, last name, and phone are required"}), 400
        
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        phone = data.get('phone')
        
        result = user_service.update_profile(int(user_id), first_name, last_name, phone)
        
        if result["success"]:
            return jsonify({"message": "Profile updated successfully", "user": result["user"]})
        else:
            return jsonify({"error": result["error"]}), 400
            
    except Exception as e:
        print(f"Error in update_profile endpoint: {e}")
        return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
