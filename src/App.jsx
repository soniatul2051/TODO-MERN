import { useEffect, useMemo, useRef, useState } from 'react';
import { TodoProvider } from './contexts';
import TodoForm from './components/TodoForm';
import TodoItem from './components/TodoItem';

const STORAGE_KEY = 'todos';

const VALID_PRIORITIES = new Set(['low', 'medium', 'high']);
const VALID_CATEGORIES = new Set(['general', 'work', 'personal', 'study', 'health']);
const PRIORITY_WEIGHT = { high: 3, medium: 2, low: 1 };

function loadInitialTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item.todo === 'string' && item.todo.trim())
      .map((item) => ({
        id: item.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        todo: item.todo.trim(),
        completed: Boolean(item.completed),
        priority: VALID_PRIORITIES.has(item.priority) ? item.priority : 'medium',
        category: VALID_CATEGORIES.has(item.category) ? item.category : 'general',
        dueDate: typeof item.dueDate === 'string' ? item.dueDate : '',
        createdAt: item.createdAt ?? Date.now(),
      }));
  } catch {
    return [];
  }
}

function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
];

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: 'general', label: 'General' },
  { value: 'work', label: 'Work' },
  { value: 'personal', label: 'Personal' },
  { value: 'study', label: 'Study' },
  { value: 'health', label: 'Health' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'priority', label: 'Priority (High → Low)' },
  { value: 'dueDate', label: 'Due Date (Soonest)' },
  { value: 'alpha', label: 'Alphabetical (A → Z)' },
];

