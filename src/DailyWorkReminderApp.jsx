import React, { useEffect, useState } from "react";
import { format, isBefore, isToday, isWithinInterval, parseISO } from "date-fns";

const people = [
  "佳平", "潘霆", "彥銘", "姿穎", "育全", "鈺庭",
  "佳宇", "琪珊", "雄欽", "達那", "韋燕",
  "妍麗", "小希", "張琪", "志賢"
];

export default function DailyWorkReminderApp() {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("tasks");
    return saved ? JSON.parse(saved) : [];
  });

const [newTask, setNewTask] = useState({ title: "", content: "", due: "", owners: [] });
const [savedItems, setSavedItems] = useState(() => {
  const saved = localStorage.getItem("savedItems");
  return saved ? JSON.parse(saved) : [];
});
const [editingIndex, setEditingIndex] = useState(null);
const [showTextOutput, setShowTextOutput] = useState(false);
const [showSavedEditor, setShowSavedEditor] = useState(false);

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
  if (!newTask.content) {
    alert("請輸入代辦項目內容");
    return;
  }
  if (newTask.owners.length === 0) {
    alert("請選擇至少一位負責人");
    return;
  }

  const resolveOwners = () => {
    let resolved = [];
    newTask.owners.forEach((o) => {
      if (o === "所有人") resolved.push(...people);
      else if (o === "國內") resolved.push("佳平", "潘霆", "彥銘", "姿穎", "育全", "鈺庭");
      else if (o === "海外") resolved.push("佳宇", "雄欽", "琪珊", "達那", "韋燕");
      else resolved.push(o);
    });
    return [...new Set(resolved)];
  };

  const owners = resolveOwners();
  const dueDate = newTask.due || new Date().toISOString().split("T")[0];

const contentParts = newTask.content.split("、").map(part => part.trim()).filter(Boolean);

const entries = owners.flatMap((owner) =>
  contentParts.map((part) => ({
    content: newTask.title ? `《${newTask.title}》${part}` : part,
    due: dueDate,
    owners: [owner],
    id: Date.now() + Math.random(),
    createdAt: new Date().toISOString(),
    completed: false
  }))
);
  setTasks([...tasks, ...entries]);
  setNewTask((prev) => ({ title: "", content: "", due: prev.due, owners: [] }));
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
  const removeCompletedForPerson = (person) => {
  const updated = tasks.filter((t) => !(t.completed && t.owners.includes(person)));
  setTasks(updated);
};

  const getColor = (due) => {
    const today = new Date();
    if (!due) return "#fff";
    const dueDate = parseISO(due);
    if (isToday(dueDate)) return "#fff9c4";
    if (isBefore(dueDate, today)) return "#ffcdd2";
    if (isWithinInterval(dueDate, { start: today, end: new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000) }))
      return "#c8e6c9";
    return "#f2f2f2";
  };

