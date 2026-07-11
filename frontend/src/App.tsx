import { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import PixelCanvas from "./PixelCanvas";

interface AgentData {
  id: string;
  name: string;
  role: string;
  status: string;
  action: string;
  position: { x: number; y: number };
  message: string | null;
  emoji: string | null;
}

interface TaskData {
  id: string;
  title: string;
  description: string;
  assigned_to: string | null;
  status: string;
  result: string | null;
  created_at: number;
}

interface MessageData {
  sender: string;
  content: string;
  timestamp: number;
  is_user: boolean;
}

type TabType = "chat" | "tasks" | "agents";

export default function App() {
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const connectWebSocket = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      setTimeout(connectWebSocket, 3000);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "state" && msg.data) {
        setAgents(msg.data.agents || []);
        setTasks(msg.data.tasks || []);
        setMessages(msg.data.messages || []);
      } else if (msg.type === "message" && msg.data) {
        setMessages((prev) => [...prev, msg.data]);
      } else if (msg.type === "task_done" && msg.data) {
        setTasks((prev) =>
          prev.map((t) => (t.id === msg.data.id ? msg.data : t))
        );
      }
    };

    wsRef.current = ws;
  }, []);

  useEffect(() => {
    connectWebSocket();
    return () => wsRef.current?.close();
  }, [connectWebSocket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    setSending(true);
    try {
      await fetch("/api/task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: input.trim() }),
      });
      setInput("");
    } catch (err) {
      console.error("Failed to submit task:", err);
    }
    setSending(false);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts * 1000);
    return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  };

  const workingCount = agents.filter((a) => a.status === "working").length;
  const activeTaskCount = tasks.filter((t) => t.status === "in_progress").length;

  return (
    <div className="app">
      <header className="header">
        <h1>⬛ Pixel Office</h1>
        <span className={`status ${connected ? "" : "disconnected"}`}>
          {connected ? "● Connected" : "○ Reconnecting..."}
          {connected && ` | Agents: ${workingCount} working`}
        </span>
      </header>

      <div className="canvas-container">
        <PixelCanvas agents={agents} />
      </div>

      <div className="side-panel">
        <div className="panel-tabs">
          <button
            className={activeTab === "chat" ? "active" : ""}
            onClick={() => setActiveTab("chat")}
          >
            💬 Chat
            {messages.length > 0 && activeTab !== "chat" && (
              <span className="tab-badge">{messages.length}</span>
            )}
          </button>
          <button
            className={activeTab === "tasks" ? "active" : ""}
            onClick={() => setActiveTab("tasks")}
          >
            📋 Tasks
            {activeTaskCount > 0 && (
              <span className="tab-badge active-badge">{activeTaskCount}</span>
            )}
          </button>
          <button
            className={activeTab === "agents" ? "active" : ""}
            onClick={() => setActiveTab("agents")}
          >
            👥 Agents
            {workingCount > 0 && (
              <span className="tab-badge working-badge">{workingCount}</span>
            )}
          </button>
        </div>

        {activeTab === "chat" && (
          <div className="chat-container">
            <div className="chat-messages">
              {messages.length === 0 && (
                <div style={{ color: "#555", textAlign: "center", marginTop: 40, fontSize: 13 }}>
                  <p>Welcome to Pixel Office! 🏢</p>
                  <p style={{ marginTop: 8 }}>
                    Type a task below to assign to your team.
                  </p>
                  <p style={{ marginTop: 8, fontSize: 11, color: "#444" }}>
                    Examples:<br />
                    "帮我调研竞品的最新动态"<br />
                    "写一个数据处理的 Python 脚本"<br />
                    "帮我起草项目方案"
                  </p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`chat-message ${msg.is_user ? "user" : "agent"}`}
                >
                  <div className="sender">{msg.sender}</div>
                  <div className="content"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                  <div className="time">{formatTime(msg.timestamp)}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form className="chat-input" onSubmit={handleSubmit}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="给团队分配任务..."
                disabled={sending}
              />
              <button type="submit" disabled={sending || !input.trim()}>
                {sending ? "..." : "Send"}
              </button>
            </form>
          </div>
        )}

        {activeTab === "tasks" && (
          <div className="panel-content">
            <div className="task-list">
              {tasks.length === 0 && (
                <div style={{ color: "#555", textAlign: "center", marginTop: 40 }}>
                  No tasks yet. Send a message to get started!
                </div>
              )}
              {[...tasks].reverse().map((task) => (
                <div key={task.id} className={`task-item ${task.status}`}>
                  <div className="task-title">{task.title}</div>
                  <div className="task-status">
                    {task.assigned_to && `${task.assigned_to} · `}
                    {task.status}
                  </div>
                  {task.result && (
                    <div className="task-result"><ReactMarkdown>{task.result}</ReactMarkdown></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "agents" && (
          <div className="panel-content">
            <div className="agent-info">
              {agents.map((agent) => (
                <div key={agent.id} className="agent-card">
                  <div className="agent-header">
                    <span className="agent-name">
                      {agent.emoji || "💤"} {agent.name}
                    </span>
                    <span className="agent-role">{agent.role}</span>
                  </div>
                  <span className={`agent-status ${agent.status}`}>
                    {agent.status}
                  </span>
                  {agent.message && (
                    <div className="agent-message">{agent.message}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
