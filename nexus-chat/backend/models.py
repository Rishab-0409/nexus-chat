from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class RegisterPayload(BaseModel):
    username: str
    email: str
    password: str

class LoginPayload(BaseModel):
    identifier: str  # username or email
    password: str

class CreateConversationPayload(BaseModel):
    name: Optional[str] = None
    type: str = "direct"  # direct | group
    member_ids: List[str] = []

class AIReplyPayload(BaseModel):
    prompt: str

class SOSPayload(BaseModel):
    message: str = "EMERGENCY - Need Help!"
    location: Optional[Dict[str, float]] = None

class GameStartPayload(BaseModel):
    game_type: str  # tictactoe | trivia | wordguess
    conversation_id: str

class GameMovePayload(BaseModel):
    move: Any