function App() {
  const [todos, setTodos] = useState(loadInitialTodos);
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletedToast, setDeletedToast] = useState(null);
  const searchInputRef = useRef(null);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch {
      // Ignore storage quota errors
    }
  }, [todos]);

  useEffect(() => {
    const handleGlobalKey = (e) => {
      const tag = e.target?.tagName;
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const addTodo = ({ todo, priority = 'medium', category = 'general', dueDate = '' }) => {
    const trimmed = todo.trim();
    if (!trimmed) return;
    setTodos((prev) => [
      {
        id: generateId(),
        todo: trimmed,
        completed: false,
        priority: VALID_PRIORITIES.has(priority) ? priority : 'medium',
        category: VALID_CATEGORIES.has(category) ? category : 'general',
        dueDate: typeof dueDate === 'string' ? dueDate : '',
        createdAt: Date.now(),
      },
      ...prev,
    ]);
  };

  const updateTodo = (id, updatedFields) => {
    setTodos((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updatedFields } : item))
    );
  };

  const deleteTodo = (id) => {
    const targetIndex = todos.findIndex((item) => item.id === id);
    if (targetIndex === -1) return;
    const targetTodo = todos[targetIndex];

    setTodos((prev) => prev.filter((item) => item.id !== id));

    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setDeletedToast({ todo: targetTodo, index: targetIndex });
    toastTimerRef.current = setTimeout(() => {
      setDeletedToast(null);
    }, 5000);
  };

  const undoDelete = () => {
    if (!deletedToast) return;
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);

    const { todo, index } = deletedToast;
    setTodos((prev) => {
      if (prev.some((item) => item.id === todo.id)) return prev;
      const next = [...prev];
      const insertAt = Math.min(index, next.length);
      next.splice(insertAt, 0, todo);
      return next;
    });
    setDeletedToast(null);
  };

  const toggleComplete = (id) => {
    setTodos((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const clearCompleted = () => {
    setTodos((prev) => prev.filter((item) => !item.completed));
  };

  const toggleAll = () => {
    const allDone = todos.length > 0 && todos.every((item) => item.completed);
    setTodos((prev) => prev.map((item) => ({ ...item, completed: !allDone })));
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(todos, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `taskflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const active = total - completed;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    const todayStr = new Date().toISOString().slice(0, 10);
    const overdue = todos.filter(
      (t) => !t.completed && t.dueDate && t.dueDate < todayStr
    ).length;
    return { total, completed, active, progress, overdue };
  }, [todos]);

  const filteredAndSortedTodos = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = todos.filter((item) => {
      if (filter === 'active' && item.completed) return false;
      if (filter === 'completed' && !item.completed) return false;
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (query && !item.todo.toLowerCase().includes(query)) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'priority') {
        const diff = (PRIORITY_WEIGHT[b.priority] || 2) - (PRIORITY_WEIGHT[a.priority] || 2);
        if (diff !== 0) return diff;
      } else if (sortBy === 'dueDate') {
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
      } else if (sortBy === 'alpha') {
        return a.todo.localeCompare(b.todo);
      }
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [todos, filter, categoryFilter, sortBy, searchQuery]);

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }).format(new Date()),
    []
  );

  return (
    <TodoProvider
      value={{
        todos,
        addTodo,
        updateTodo,
        deleteTodo,
        toggleComplete,
        clearCompleted,
        toggleAll,
      }}
    >
      <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        {/* Subtle top radial glow */}
        <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-gradient-to-b from-emerald-950/30 via-zinc-950/0 to-transparent" />

        <div className="relative mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          {/* Header */}
          <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
                  {todayLabel}
                </p>
                {stats.overdue > 0 && (
                  <span className="rounded-full border border-rose-500/30 bg-rose-500/15 px-2 py-0.5 text-[11px] font-semibold text-rose-300">
                    {stats.overdue} overdue
                  </span>
                )}
              </div>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                TaskFlow
              </h1>
              <p className="mt-1 text-sm text-zinc-400">
                Priorities, categories, due dates, and instant filtering. Press{' '}
                <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 text-[11px] font-semibold text-zinc-300">
                  /
                </kbd>{' '}
                to search.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 sm:min-w-[210px]">
              <div className="flex items-center justify-between text-xs font-medium text-zinc-400">
                <span>Completion</span>
                <span className="font-semibold text-emerald-400">
                  {stats.completed}/{stats.total} ({stats.progress}%)
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${stats.progress}%` }}
                />
              </div>
            </div>
          </header>

          {/* Main Workspace Card */}
          <main className="rounded-2xl border border-zinc-800/90 bg-zinc-900/70 p-4 shadow-2xl shadow-black/40 backdrop-blur-sm sm:p-6">
            {/* Composer */}
            <TodoForm />

            {/* Filter & Search Toolbar */}
            <div className="mt-5 flex flex-col gap-3 border-b border-zinc-800 pb-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-1 rounded-xl border border-zinc-800/80 bg-zinc-950/80 p-1">
                  {FILTERS.map((f) => {
                    const count =
                      f.key === 'all'
                        ? stats.total
                        : f.key === 'active'
                          ? stats.active
                          : stats.completed;
                    const isActive = filter === f.key;
                    return (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setFilter(f.key)}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          isActive
                            ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <span>{f.label}</span>
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                            isActive
                              ? 'bg-emerald-500/20 text-emerald-200'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="relative flex-1 sm:max-w-[220px]">
                  <svg
                    className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
                    />
                  </svg>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tasks..."
                    aria-label="Search tasks"
                    className="h-9 w-full rounded-xl border border-zinc-800 bg-zinc-950/70 pl-8 pr-3 text-xs text-zinc-200 placeholder-zinc-500 outline-none transition focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              {/* Secondary Controls: Category Filter, Sort, Check All */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    aria-label="Filter by category"
                    className="h-8 rounded-lg border border-zinc-800 bg-zinc-950/80 px-2.5 text-xs font-medium text-zinc-300 outline-none transition focus:border-emerald-500/60"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    aria-label="Sort tasks"
                    className="h-8 rounded-lg border border-zinc-800 bg-zinc-950/80 px-2.5 text-xs font-medium text-zinc-300 outline-none transition focus:border-emerald-500/60"
                  >
                    {SORT_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        Sort: {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {todos.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleAll}
                    title="Toggle all tasks"
                    className="h-8 rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white"
                  >
                    {stats.completed === stats.total ? 'Uncheck All' : 'Check All'}
                  </button>
                )}
              </div>
            </div>

            {/* Task List */}
            <div className="mt-4 space-y-2.5">
              {filteredAndSortedTodos.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 px-4 py-12 text-center">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-zinc-800/80 text-emerald-400">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-zinc-200">
                    {todos.length === 0
                      ? 'Your workspace is clear'
                      : 'No matching tasks found'}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {todos.length === 0
                      ? 'Add your first task above to get started.'
                      : 'Try switching filters, category, or clearing your search query.'}
                  </p>
                </div>
              ) : (
                filteredAndSortedTodos.map((todo) => (
                  <TodoItem key={todo.id} todo={todo} />
                ))
              )}
            </div>

            {/* Footer Actions */}
            {todos.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800/80 pt-3.5 text-xs text-zinc-500">
                <span>
                  {stats.active} {stats.active === 1 ? 'task' : 'tasks'} remaining
                </span>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={exportJson}
                    className="font-medium text-zinc-400 transition hover:text-zinc-200"
                  >
                    Export JSON
                  </button>
                  {stats.completed > 0 && (
                    <button
                      type="button"
                      onClick={clearCompleted}
                      className="font-medium text-rose-400 transition hover:text-rose-300"
                    >
                      Clear completed ({stats.completed})
                    </button>
                  )}
                </div>
              </div>
            )}
          </main>

          {/* Undo Delete Toast */}
          {deletedToast && (
            <div
              role="status"
              className="fixed bottom-5 right-5 z-40 flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-xs text-zinc-200 shadow-xl shadow-black/60"
            >
              <span>
                Deleted <strong className="text-white">&ldquo;{deletedToast.todo.todo}&rdquo;</strong>
              </span>
              <button
                type="button"
                onClick={undoDelete}
                className="rounded-lg bg-emerald-500/20 px-2.5 py-1 font-semibold text-emerald-300 transition hover:bg-emerald-500/30"
              >
                Undo
              </button>
            </div>
          )}
        </div>
      </div>
    </TodoProvider>
  );
}

export default App;
