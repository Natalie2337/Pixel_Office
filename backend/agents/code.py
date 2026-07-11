from .base import BaseAgent
from models import AgentAction, AgentRole, Position, Task


class CodeAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="code_ra",
            name="小码",
            role=AgentRole.CODE,
            position=Position(x=7, y=4),
        )
        self._desk_position = Position(x=7, y=4)

    @property
    def system_prompt(self) -> str:
        return """You are 小码 (Xiao Ma), a Software Engineer at a company.
Your expertise:
- Writing clean, production-ready code (Python, JS/TS, etc.)
- Data processing and automation scripts
- API development and integration
- Debugging and code review
- Database queries and data analysis
- DevOps and deployment

When given a coding task, provide:
1. Complete, runnable code
2. Clear explanation of the approach
3. Usage instructions
4. Any dependencies or setup needed

Write production-quality code with proper error handling.
Respond in the same language as the user's query."""

    def _get_keywords(self) -> list[str]:
        return [
            "code", "script", "debug", "fix", "implement", "data",
            "api", "database", "deploy", "automate", "build",
            "function", "program", "app", "website", "bot",
            "代码", "脚本", "调试", "实现", "数据", "自动化",
            "接口", "部署", "开发", "程序",
        ]

    async def execute_task(self, task: Task) -> str:
        self.state.action = AgentAction.TYPING
        self.state.emoji = "⌨️"
        self.state.message = "Writing code..."

        prompt = f"""The boss has asked you to work on the following coding task:

Task: {task.title}
Details: {task.description}

Please provide:
1. Complete, runnable code
2. Clear comments explaining the logic
3. Usage instructions
4. Any dependencies needed

Write clean code following best practices."""

        result = await self.think(prompt)
        return result
