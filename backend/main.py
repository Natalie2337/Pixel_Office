import asyncio
import json
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI

from models import TaskRequest
from world import World

load_dotenv()

world = World()

api_key = os.getenv("OPENAI_API_KEY")
if api_key:
    client = AsyncOpenAI(api_key=api_key)
    world.set_openai_client(client)


@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(world.start_idle_loop())
    yield


app = FastAPI(title="Pixel Office", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/state")
async def get_state():
    return world.get_state().model_dump()


@app.post("/api/task")
async def submit_task(request: TaskRequest):
    task = await world.submit_task(request.description)
    return {"task_id": task.id, "status": task.status}


@app.get("/api/tasks")
async def get_tasks():
    return [t.model_dump() for t in world.tasks]


@app.get("/api/task/{task_id}")
async def get_task(task_id: str):
    task = world.get_task(task_id)
    if not task:
        return {"error": "Task not found"}
    return task.model_dump()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    queue = world.add_listener()
    try:
        state = world.get_state()
        await websocket.send_text(
            json.dumps({"type": "state", "data": state.model_dump()})
        )

        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=5.0)
                await websocket.send_text(json.dumps(event, default=str))
            except asyncio.TimeoutError:
                await websocket.send_text(json.dumps({"type": "ping"}))
    except (WebSocketDisconnect, Exception):
        pass
    finally:
        world.remove_listener(queue)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
