import asyncio
import random
import time
from abc import ABC, abstractmethod
from typing import Any, Callable, Coroutine, Optional

from openai import AsyncOpenAI

from models import (
    AgentAction,
    AgentRole,
    AgentState,
    AgentStatus,
    ChatMessage,
    Position,
    Task,
    TaskStatus,
)

DESK_POSITIONS = {
    "literature": Position(x=2, y=2),
    "experiment": Position(x=7, y=2),
    "writing": Position(x=2, y=4),
    "code": Position(x=7, y=4),
}

KITCHEN_POSITION = Position(x=13, y=10)
SOFA_POSITIONS = [Position(x=5, y=10), Position(x=6, y=10)]
GYM_POSITIONS = [Position(x=3, y=8), Position(x=3, y=9)]
MEETING_POSITIONS = [Position(x=3, y=15), Position(x=6, y=15), Position(x=3, y=16), Position(x=6, y=16)]
WATER_COOLER_POSITION = Position(x=16, y=13)
CORRIDOR_POSITIONS = [Position(x=4, y=13), Position(x=8, y=13), Position(x=12, y=13)]

RELAX_SPOTS = [
    ("kitchen", KITCHEN_POSITION),
    ("kitchen", Position(x=14, y=10)),
    ("sofa", SOFA_POSITIONS[0]),
    ("sofa", SOFA_POSITIONS[1]),
    ("gym", GYM_POSITIONS[0]),
    ("gym", GYM_POSITIONS[1]),
    ("meeting", MEETING_POSITIONS[0]),
    ("meeting", MEETING_POSITIONS[2]),
    ("water", WATER_COOLER_POSITION),
    ("corridor", CORRIDOR_POSITIONS[0]),
    ("corridor", CORRIDOR_POSITIONS[1]),
]


