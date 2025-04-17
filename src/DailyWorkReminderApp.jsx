import React, { useEffect, useState } from "react";
import { format, isBefore, isToday, isWithinInterval, parseISO } from "date-fns";

const people = [
  "佳平", "潘霆", "彥銘", "姿穎", "育全", "佳宇", "琪珊", "雄欽", "達那", "韋燕", "妍麗", "小希", "張琪", "志賢"
];

export default function DailyWorkReminderApp() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ content: "", due: "", owners: [] });

  useEffect(() => {
    fetch("./default-tasks.json")
      .then((res) => res.json())
      .then((data) => {
        const preloaded = data.map((t) => ({
          ...t,
          id: Date.now() + Math.random(),
          createdAt: new Date().toISOString(),
          completed: false
        }));
        setTasks(preloaded);
      });
  }, []);

  const handleAddTask = () => {
    if (!newTask.content || !newTask.due || newTask.owners.length === 0) return;
    const owners = newTask.owners.includes("所有人") ? people : newTask.owners;
    const task = {
      ...newTask,
      owners,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      completed: false
    };
    setTasks([...tasks, task]);
    setNewTask({ content: "", due: "", owners: [] });
  };

  const toggleComplete = (id) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const removeTask = (id) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const getColor = (due) => {
    const today = new Date();
    const dueDate = parseISO(due);
    if (isToday(dueDate)) return "#fff9c4";
    if (isBefore(dueDate, today)) return "#ffcdd2";
    if (isWithinInterval(dueDate, { start: today, end: new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000) }))
      return "#c8e6c9";
    return "#ffffff";
  };

  const sortedTasks = [...tasks].sort((a, b) => new Date(a.due) - new Date(b.due));

  return (
    <div style={{ maxWidth: "860px", margin: "auto" }}>
      <h1 style={{ fontSize: "1.8rem", fontWeight: "bold" }}>待辦清單</h1>
      <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          placeholder="輸入新待辦項目"
          value={newTask.content}
          onChange={(e) => setNewTask({ ...newTask, content: e.target.value })}
        />
        <input
          type="date"
          value={newTask.due}
          onChange={(e) => setNewTask({ ...newTask, due: e.target.value })}
        />
        <select
          multiple
          value={newTask.owners}
          onChange={(e) =>
            setNewTask({
              ...newTask,
              owners: Array.from(e.target.selectedOptions, (opt) => opt.value)
            })
          }
        >
          {["所有人", ...people].map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <button onClick={handleAddTask}>新增</button>
      </div>

      {people.map((person) => {
        const list = sortedTasks.filter((t) => t.owners.includes(person));
        return list.length > 0 ? (
          <div key={person} style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>👤 {person}</h2>
            {list.map((task) => (
              <div
                key={task.id}
                style={{
                  background: getColor(task.due),
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  marginBottom: "0.5rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  opacity: task.completed ? 0.4 : 1
                }}
              >
                <div>
                  <label>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleComplete(task.id)}
                    />{" "}
                    {task.content}
                  </label>
                  <div style={{ fontSize: "0.8rem", color: "#444" }}>
                    截止：{format(parseISO(task.due), "yyyy-MM-dd")}｜建立：{format(parseISO(task.createdAt), "yyyy-MM-dd")}
                    {isToday(parseISO(task.due)) && !task.completed && " ⚠️ 今日截止"}
                    {isBefore(parseISO(task.due), new Date()) && !task.completed && " ⚠️ 已逾期"}
                  </div>
                </div>
                <button onClick={() => removeTask(task.id)}>移除</button>
              </div>
            ))}
          </div>
        ) : null;
      })}
    </div>
  );
}
