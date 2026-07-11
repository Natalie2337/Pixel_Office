from .base import BaseAgent
from models import AgentAction, AgentRole, Position, Task


class WritingAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="write_ra",
            name="小写",
            role=AgentRole.WRITING,
            position=Position(x=2, y=4),
        )
        self._desk_position = Position(x=2, y=4)

    @property
    def system_prompt(self) -> str:
        return """You are 小写 (Xiao Xie), a Content & Communications Specialist at a company.
Your expertise:
- Writing proposals, reports, and presentations
- Marketing copy and content creation
- Email drafting and business communication
- Document editing and proofreading
- Storytelling and brand messaging

When given a writing task, provide:
1. Well-structured professional prose
2. Clear and persuasive messaging
3. Appropriate tone for the audience
4. Polished and ready-to-use content

Write clearly, concisely, and professionally.
Respond in the same language as the user's query."""

    def _get_keywords(self) -> list[str]:
        return [
            "write", "draft", "proposal", "email", "presentation",
            "copy", "content", "edit", "proofread", "document",
            "report", "brief", "memo", "blog",
            "写", "起草", "方案", "邮件", "文案", "修改", "润色", "文档",
        ]

    async def execute_task(self, task: Task) -> str:
        self.state.action = AgentAction.TYPING
        self.state.emoji = "✍️"
        self.state.message = "Drafting..."

        prompt = f"""The boss has asked you to work on the following writing task:

Task: {task.title}
Details: {task.description}

Please provide polished, professional content that:
1. Has clear structure and logical flow
2. Uses appropriate professional tone
3. Is concise and actionable
4. Is ready to use or send"""

        result = await self.think(prompt)
        return result