class BaseAgent(ABC):
    def __init__(self, agent_id: str, name: str, role: AgentRole, position: Position):
        self.id = agent_id
        self.name = name
        self.role = role
        self._desk_position = position
        self.state = AgentState(
            id=agent_id,
            name=name,
            role=role,
            position=position,
        )
        self.client: Optional[AsyncOpenAI] = None
        self._current_task: Optional[Task] = None
        self._pending_tasks: int = 0
        self._task_queue: asyncio.Queue[Task] = asyncio.Queue()
        self._worker_running = False
        self._on_done_callback: Optional[Callable[..., Coroutine[Any, Any, None]]] = None

    def set_client(self, client: AsyncOpenAI):
        self.client = client

    def set_on_task_done(self, callback: Callable[..., Coroutine[Any, Any, None]]):
        self._on_done_callback = callback

    async def enqueue_task(self, task: Task) -> None:
        """Add task to queue. Starts the worker loop if not running."""
        self._pending_tasks += 1
        await self._task_queue.put(task)
        if not self._worker_running:
            asyncio.create_task(self._worker_loop())

    async def _worker_loop(self):
        """Process tasks one at a time from the queue."""
        self._worker_running = True
        try:
            while not self._task_queue.empty():
                task = await self._task_queue.get()
                result = await self.start_task(task)
                if self._on_done_callback:
                    await self._on_done_callback(self, task, result)
                await asyncio.sleep(3)
        finally:
            self._worker_running = False

    @property
    def system_prompt(self) -> str:
        return f"You are {self.name}, a research assistant specializing in {self.role.value}."

    @abstractmethod
    async def execute_task(self, task: Task) -> str:
        """Execute a task and return the result."""
        pass

    def can_handle(self, task_description: str) -> bool:
        """Check if this agent can handle a given task based on keywords."""
        keywords = self._get_keywords()
        desc_lower = task_description.lower()
        return any(kw in desc_lower for kw in keywords)

    @abstractmethod
    def _get_keywords(self) -> list[str]:
        """Return keywords this agent responds to."""
        pass

    async def think(self, prompt: str) -> str:
        """Use LLM to think/generate a response."""
        if not self.client:
            return f"[{self.name}] (LLM not configured) Would process: {prompt[:100]}..."

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=2000,
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            return f"[Error] {str(e)}"

    async def start_task(self, task: Task) -> str:
        """Start working on a task with state transitions."""
        self._current_task = task
        task.status = TaskStatus.IN_PROGRESS
        task.assigned_to = self.role

        # Walk back to desk first
        self.state.position = self._desk_position
        self.state.status = AgentStatus.WORKING
        self.state.action = AgentAction.WALKING
        self.state.current_task = task.id
        self.state.message = f"Heading to desk..."
        self.state.emoji = "🚶"

        # Wait for walking animation to play out
        await asyncio.sleep(3)

        # Sit down and start working
        self.state.action = AgentAction.TYPING
        self.state.message = f"Working on: {task.title}"
        self.state.emoji = "💻"

        # If overloaded (>1 pending tasks), get angry first
        if self._pending_tasks > 1:
            self.state.status = AgentStatus.ANGRY
            self.state.action = AgentAction.ANGRY
            self.state.emoji = "😡"
            self.state.message = f"Too many tasks! ({self._pending_tasks} pending)"
            await asyncio.sleep(2)
            # Calm down and start working
            self.state.status = AgentStatus.WORKING
            self.state.action = AgentAction.TYPING
            self.state.emoji = "💢"
            self.state.message = f"Fine... working on: {task.title}"

        await asyncio.sleep(1)

        try:
            result = await self.execute_task(task)
            task.status = TaskStatus.REVIEW
            task.result = result
            task.completed_at = time.time()
            self._pending_tasks = max(0, self._pending_tasks - 1)

            self.state.status = AgentStatus.DONE
            self.state.action = AgentAction.SITTING
            self.state.position = self._desk_position
            self.state.message = f"Completed: {task.title}"
            self.state.emoji = "✅"
            self.state.current_task = None

            return result
        except Exception as e:
            task.status = TaskStatus.FAILED
            task.result = f"Error: {str(e)}"
            self._pending_tasks = max(0, self._pending_tasks - 1)

            self.state.status = AgentStatus.ERROR
            self.state.action = AgentAction.SITTING
            self.state.position = self._desk_position
            self.state.message = f"Failed: {str(e)[:50]}"
            self.state.emoji = "❌"
            self.state.current_task = None

            return task.result

    def set_idle(self, spot: tuple[str, "Position"] | None = None):
        """Go relax when idle - pick a random spot or use assigned one."""
        if spot is None:
            spot_name, spot_pos = random.choice(RELAX_SPOTS)
        else:
            spot_name, spot_pos = spot

        self.state.status = AgentStatus.RELAXING
        self.state.position = spot_pos
        self.state.current_task = None

        if spot_name == "kitchen":
            if random.random() < 0.5:
                self.state.action = AgentAction.EATING_DONUT
                self.state.message = "Eating a donut 🍩"
                self.state.emoji = "🍩"
            else:
                self.state.action = AgentAction.EATING_DONUT
                self.state.message = "Having coffee ☕"
                self.state.emoji = "☕"
        elif spot_name == "sofa":
            self.state.action = AgentAction.WATCHING_TV
            self.state.message = "Watching TV 📺"
            self.state.emoji = "📺"
        elif spot_name == "gym":
            self.state.action = AgentAction.WALKING
            self.state.message = "Working out 💪"
            self.state.emoji = "💪"
        elif spot_name == "meeting":
            self.state.action = AgentAction.DISCUSSING
            self.state.message = "Chatting in meeting room 💬"
            self.state.emoji = "💬"
        elif spot_name == "water":
            self.state.action = AgentAction.SITTING
            self.state.message = "Getting water 💧"
            self.state.emoji = "💧"
        elif spot_name == "corridor":
            self.state.action = AgentAction.WALKING
            self.state.message = "Taking a walk 🚶"
            self.state.emoji = "🚶"
        elif spot_name == "desk":
            self.state.action = AgentAction.SITTING
            self.state.message = "Back at desk"
            self.state.emoji = "💺"
        else:
            self.state.action = AgentAction.SITTING
            self.state.message = "Resting"
            self.state.emoji = "😌"

    def set_angry(self, task_count: int):
        """Get angry when overloaded."""
        self.state.status = AgentStatus.ANGRY
        self.state.action = AgentAction.ANGRY
        self.state.emoji = "😡"
        self.state.message = f"I have {task_count} tasks already!"

    def get_state(self) -> AgentState:
        return self.state
