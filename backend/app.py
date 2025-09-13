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
CORS(app, origins=["http://localhost:3000", "http://frontend:3000"], supports_credentials=True)

N8N_WEBHOOK_URL = os.getenv('N8N_WEBHOOK_URL', 'http://n8n:5678/webhook/chat')

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
                INSERT INTO users (first_name, last_name, email, password_hash)
                VALUES (%s, %s, %s, %s)
                RETURNING id, created_at
            """, (first_name, last_name, email, password_hash))
            
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

# Initialize database and tables
try:
    db_manager = DatabaseManager()
    db_manager.create_database_and_tables()
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


@app.route("/webhook/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        user_message = data.get("message", "")
        session_id = data.get("sessionId")
        
        if not user_message:
            return jsonify({"error": "Message is required"}), 400
        
        # Process the message through the customer support service
        result = support_service.process_customer_query(user_message, session_id)
        
        return jsonify({
            "reply": result.get("reply", "I'm sorry, I couldn't process your request."),
            "ticket": result.get("ticket"),
            "sessionId": session_id
        })
        
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
