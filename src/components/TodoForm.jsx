import { useState } from 'react';
import { useTodo } from '../contexts/TodoContext';

const PRIORITIES = [
  { value: 'low', label: 'Low', dot: 'bg-sky-400' },
  { value: 'medium', label: 'Med', dot: 'bg-amber-400' },
  { value: 'high', label: 'High', dot: 'bg-rose-400' },
];

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'work', label: 'Work' },
  { value: 'personal', label: 'Personal' },
  { value: 'study', label: 'Study' },
  { value: 'health', label: 'Health' },
];

function TodoForm() {
  const [todo, setTodo] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('general');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const { addTodo } = useTodo();

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = todo.trim();
    if (!trimmed) {
      setError('Please enter a task description.');
      return;
    }
    addTodo({ todo: trimmed, priority, category, dueDate });
    setTodo('');
    setDueDate('');
    setError('');
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Add a new task..."
              aria-label="New task description"
              value={todo}
              onChange={(e) => {
                setTodo(e.target.value);
                if (error) setError('');
              }}
              className={`h-11 w-full rounded-xl border bg-zinc-950/90 px-4 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:ring-2 ${
                error
                  ? 'border-rose-500/70 focus:ring-rose-500/25'
                  : 'border-zinc-800 focus:border-emerald-500/70 focus:ring-emerald-500/20'
              }`}
            />
          </div>

          <button
            type="submit"
            className="h-11 shrink-0 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-zinc-950 shadow-sm transition hover:bg-emerald-400 active:scale-[0.98]"
          >
            Add Task
          </button>
        </div>

        {/* Metadata row: Priority, Category, Due Date */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex h-9 items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-950/90 p-1"
            role="group"
            aria-label="Task priority"
          >
            {PRIORITIES.map((p) => {
              const selected = priority === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={`flex h-full items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition ${
                    selected
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${p.dot}`} />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Task category"
            className="h-9 rounded-xl border border-zinc-800 bg-zinc-950/90 px-3 text-xs font-medium text-zinc-300 outline-none transition focus:border-emerald-500/60"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            aria-label="Due date"
            className="h-9 rounded-xl border border-zinc-800 bg-zinc-950/90 px-3 text-xs font-medium text-zinc-300 outline-none transition focus:border-emerald-500/60 [color-scheme:dark]"
          />
        </div>
      </form>

      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}

export default TodoForm;
