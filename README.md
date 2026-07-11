# Pixel Office 🏢

A pixel-style virtual office where AI agents work as your team members. Assign tasks via chat and watch your pixel team research, code, write, and collaborate — all in a retro pixel office visualization.

## Architecture

```
┌──────────────────────────────────────────────────┐
│          Frontend (React + Canvas)                │
│   Pixel office visualization + Chat interface    │
└──────────────────────┬───────────────────────────┘
                       │ WebSocket + REST
┌──────────────────────▼───────────────────────────┐
│          Backend (FastAPI + OpenAI)               │
│   Agent orchestration + World state management   │
└──────────────────────────────────────────────────┘
```

## Your Team

| Agent | Name | Specialty |
|-------|------|-----------|
| 📊 Analyst | 小文 | Market research, competitive analysis, strategy |
| 🧪 Experimenter | 小实 | Experiment design, training, evaluation |
| ✍️ Writer | 小写 | Drafting, polishing, formatting documents |
| ⌨️ Developer | 小码 | Implementation, data processing, visualization |

## Features

- **Real-time pixel office** — watch agents walk, sit, eat donuts, and work at their desks
- **Smart task routing** — automatically assigns tasks to the best-suited agent
- **Live chat** — see agent responses with Markdown rendering
- **Task queue** — agents handle multiple tasks sequentially, getting "angry" when overloaded
- **Idle animations** — agents relax in the kitchen or watch TV when idle
- **Office pets** — a dog (豆豆) roams the garden, plus butterflies and birds
- **Responsive design** — works on desktop and tablet screens

## Quick Start

### 1. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure your OpenAI API key
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Start the server
python main.py
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 3. Open the App

Visit http://localhost:5173 in your browser.

## Usage

1. Type a task in the chat panel (supports English and Chinese)
2. The system automatically assigns it to the best-suited team member
3. Watch the pixel agent work in the office view
4. Switch between **Chat**, **Tasks**, and **Agents** tabs to monitor progress

### Example Tasks

- "帮我调研竞品的最新动态"
- "Design an experiment to evaluate our new model"
- "帮我起草一份项目方案"
- "写一个 Python 脚本来处理 CSV 数据并画图"

## Configuration

The system uses OpenAI's GPT-4o-mini by default. You can modify the model in `backend/agents/base.py`.

To use without an API key, agents will return placeholder responses indicating what they would do.

## Tech Stack

- **Backend**: Python, FastAPI, WebSocket, OpenAI API
- **Frontend**: React, TypeScript, HTML5 Canvas, Vite
- **Communication**: WebSocket for real-time updates, REST for task submission
