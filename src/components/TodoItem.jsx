import { useEffect, useRef, useState } from 'react';
import { useTodo } from '../contexts/TodoContext';

const PRIORITY_ORDER = ['low', 'medium', 'high'];

const PRIORITY_STYLES = {
  high: {
    label: 'High',
    badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25',
  },
  medium: {
    label: 'Med',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25',
  },
  low: {
    label: 'Low',
    badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30 hover:bg-sky-500/25',
  },
};

const CATEGORY_LABELS = {
  general: 'General',
  work: 'Work',
  personal: 'Personal',
  study: 'Study',
  health: 'Health',
};

function formatDueDate(dateStr, completed) {
  if (!dateStr) return null;
  const todayStr = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  if (!completed && dateStr < todayStr) {
    return { label: `Overdue (${dateStr})`, tone: 'text-rose-300 bg-rose-500/15 border-rose-500/30' };
  }
  if (dateStr === todayStr) {
    return { label: 'Today', tone: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30' };
  }
  if (dateStr === tomorrowStr) {
    return { label: 'Tomorrow', tone: 'text-amber-300 bg-amber-500/15 border-amber-500/30' };
  }
  return { label: dateStr, tone: 'text-zinc-400 bg-zinc-800/80 border-zinc-700' };
}

function TodoItem({ todo }) {
  const [isEditable, setIsEditable] = useState(false);
  const [todoMsg, setTodoMsg] = useState(todo.todo);
  const inputRef = useRef(null);
  const { updateTodo, deleteTodo, toggleComplete } = useTodo();

  useEffect(() => {
    setTodoMsg(todo.todo);
  }, [todo.todo]);

  useEffect(() => {
    if (isEditable && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditable]);

  const saveEdit = () => {
    const trimmed = todoMsg.trim();
    if (!trimmed) {
      setTodoMsg(todo.todo);
      setIsEditable(false);
      return;
    }
    if (trimmed !== todo.todo) {
      updateTodo(todo.id, { todo: trimmed });
    }
    setTodoMsg(trimmed);
    setIsEditable(false);
  };

  const cancelEdit = () => {
    setTodoMsg(todo.todo);
    setIsEditable(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const cyclePriority = () => {
    if (todo.completed) return;
    const currentIdx = PRIORITY_ORDER.indexOf(todo.priority || 'medium');
    const nextPriority = PRIORITY_ORDER[(currentIdx + 1) % PRIORITY_ORDER.length];
    updateTodo(todo.id, { priority: nextPriority });
  };

  const priorityInfo = PRIORITY_STYLES[todo.priority] || PRIORITY_STYLES.medium;
  const categoryLabel = CATEGORY_LABELS[todo.category] || 'General';
  const dueInfo = formatDueDate(todo.dueDate, todo.completed);

  return (
    <div
      className={`animate-task-in group flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition ${
        todo.completed
          ? 'border-zinc-800/60 bg-zinc-950/40 opacity-75'
          : 'border-zinc-800 bg-zinc-950/80 hover:border-zinc-700'
      }`}
    >
      {/* Custom Checkbox */}
      <button
        type="button"
        role="checkbox"
        aria-checked={todo.completed}
        aria-label={todo.completed ? 'Mark as active' : 'Mark as completed'}
        onClick={() => toggleComplete(todo.id)}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
          todo.completed
            ? 'border-emerald-500 bg-emerald-500 text-zinc-950'
            : 'border-zinc-600 bg-zinc-900 hover:border-emerald-400'
        }`}
      >
        {todo.completed && (
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Task Text & Metadata */}
      <div className="min-w-0 flex-1">
        <input
          ref={inputRef}
          type="text"
          value={todoMsg}
          readOnly={!isEditable}
          onChange={(e) => setTodoMsg(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Task description"
          className={`w-full rounded-lg bg-transparent py-0.5 text-sm outline-none transition ${
            isEditable
              ? 'border border-emerald-500/60 bg-zinc-900 px-2.5 text-white ring-1 ring-emerald-500/20'
              : 'border border-transparent px-1'
          } ${todo.completed ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}
        />

        <div className="mt-1 flex flex-wrap items-center gap-1.5 px-1">
          <span className="rounded bg-zinc-800/90 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
            {categoryLabel}
          </span>
          {dueInfo && (
            <span
              className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${dueInfo.tone}`}
            >
              {dueInfo.label}
            </span>
          )}
        </div>
      </div>

      {/* Priority Badge (Click to cycle) */}
      <button
        type="button"
        onClick={cyclePriority}
        disabled={todo.completed}
        title={todo.completed ? 'Priority' : 'Click to cycle priority'}
        className={`hidden shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-semibold transition sm:inline-flex disabled:cursor-default ${priorityInfo.badge}`}
      >
        {priorityInfo.label}
      </button>

      {/* Action Buttons */}
      <div className="flex shrink-0 items-center gap-1">
        {isEditable ? (
          <>
            <button
              type="button"
              onClick={saveEdit}
              title="Save (Enter)"
              aria-label="Save task"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/15 text-emerald-300 transition hover:bg-emerald-500/25"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              title="Cancel (Esc)"
              aria-label="Cancel editing"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 transition hover:bg-zinc-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={todo.completed}
            onClick={() => setIsEditable(true)}
            title="Edit task"
            aria-label="Edit task"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-zinc-400 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </button>
        )}

        <button
          type="button"
          onClick={() => deleteTodo(todo.id)}
          title="Delete task"
          aria-label="Delete task"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-zinc-400 transition hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default TodoItem;
