
// DailyWorkReminderApp.jsx
import React, { useState } from "react";
import { format, isBefore, isToday, isWithinInterval, parseISO } from "date-fns";

const people = [
  "佳平", "潘霆", "彥銘", "姿穎", "育全", "佳宇", "琪珊", "雄欽", "達那", "韋燕", "妍麗", "小希", "張琪", "志賢", "所有人"
];

export default function DailyWorkReminderApp() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ content: "", due: "", owners: [] });
  const [showTextOutput, setShowTextOutput] = useState(false);

  const handleAddTask = () => {
    if (!newTask.content || !newTask.due || newTask.owners.length === 0) return;
    const task = {
      ...newTask,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      completed: false
    };
    setTasks([...tasks, task]);
    setNewTask({ content: "", due: "", owners: [] });
  };

  const toggleComplete = (id) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const removeTask = (id) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const getColor = (due) => {
    const today = new Date();
    const dueDate = parseISO(due);
    if (isToday(dueDate)) return "bg-yellow-200";
    if (isBefore(dueDate, today)) return "bg-red-200";
    if (
      isWithinInterval(dueDate, {
        start: today,
        end: new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000)
      })
    )
      return "bg-green-200";
    return "";
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    const dateA = new Date(a.due);
    const dateB = new Date(b.due);
    return dateA - dateB;
  });

  const generateTextOutput = () => {
    let text = "";
    people.forEach((person) => {
      const personTasks = sortedTasks.filter(
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">每日工作提醒清單</h1>

      <div className="mb-6">
        <input
          type="text"
          placeholder="輸入工作內容"
          value={newTask.content}
          onChange={(e) => setNewTask({ ...newTask, content: e.target.value })}
          className="border p-2 mr-2"
        />
        <input
          type="date"
          value={newTask.due}
          onChange={(e) => setNewTask({ ...newTask, due: e.target.value })}
          className="border p-2 mr-2"
        />
        <select
          multiple
          value={newTask.owners}
          onChange={(e) =>
            setNewTask({
              ...newTask,
              owners: Array.from(e.target.selectedOptions, (option) => option.value)
            })
          }
          className="border p-2 mr-2 h-28"
        >
          {people.map((person) => (
            <option key={person} value={person}>
              {person}
            </option>
          ))}
        </select>
        <button onClick={handleAddTask} className="bg-blue-500 text-white px-4 py-2">
          新增
        </button>
        <button
          onClick={() => setShowTextOutput(!showTextOutput)}
          className="ml-4 bg-gray-700 text-white px-4 py-2"
        >
          {showTextOutput ? "隱藏文字清單" : "產生可複製清單"}
        </button>
      </div>

      {showTextOutput && (
        <textarea
          className="w-full border p-4 mb-6 whitespace-pre-wrap h-64 text-sm"
          readOnly
          value={generateTextOutput()}
        />
      )}

      {people.map((person) => (
        <div key={person} className="mb-4">
          <h2 className="text-xl font-semibold mb-2">{person}</h2>
          {sortedTasks
            .filter((task) => task.owners.includes(person))
            .map((task) => (
              <div
                key={task.id}
                className={`p-2 mb-2 border rounded flex justify-between items-center ${
                  task.completed ? "opacity-50" : getColor(task.due)
                }`}
              >
                <div>
                  <p className="font-medium">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleComplete(task.id)}
                      className="mr-2"
                    />
                    {task.content}
                  </p>
                  <p className="text-sm text-gray-600">
                    截止日：{format(parseISO(task.due), "yyyy-MM-dd")}｜建立日：
                    {format(parseISO(task.createdAt), "yyyy-MM-dd")}
                    {isToday(parseISO(task.due)) && !task.completed && " ⚠️ 今日截止"}
                    {isBefore(parseISO(task.due), new Date()) && !task.completed &&
                      " ⚠️ 已逾期"}
                  </p>
                </div>
                <button
                  onClick={() => removeTask(task.id)}
                  className="text-red-500 hover:underline"
                >
                  移除
                </button>
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