const generateTextOutput = () => {
  let text = "";
  people.forEach((person) => {
    const personTasks = tasks
      .filter((task) => (task.owners || []).includes(person) && !task.completed)
      .sort((a, b) => new Date(a.due) - new Date(b.due));

    if (personTasks.length > 0) {
      text += `\n👤 ${person}\n`;

      personTasks.forEach((task) => {
        const dueDate = parseISO(task.due);
        const today = new Date();
        const isTodayDue = isToday(dueDate);
        const isOverdue = isBefore(dueDate, today);

        const isEnglish = ["小希", "妍麗", "達那"].includes(person);
        const label = isEnglish ? "Due" : "截止日";
        const todayText = isEnglish ? "｜⚠️ Due Today" : "｜⚠️ 今日截止";
        const overdueText = isEnglish ? "｜⚠️ Overdue" : "｜⚠️ 已逾期";

        text += `- ${task.content}｜⏰ ${label}：${format(dueDate, "yyyy-MM-dd")}`;
        if (isTodayDue) text += todayText;
        else if (isOverdue) text += overdueText;
        text += "\n";
      });
    }
  });
  return text.trim();
};

  const sortedPendingTasks = tasks.filter((t) => !t.completed).sort((a, b) => new Date(a.due) - new Date(b.due));
  const sortedCompletedTasks = tasks.filter((t) => t.completed).sort((a, b) => new Date(b.due) - new Date(a.due));

  return (
    <div style={{ maxWidth: "1200px", margin: "auto", fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', Arial, Helvetica, sans-serif", fontWeight: "500" }}>
      <div style={{ display: "flex", gap: "2rem" }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: "1.8rem", fontWeight: "bold" }}>待辦清單</h1>
          <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
<textarea
  style={{ resize: "horizontal", minWidth: "600px", background: "#fff", border: "1px solid #ccc", padding: "0.3rem" }}
  placeholder="輸入作品名稱（可空白）"
  value={newTask.title || ""}
  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
/>

{/* 待辦事項內容欄位 */}
<textarea
  style={{ resize: "horizontal", minWidth: "600px", background: "#fff", border: "1px solid #ccc", padding: "0.3rem" }}
  placeholder="輸入新待辦項目"
  value={newTask.content}
  onChange={(e) => setNewTask({ ...newTask, content: e.target.value })}
/>

{/* 常用項目下拉選單 */}
<div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
  <select
    onChange={(e) => setNewTask({ ...newTask, content: e.target.value })}
    defaultValue=""
    style={{
      padding: "0.3rem",
      border: "1px solid #ccc",
      background: "#fff",
      maxWidth: "250px",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      overflow: "hidden"
    }}
  >
    <option value="" disabled>選擇常用項目</option>
    {savedItems.map((item, idx) => (
      <option key={idx} value={item}>{item}</option>
    ))}
  </select>

<button
  onClick={() => {
    const item = newTask.content.trim();
    if (!item) return;
    const updated = [...new Set([...savedItems, item])];
    setSavedItems(updated);
    localStorage.setItem("savedItems", JSON.stringify(updated));
  }}
  style={{ padding: "0.4rem 1rem", border: "1px solid #999", background: "#eee" }}
>
  儲存為常用
</button>

  <button
    onClick={() => setShowSavedEditor((prev) => !prev)}
    style={{ padding: "0.4rem 1rem", border: "1px solid #999", background: "#eee" }}
  >
    {showSavedEditor ? "隱藏管理項目" : "管理常用項目"}
  </button>
</div>

{/* 第二行：日期、送出、產生清單為新的一行，避免被擠壓 */}
<div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
  <input
    type="date"
    value={newTask.due}
    onChange={(e) => setNewTask({ ...newTask, due: e.target.value })}
    style={{ background: "#FFF", border: "1px solid #ccc", padding: "0.3rem" }}
  />
  <button onClick={handleAddTask} style={{ padding: "0.4rem 1rem", border: "1px solid #999", background: "#F0FFF0" }}>新增項目</button>
  <button onClick={() => setShowTextOutput(!showTextOutput)} style={{ padding: "0.4rem 1rem", border: "1px solid #999", background: "#eee" }}>
    {showTextOutput ? "隱藏文字清單" : "產生文字版清單"}
  </button>
</div>

{/* 顯示管理區塊：套用、編輯、刪除 */}
{showSavedEditor && savedItems.length > 0 && (
  <div style={{ marginTop: "0.5rem" }}>
    <strong>已儲存的常用項目：</strong>
    <ul style={{ padding: 0, margin: 0 }}>
      {savedItems.map((item, idx) => (
        <li key={idx} style={{ display: "flex", alignItems: "center", marginBottom: "0.3rem", gap: "0.5rem", flexWrap: "wrap" }}>
          <span style={{ maxWidth: "500px", wordBreak: "break-word" }}>{item}</span>
          <button onClick={() => setNewTask(prev => ({ ...prev, content: item }))}>套用</button>
          <button onClick={() => {
            const edited = prompt("修改此常用項目：", item);
            if (edited && edited.trim()) {
              const updated = [...savedItems];
              updated[idx] = edited.trim();
              setSavedItems(updated);
              localStorage.setItem("savedItems", JSON.stringify(updated));
            }
          }}>編輯</button>
          <button onClick={() => {
            const updated = savedItems.filter((_, i) => i !== idx);
            setSavedItems(updated);
            localStorage.setItem("savedItems", JSON.stringify(updated));
          }} style={{ color: "red" }}>刪除</button>
        </li>
      ))}
    </ul>
  </div>
)}

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
                <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                  {["佳平", "潘霆", "彥銘", "姿穎", "育全", "鈺庭", "張琪", "志賢"].map((p) => (
                    <label key={p}>
                      <input
                        type="checkbox"
                        checked={newTask.owners.includes(p)}
                        onChange={() => toggleOwner(p)}
                      /> {p}
                    </label>
                  ))}
                </div>
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
  <div style={{ flex: 1 }}>
                      <input
  type="text"
  value={task.content}
  title={task.content} // 👈 新增這行
  onChange={(e) => {
    const newContent = e.target.value;
    setTasks((prev) =>
      prev.map((t) => t.id === task.id ? { ...t, content: newContent } : t)
    );
  }}
  style={{
    fontWeight: "bold",
    fontSize:task.content.length > 70 ? "0.8rem" :
      task.content.length > 50 ? "0.9rem" : "1rem",
    border: "none",
    background: "transparent",
    width: "500px",
    padding: "0.2rem 0",
    outline: "none",
    whiteSpace: "nowrap",
    overflowX: "auto",
    display: "block"
  }}
/>
    </div>
    
                       <div style={{ fontSize: "0.8rem", color: "#444", display: "flex", alignItems: "center", gap: "0.5rem" }}>
  建立：{format(parseISO(task.createdAt), "yyyy-MM-dd")}｜截止：
  <input
    type="date"
    value={task.due}
    onChange={(e) => {
      const newDate = e.target.value;
      setTasks((prev) =>
        prev.map((t) => t.id === task.id ? { ...t, due: newDate } : t)
      );
    }}
    style={{
      color: "red",
      fontWeight: "bold",
      border: "1px solid #ccc",
      borderRadius: "4px",
      padding: "2px 6px",
      background: "#fff",
      cursor: "pointer"
    }}
  />
  <span>
    {isToday(parseISO(task.due)) ? "⚠️ 今日截止" : isBefore(parseISO(task.due), new Date()) ? "⚠️ 已逾期" : ""}
  </span>
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
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
  <h2 style={{ fontSize: "1.2rem", margin: 0 }}>👤 {person}</h2>
  <button onClick={() => removeCompletedForPerson(person)} style={{ background: "#fdd", border: "1px solid #f88", padding: "0.3rem 0.6rem" }}>刪除所有項目</button>
</div>
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
    </div>
  );
}
