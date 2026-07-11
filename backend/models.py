from pydantic import BaseModel
from enum import Enum
from typing import Optional
import time


class AgentRole(str, Enum):
    BOSS = "boss"
    LITERATURE = "literature"
    EXPERIMENT = "experiment"
    WRITING = "writing"
    CODE = "code"


class AgentStatus(str, Enum):
    IDLE = "idle"
    WORKING = "working"
    TALKING = "talking"
    DONE = "done"
    ERROR = "error"
    WAITING = "waiting"
    RELAXING = "relaxing"
    ANGRY = "angry"


class AgentAction(str, Enum):
    SITTING = "sitting"
    WALKING = "walking"
    READING = "reading"
    TYPING = "typing"
    DISCUSSING = "discussing"
    THINKING = "thinking"
    PRESENTING = "presenting"
    EATING_DONUT = "eating_donut"
    WATCHING_TV = "watching_tv"
    ANGRY = "angry"


class Position(BaseModel):
    x: int
    y: int


class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    REVIEW = "review"


class Task(BaseModel):
    id: str
    title: str
    description: str
    assigned_to: Optional[AgentRole] = None
    status: TaskStatus = TaskStatus.PENDING
    result: Optional[str] = None
    created_at: float = 0.0
    completed_at: Optional[float] = None

    def __init__(self, **data):
        if "created_at" not in data or data["created_at"] == 0.0:
            data["created_at"] = time.time()
        super().__init__(**data)


class AgentState(BaseModel):
    id: str
    name: str
    role: AgentRole
    status: AgentStatus = AgentStatus.IDLE
    action: AgentAction = AgentAction.SITTING
    position: Position
    target_position: Optional[Position] = None
    current_task: Optional[str] = None
    message: Optional[str] = None
    emoji: Optional[str] = None


class ChatMessage(BaseModel):
    sender: str
    content: str
    timestamp: float = 0.0
    is_user: bool = False

    def __init__(self, **data):
        if "timestamp" not in data or data["timestamp"] == 0.0:
            data["timestamp"] = time.time()
        super().__init__(**data)


class TaskRequest(BaseModel):
    description: str


class WorldState(BaseModel):
    agents: list[AgentState]
    tasks: list[Task]
    messages: list[ChatMessage]
    current_time: float
