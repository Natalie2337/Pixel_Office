import asyncio
import random
import time
import uuid
from typing import Optional

from openai import AsyncOpenAI

from agents import CodeAgent, ExperimentAgent, LiteratureAgent, WritingAgent
from agents.base import BaseAgent, RELAX_SPOTS
from models import (
    AgentRole,
    AgentState,
    AgentStatus,
    AgentAction,
    ChatMessage,
    Position,
    Task,
    TaskStatus,
    WorldState,
)

BOSS_HOME = Position(x=4, y=3)

BOSS_ROAM_SPOTS = [
    ("sitting", BOSS_HOME),
    ("walking", Position(x=4, y=6)),
    ("walking", Position(x=7, y=13)),
    ("kitchen", Position(x=13, y=10)),
    ("meeting", Position(x=4, y=15)),
    ("corridor", Position(x=10, y=13)),
]


class World:
    """Manages the pixel office world state."""

    def __init__(self):
        self.agents: dict[str, BaseAgent] = {}
        self.tasks: list[Task] = []
        self.messages: list[ChatMessage] = []
        self.client: Optional[AsyncOpenAI] = None
        self._listeners: list[asyncio.Queue] = []

        self.boss = AgentState(
            id="boss",
            name="老板",
            role=AgentRole.BOSS,
            status=AgentStatus.IDLE,
            action=AgentAction.SITTING,
            position=BOSS_HOME,
            emoji="😎",
        )

        self._init_agents()

    def _init_agents(self):
        agents = [
            LiteratureAgent(),
            ExperimentAgent(),
            WritingAgent(),
            CodeAgent(),
        ]
        for agent in agents:
            self.agents[agent.id] = agent

    def set_openai_client(self, client: AsyncOpenAI):
        self.client = client
        for agent in self.agents.values():
            agent.set_client(client)

    def get_state(self) -> WorldState:
        all_agents = [self.boss] + [agent.get_state() for agent in self.agents.values()]
        return WorldState(
            agents=all_agents,
            tasks=self.tasks[-20:],
            messages=self.messages[-50:],
            current_time=time.time(),
        )

    def add_listener(self) -> asyncio.Queue:
        queue: asyncio.Queue = asyncio.Queue()
        self._listeners.append(queue)
        return queue

    def remove_listener(self, queue: asyncio.Queue):
        if queue in self._listeners:
            self._listeners.remove(queue)

    async def broadcast(self, event: dict):
        for queue in self._listeners:
            await queue.put(event)

    def _find_best_agent(self, description: str) -> Optional[BaseAgent]:
        """Find the best agent to handle a task based on keywords."""
        for agent in self.agents.values():
            if agent.can_handle(description):
                return agent
        return list(self.agents.values())[0]

    async def submit_task(self, description: str) -> Task:
        """Submit a new task from the boss."""
        task = Task(
            id=str(uuid.uuid4())[:8],
            title=description[:60],
            description=description,
        )
        self.tasks.append(task)

        user_msg = ChatMessage(
            sender="老板 (You)",
            content=description,
            is_user=True,
        )
        self.messages.append(user_msg)
        await self.broadcast({"type": "message", "data": user_msg.model_dump()})

        agent = self._find_best_agent(description)
        if agent:
            # Boss walks next to the agent (offset by 1 tile) to assign task
            self.boss.status = AgentStatus.WORKING
            self.boss.action = AgentAction.WALKING
            agent_pos = agent.state.position
            boss_x = agent_pos.x + 1 if agent_pos.x < 5 else agent_pos.x - 1
            self.boss.position = Position(x=boss_x, y=agent_pos.y)
            self.boss.message = f"找 {agent.name} 布置任务"
            self.boss.emoji = "🚶"
            await self.broadcast({"type": "state", "data": self.get_state().model_dump()})

            await asyncio.sleep(1)

            # Boss talks to the agent
            self.boss.action = AgentAction.DISCUSSING
            self.boss.emoji = "💬"
            await self.broadcast({"type": "state", "data": self.get_state().model_dump()})

            # Check if agent already has pending tasks
            active_tasks = sum(
                1 for t in self.tasks
                if t.assigned_to == agent.role and t.status == TaskStatus.IN_PROGRESS
            )

            TALK_BACK_LINES = [
                "啊？又有活？我刚坐下来诶... 😮‍💨 好吧好吧。",
                "老板你确定这个不能明天再做吗？...算了当我没说。",
                "我觉得这个需求不太合理啊... 行行行我做我做。",
                "能不能加点工资再说？...开玩笑的啦，我做。",
                "周五下午布置任务是不是有点过分了？...好的收到。",
                "我上个任务的功劳你还没夸我呢！😤 ...行吧先干活。",
                "要不你自己来？...好好好我错了，马上开始。",
                "能不能让别人做？...好吧看来只有我能搞定。",
            ]

            if active_tasks > 0:
                angry_msg = ChatMessage(
                    sender=agent.name,
                    content=f"又来活了？！我手上已经有 {active_tasks} 个任务了！😡 ...行吧我加班。",
                )
                self.messages.append(angry_msg)
                await self.broadcast({"type": "message", "data": angry_msg.model_dump()})
            elif random.random() < 0.35:
                talk_back_msg = ChatMessage(
                    sender=agent.name,
                    content=random.choice(TALK_BACK_LINES),
                )
                self.messages.append(talk_back_msg)
                await self.broadcast({"type": "message", "data": talk_back_msg.model_dump()})
            else:
                agent_msg = ChatMessage(
                    sender=agent.name,
                    content=f"收到，马上处理：{task.title}",
                )
                self.messages.append(agent_msg)
                await self.broadcast({"type": "message", "data": agent_msg.model_dump()})

            await asyncio.sleep(1)

            # Boss walks back (show walking state first)
            self.boss.position = BOSS_HOME
            self.boss.action = AgentAction.WALKING
            self.boss.message = "Walking back..."
            self.boss.emoji = "🚶"
            await self.broadcast({"type": "state", "data": self.get_state().model_dump()})

            await asyncio.sleep(3)

            # Boss sits down
            self.boss.status = AgentStatus.IDLE
            self.boss.action = AgentAction.SITTING
            self.boss.message = None
            self.boss.emoji = "😎"
            await self.broadcast({"type": "state", "data": self.get_state().model_dump()})

            asyncio.create_task(self._enqueue_agent_task(agent, task))

        return task

    async def _enqueue_agent_task(self, agent: BaseAgent, task: Task):
        """Enqueue a task for the agent's sequential worker."""
        await self.broadcast({"type": "state", "data": self.get_state().model_dump()})
        agent.set_on_task_done(self._on_agent_task_done)
        await agent.enqueue_task(task)

    async def _on_agent_task_done(self, agent: BaseAgent, task: Task, result: str):
        """Called when an agent finishes a task."""
        done_msg = ChatMessage(
            sender=agent.name,
            content=f"任务完成！\n\n{result[:500]}{'...' if len(result) > 500 else ''}",
        )
        self.messages.append(done_msg)
        await self.broadcast({"type": "message", "data": done_msg.model_dump()})
        await self.broadcast({"type": "task_done", "data": task.model_dump()})
        await self.broadcast({"type": "state", "data": self.get_state().model_dump()})

        # After a short delay, send agent to relax
        await asyncio.sleep(random.uniform(3, 6))
        if not agent._worker_running:
            occupied = {
                (a.state.position.x, a.state.position.y)
                for a in self.agents.values() if a.id != agent.id
            }
            occupied.add((self.boss.position.x, self.boss.position.y))
            available = [s for s in RELAX_SPOTS if (s[1].x, s[1].y) not in occupied]
            if available:
                agent.set_idle(random.choice(available))
            else:
                agent.set_idle(("desk", agent._desk_position))
            await self.broadcast({"type": "state", "data": self.get_state().model_dump()})

    async def start_idle_loop(self):
        """Agents return to desk after relaxing, then may go relax again after a while."""
        while True:
            await asyncio.sleep(random.uniform(8, 18))

            # Decide: move boss or handle an agent (30% boss, 70% agent)
            if random.random() < 0.3 and self.boss.status != AgentStatus.WORKING:
                # Move the boss
                boss_occupied = {
                    (a.state.position.x, a.state.position.y)
                    for a in self.agents.values()
                }
                available = [
                    s for s in BOSS_ROAM_SPOTS
                    if (s[1].x, s[1].y) not in boss_occupied
                ]
                if available:
                    spot_name, spot_pos = random.choice(available)
                    self.boss.position = spot_pos
                    if spot_name == "sitting":
                        self.boss.status = AgentStatus.IDLE
                        self.boss.action = AgentAction.SITTING
                        self.boss.emoji = "😎"
                        self.boss.message = None
                    elif spot_name == "kitchen":
                        self.boss.status = AgentStatus.RELAXING
                        self.boss.action = AgentAction.EATING_DONUT
                        self.boss.emoji = "☕"
                        self.boss.message = "Coffee break"
                    elif spot_name == "meeting":
                        self.boss.status = AgentStatus.RELAXING
                        self.boss.action = AgentAction.DISCUSSING
                        self.boss.emoji = "📊"
                        self.boss.message = "Reviewing plans"
                    else:
                        self.boss.status = AgentStatus.RELAXING
                        self.boss.action = AgentAction.WALKING
                        self.boss.emoji = "🚶"
                        self.boss.message = "Walking around"
                    await self.broadcast({"type": "state", "data": self.get_state().model_dump()})
            else:
                # Find agents currently relaxing → send them back to desk
                relaxing_agents = [
                    a for a in self.agents.values()
                    if a.state.status == AgentStatus.RELAXING
                    and not a._worker_running
                ]
                # Find agents sitting at desk (idle/done) → maybe send to relax
                desk_agents = [
                    a for a in self.agents.values()
                    if a.state.status in (AgentStatus.IDLE, AgentStatus.DONE)
                    and not a._worker_running
                ]

                if relaxing_agents and random.random() < 0.6:
                    # Send a relaxing agent back to their desk
                    agent = random.choice(relaxing_agents)
                    agent.set_idle(("desk", agent._desk_position))
                    agent.state.status = AgentStatus.IDLE
                    await self.broadcast({"type": "state", "data": self.get_state().model_dump()})
                elif desk_agents:
                    # Send a desk agent to relax
                    agent = random.choice(desk_agents)
                    others_occupied = {
                        (a.state.position.x, a.state.position.y)
                        for a in self.agents.values()
                        if a.id != agent.id
                    }
                    others_occupied.add((self.boss.position.x, self.boss.position.y))
                    available = [
                        s for s in RELAX_SPOTS
                        if (s[1].x, s[1].y) not in others_occupied
                    ]
                    if available:
                        spot = random.choice(available)
                        agent.set_idle(spot)
                        await self.broadcast({"type": "state", "data": self.get_state().model_dump()})

    def get_task(self, task_id: str) -> Optional[Task]:
        for task in self.tasks:
            if task.id == task_id:
                return task
        return None
