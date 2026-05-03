import redis
import json
import os

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

class RedisClient:
    def __init__(self):
        self.client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
        self.pubsub = self.client.pubsub()

    def add_notification(self, notification: dict):
        user_id = notification['user_id']
        timestamp = notification['timestamp']
        notif_id = f"{user_id}:{timestamp}"
        
        # Filter out None values before sending to Redis
        clean_notification = {k: v for k, v in notification.items() if v is not None}
        
        # 1. Store in Hash for detail (optional but good for specific retrieval)
        self.client.hset(f"notification_data:{notif_id}", mapping=clean_notification)
        # Set expiration for the hash
        self.client.expire(f"notification_data:{notif_id}", 86400) # 24 hours

        # 2. Add to Stream for event log
        self.client.xadd("notifications_stream", clean_notification)

        # 3. Add to Sorted Set for user history (score = timestamp)
        history_key = f"notifications:history:{user_id}"
        self.client.zadd(history_key, {json.dumps(clean_notification): timestamp})
        # Keep only last 100
        self.client.zremrangebyrank(history_key, 0, -101)
        # Set history expiration
        self.client.expire(history_key, 86400)

        # 4. Publish to Pub/Sub for real-time
        self.client.publish(f"notifications:channel:{user_id}", json.dumps(clean_notification))
        # Also publish to a global channel for analytics or debugging
        self.client.publish("notifications:global", json.dumps(clean_notification))

        # 5. Update Analytics Counter
        self.client.hincrby("notifications:analytics:types", notification['type'], 1)
        self.client.incr("notifications:analytics:total")

    def get_history(self, user_id: str, limit: int = 20):
        history_key = f"notifications:history:{user_id}"
        notifications = self.client.zrevrange(history_key, 0, limit - 1)
        return [json.loads(n) for n in notifications]

    def get_analytics(self):
        types = self.client.hgetall("notifications:analytics:types")
        total = self.client.get("notifications:analytics:total") or 0
        return {
            "total": int(total),
            "by_type": {k: int(v) for k, v in types.items()}
        }

redis_service = RedisClient()
