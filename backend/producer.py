import time
import random
import requests
from datetime import datetime

API_URL = "http://localhost:8000/notify"
USERS = ["user_123", "user_456", "admin_789"]
TYPES = ["order", "alert", "message", "system"]
MESSAGES = {
    "order": ["New order received!", "Your order has been shipped.", "Order #1024 completed."],
    "alert": ["Security login detected from new device.", "High CPU usage on server 5.", "Memory threshold reached."],
    "message": ["You have a new direct message.", "Team meeting starting in 10 mins.", "New comment on your post."],
    "system": ["System update scheduled for 2 AM.", "Welcome to the Notification System!", "Maintenance completed."]
}

def generate_notification():
    user_id = random.choice(USERS)
    notif_type = random.choice(TYPES)
    message = random.choice(MESSAGES[notif_type])
    
    payload = {
        "user_id": user_id,
        "message": message,
        "type": notif_type,
        "timestamp": time.time()
    }
    
    try:
        response = requests.post(API_URL, json=payload)
        if response.status_code == 200:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Sent {notif_type} to {user_id}: {message}")
        else:
            print(f"Failed to send: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("Starting notification simulation...")
    while True:
        generate_notification()
        time.sleep(random.uniform(2, 5))
