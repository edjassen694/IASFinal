import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { DashboardStats, Task } from '../types';
import { 
  CheckCircle2, 
  Clock, 
  ListTodo, 
  Loader2, 
  Sparkles, 
  ArrowRight, 
  Calendar, 
  AlertCircle,
  PlusCircle,
  Bot
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (page: 'dashboard' | 'tasks' | 'ai') => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getDashboardStats();
      setStats(data.stats);
      setRecentTasks(data.recent_tasks);
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message || 'Failed to load dashboard metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: Task['status']) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <Loader2 className="w-3 h-3 animate-spin" /> In Progress
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Welcome back, <span className="font-semibold text-slate-800">{user?.name}</span>. Here is a summary of your workspace.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('tasks')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Manage Tasks</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadDashboardData}
            className="text-xs font-bold text-rose-700 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Tasks</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">
              {isLoading ? '...' : (stats?.total ?? 0)}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <ListTodo className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Pending</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">
              {isLoading ? '...' : (stats?.pending ?? 0)}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* In Progress Tasks */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">In Progress</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">
              {isLoading ? '...' : (stats?.in_progress ?? 0)}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Loader2 className="w-6 h-6" />
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Completed</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">
              {isLoading ? '...' : (stats?.completed ?? 0)}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* AI Assistant Banner / Quick Access */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-sm border border-indigo-700">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-700/60 border border-indigo-500/40 text-xs font-semibold text-indigo-200 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>AI Productivity Assistant</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Need guidance on what to prioritize next?
          </h2>
          <p className="mt-2 text-sm text-indigo-100 leading-relaxed">
            TaskMate AI reads your live database tasks to recommend what you should tackle first, summarize your pending deadlines, and provide productivity advice tailored to your workload.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('ai')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white text-indigo-900 hover:bg-indigo-50 text-sm font-bold shadow-xs transition cursor-pointer"
            >
              <Bot className="w-4 h-4 text-indigo-600" />
              <span>Ask AI Assistant</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <span className="text-xs text-indigo-200">
              {stats?.pending ? `${stats.pending} pending tasks ready for review` : 'All tasks up to date'}
            </span>
          </div>
        </div>

        {/* Subtle decorative background icon */}
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
          <Bot className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* Recent Tasks Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Tasks</h2>
            <p className="text-xs text-slate-500 mt-0.5">The latest tasks added or updated in your account</p>
          </div>
          <button
            onClick={() => onNavigate('tasks')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Loading recent tasks...</span>
            </div>
          ) : recentTasks.length === 0 ? (
            <div className="p-8 text-center">
              <ListTodo className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No tasks created yet</p>
              <p className="text-xs text-slate-400 mt-1">Get started by creating your very first task.</p>
              <button
                onClick={() => onNavigate('tasks')}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold hover:bg-indigo-100 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Add Task
              </button>
            </div>
          ) : (
            recentTasks.map((task) => (
              <div key={task.id} className="p-4 hover:bg-slate-50 transition flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-slate-900 truncate">
                      {task.title}
                    </h3>
                    {getStatusBadge(task.status)}
                  </div>
                  {task.description && (
                    <p className="text-xs text-slate-500 line-clamp-1 mt-1">
                      {task.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 shrink-0 text-xs text-slate-400">
                  {task.due_date && (
                    <span className="flex items-center gap-1 font-medium text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {task.due_date}
                    </span>
                  )}
                  <button
                    onClick={() => onNavigate('tasks')}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
