from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import json
import os
import uuid
import redis
import psycopg2

app = Flask(__name__)
CORS(app)

N8N_WEBHOOK_URL = os.getenv('N8N_WEBHOOK_URL', 'http://n8n:5678/webhook/chat')

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


@app.route("/")
def home():
    return jsonify({"message": "Flask backend is running!"})


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
