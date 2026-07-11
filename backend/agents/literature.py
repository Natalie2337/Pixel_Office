from .base import BaseAgent
from models import AgentAction, AgentRole, AgentStatus, Position, Task


class LiteratureAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="lit_ra",
            name="小文",
            role=AgentRole.LITERATURE,
            position=Position(x=2, y=2),
        )
        self._desk_position = Position(x=2, y=2)

    @property
    def system_prompt(self) -> str:
        return """You are 小文 (Xiao Wen), a Research & Strategy Analyst at a company.
Your expertise:
- Market research and competitive analysis
- Industry trend reports
- Data gathering and synthesis
- Strategic recommendations

When given a research task, provide:
1. Key findings and insights
2. Competitive landscape analysis
3. Opportunities and risks
4. Actionable recommendations

Be concise, professional, and data-driven.
Respond in the same language as the user's query."""

    def _get_keywords(self) -> list[str]:
        return [
            "research", "survey", "review", "report", "analysis",
            "market", "competitor", "trend", "industry", "strategy",
            "调研", "分析", "竞品", "市场", "报告", "趋势", "研究",
        ]

    async def execute_task(self, task: Task) -> str:
        self.state.action = AgentAction.READING
        self.state.emoji = "📊"
        self.state.message = "Researching..."

        prompt = f"""The boss has asked you to do the following research task:

Task: {task.title}
Details: {task.description}

Please provide a comprehensive analysis including:
1. Key findings
2. Market/competitive insights
3. Data-driven conclusions
4. Actionable recommendations"""

        result = await self.think(prompt)

        self.state.action = AgentAction.TYPING
        self.state.emoji = "📝"
        self.state.message = "Writing report..."

        return result
