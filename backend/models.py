from pydantic import BaseModel, Field
from typing import Optional
import time

class Notification(BaseModel):
    id: Optional[str] = None
    user_id: str
    message: str
    type: str  # e.g., 'order', 'message', 'alert'
    timestamp: float = Field(default_factory=time.time)
    expires_at: Optional[float] = None
