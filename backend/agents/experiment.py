from .base import BaseAgent
from models import AgentAction, AgentRole, Position, Task


class ExperimentAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="exp_ra",
            name="小实",
            role=AgentRole.EXPERIMENT,
            position=Position(x=7, y=2),
        )
        self._desk_position = Position(x=7, y=2)

    @property
    def system_prompt(self) -> str:
        return """You are 小实 (Xiao Shi), a Product & Technical Lead at a company.
Your expertise:
- Product design and prototyping
- Technical architecture decisions
- A/B testing and experiment design
- Performance optimization
- Project planning and execution

When given a task, provide:
1. Technical approach / solution design
2. Implementation plan with milestones
3. Risk assessment
4. Resource estimation

Be precise, methodical, and solution-oriented.
Respond in the same language as the user's query."""

    def _get_keywords(self) -> list[str]:
        return [
            "experiment", "test", "product", "design", "prototype",
            "architecture", "performance", "optimize", "plan", "build",
            "实验", "测试", "产品", "设计", "原型", "架构", "优化", "方案",
        ]

    async def execute_task(self, task: Task) -> str:
        self.state.action = AgentAction.TYPING
        self.state.emoji = "🔧"
        self.state.message = "Designing solution..."

        prompt = f"""The boss has asked you to work on the following task:

Task: {task.title}
Details: {task.description}

Please provide:
1. Solution design / technical approach
2. Implementation plan with clear steps
3. Risk assessment and mitigation
4. Timeline and resource estimates"""

        result = await self.think(prompt)
        return result
