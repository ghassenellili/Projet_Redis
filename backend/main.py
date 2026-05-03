from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from redis_client import redis_service
import asyncio
import json
from models import Notification

app = FastAPI(title="Real-Time Notification API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/history/{user_id}")
async def get_history(user_id: str, limit: int = 20):
    return redis_service.get_history(user_id, limit)

@app.get("/analytics")
async def get_analytics():
    return redis_service.get_analytics()

@app.post("/notify")
async def create_notification(notif: Notification):
    notif_dict = notif.model_dump()
    redis_service.add_notification(notif_dict)
    return {"status": "success", "notification": notif_dict}

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await websocket.accept()
    
    # Subscribe to Redis Pub/Sub
    pubsub = redis_service.client.pubsub()
    pubsub.subscribe(f"notifications:channel:{user_id}")
    
    try:
        while True:
            # Check for messages from Redis
            message = pubsub.get_message(ignore_subscribe_messages=True)
            if message:
                data = json.loads(message['data'])
                await websocket.send_json(data)
            
            # Brief sleep to avoid busy waiting
            await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        pubsub.unsubscribe(f"notifications:channel:{user_id}")
        await websocket.close()
    except Exception as e:
        print(f"Error: {e}")
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
