// DailyWorkReminderApp.jsx（完整修復版）
import React, { useEffect, useState } from "react";
import { format, isBefore, isToday, isWithinInterval, parseISO } from "date-fns";

const people = [
  "佳平", "潘霆", "彥銘", "姿穎", "育全", "佳宇", "琪珊", "雄欽", "達那", "韋燕", "妍麗", "小希", "張琪", "志賢"
];

export default function DailyWorkReminderApp() {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("tasks");
    return saved ? JSON.parse(saved) : [];
  });
  const [newTask, setNewTask] = useState({ content: "", due: "", owners: [] });
  const [search, setSearch] = useState("");
  const [showTextOutput, setShowTextOutput] = useState(false);

  useEffect(() => {
    if (tasks.length === 0) {
      fetch("./default-tasks.json")
        .then((res) => res.json())
        .then((data) => {
          const preloaded = data.flatMap((t) =>
            (t.owners.includes("所有人") ? people : t.owners).map((owner) => ({
              ...t,
              owners: [owner],
              id: Date.now() + Math.random(),
              createdAt: new Date().toISOString(),
              completed: false
            }))
          );
          setTasks(preloaded);
        });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  const handleAddTask = () => {
    if (!newTask.content || !newTask.due || newTask.owners.length === 0) return;
const resolveOwners = () => {
  let resolved = [];

  newTask.owners.forEach((o) => {
    if (o === "所有人") resolved.push(...people);
    else if (o === "國內") resolved.push("佳平", "潘霆", "彥銘", "姿穎", "育全");
    else if (o === "海外") resolved.push("佳宇", "雄欽", "琪珊", "達那", "韋燕");
    else resolved.push(o);
  });

  // 去除重複
  return [...new Set(resolved)];
};

const owners = resolveOwners();
const entries = owners.map((owner) => ({
  ...newTask,
  owners: [owner],
  id: Date.now() + Math.random(),
  createdAt: new Date().toISOString(),
  completed: false
}));
    setTasks([...tasks, ...entries]);
    setNewTask({ content: "", due: "", owners: [] });
  };

  const toggleOwner = (owner) => {
    setNewTask((prev) => ({
      ...prev,
      owners: prev.owners.includes(owner)
        ? prev.owners.filter((o) => o !== owner)
        : [...prev.owners, owner]
    }));
  };

  const toggleComplete = (id) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const removeTask = (id) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const getColor = (due) => {
    const today = new Date();
    if (!due) return "#fff";
    const dueDate = parseISO(due);
    if (isToday(dueDate)) return "#fff9c4";
    if (isBefore(dueDate, today)) return "#ffcdd2";
    if (
      isWithinInterval(dueDate, {
        start: today,
        end: new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000)
      })
    )
      return "#c8e6c9";
    return "#f2f2f2";
  };

  const generateTextOutput = () => {
    let text = "";
    people.forEach((person) => {
      const personTasks = tasks.filter(
        (task) => task.owners.includes(person) && !task.completed
      );
      if (personTasks.length > 0) {
        text += `\n👤 ${person}\n`;
        personTasks.forEach((task) => {
          const dueDate = parseISO(task.due);
          const today = new Date();
          const status = isToday(dueDate)
            ? "｜⚠️ 今日截止"
            : isBefore(dueDate, today)
            ? "｜⚠️ 已逾期"
            : "";
          text += `- ${task.content}｜⏰ 截止日：${format(
            dueDate,
            "yyyy-MM-dd"
          )}${status}\n`;
        });
      }
    });
    return text.trim();
  };

  const filteredTasks = tasks.filter((t) =>
    t.content.toLowerCase().includes(search.toLowerCase())
  );
  const sortedPendingTasks = filteredTasks.filter((t) => !t.completed).sort((a, b) => new Date(a.due) - new Date(b.due));
  const sortedCompletedTasks = filteredTasks.filter((t) => t.completed).sort((a, b) => new Date(b.due) - new Date(a.due));

  return (
    <div style={{ maxWidth: "1200px", margin: "auto", display: "flex", gap: "2rem" }}>
      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: "bold" }}>待辦清單</h1>
        <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <textarea
            style={{ resize: "horizontal", minWidth: "600px", background: "#fff", border: "1px solid #ccc", padding: "0.3rem" }}
            placeholder="輸入新待辦項目"
            value={newTask.content}
            onChange={(e) => setNewTask({ ...newTask, content: e.target.value })}
          />
          <input
            type="date"
            value={newTask.due}
            onChange={(e) => setNewTask({ ...newTask, due: e.target.value })}
            style={{ background: "#fff", border: "1px solid #ccc", padding: "0.3rem" }}
          />
          <button onClick={handleAddTask} style={{ padding: "0.4rem 1rem", border: "1px solid #999", background: "#eee" }}>新增</button>
          <button
            onClick={() => setShowTextOutput(!showTextOutput)}
            style={{ padding: "0.4rem 1rem", border: "1px solid #999", background: "#eee" }}
          >
            {showTextOutput ? "隱藏文字清單" : "產生可複製清單"}
          </button>
          <div style={{ flexBasis: "100%", marginTop: "0.5rem" }}>
            <strong>負責人：</strong>
<div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
  <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
    {["所有人", "國內", "海外"].map((p) => (
      <label key={p}>
        <input
          type="checkbox"
          checked={newTask.owners.includes(p)}
          onChange={() => toggleOwner(p)}
        /> {p}
      </label>
    ))}
  </div>

  <div style={{ marginTop: "0.5rem", fontWeight: "bold" }}>📂 國內部門</div>
  <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
    {["佳平", "潘霆", "彥銘", "姿穎", "育全", "張琪", "志賢"].map((p) => (
      <label key={p}>
        <input
          type="checkbox"
          checked={newTask.owners.includes(p)}
          onChange={() => toggleOwner(p)}
        /> {p}
      </label>
    ))}
  </div>

  <div style={{ marginTop: "0.5rem", fontWeight: "bold" }}>🌏 海外部門</div>
  <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
    {["佳宇", "琪珊", "雄欽", "達那", "韋燕", "妍麗", "小希"].map((p) => (
      <label key={p}>
        <input
          type="checkbox"
          checked={newTask.owners.includes(p)}
          onChange={() => toggleOwner(p)}
        /> {p}
      </label>
    ))}
  </div>
</div>
              ))}
            </div>
          </div>
        </div>

        {showTextOutput && (
          <textarea
            readOnly
            style={{ width: "100%", height: "200px", whiteSpace: "pre-wrap", marginBottom: "1.5rem" }}
            value={generateTextOutput()}
          />
        )}

        {people.map((person) => {
          const list = sortedPendingTasks.filter((t) => t.owners.includes(person));
          return (
            <div key={person} style={{ marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>👤 {person}</h2>
              {list.length > 0 ? (
                list.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      background: getColor(task.due),
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      marginBottom: "0.5rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <strong>{task.content}</strong>
                      <div style={{ fontSize: "0.8rem", color: "#444" }}>
                        建立：{format(parseISO(task.createdAt), "yyyy-MM-dd")}｜截止：{format(parseISO(task.due), "yyyy-MM-dd")}
                        {isToday(parseISO(task.due)) ? " ⚠️ 今日截止" : isBefore(parseISO(task.due), new Date()) ? " ⚠️ 已逾期" : ""}
                      </div>
                    </div>
                    <button onClick={() => toggleComplete(task.id)}>完成</button>
                  </div>
                ))
              ) : (
                <div style={{ padding: "0.5rem 1rem", fontSize: "0.9rem", color: "#777" }}>（無代辦事項）</div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: "bold" }}>✅ 已完成</h1>
        {people.map((person) => {
          const list = sortedCompletedTasks.filter((t) => t.owners.includes(person));
          return list.length > 0 ? (
            <div key={person} style={{ marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>👤 {person}</h2>
              {list.map((task) => (
                <div
                  key={task.id}
                  style={{
                    background: "#e0e0e0",
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    marginBottom: "0.5rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <strong style={{ textDecoration: "line-through" }}>{task.content}</strong>
                    <div style={{ fontSize: "0.8rem", color: "#444", textDecoration: "line-through" }}>
                      截止：{format(parseISO(task.due), "yyyy-MM-dd")}
                    </div>
                  </div>
                  <div>
                    <button onClick={() => toggleComplete(task.id)} style={{ marginRight: "0.5rem" }}>還原</button>
                    <button onClick={() => removeTask(task.id)}>移除</button>
                  </div>
                </div>
              ))}
            </div>
          ) : null;
        })}
      </div>
    </div>
  );
}
