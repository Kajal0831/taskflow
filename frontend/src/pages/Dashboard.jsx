import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import {
  FolderKanban, CheckSquare, Clock, AlertTriangle,
  TrendingUp, ArrowRight, Circle
} from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color, bg }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
      <Icon size={22} className={color} />
    </div>
    <div>
      <p className="text-slate-400 text-sm">{label}</p>
      <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
    </div>
  </div>
);

const statusConfig = {
  todo: { label: 'To Do', cls: 'badge-todo' },
  in_progress: { label: 'In Progress', cls: 'badge-in_progress' },
  done: { label: 'Done', cls: 'badge-done' },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tasks/dashboard')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const stats = data?.taskStats || {};
  const donePercent = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Good day, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-400 mt-1">Here's what's happening with your projects today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={FolderKanban} label="Total Projects" value={data?.totalProjects}
          color="text-brand-400" bg="bg-brand-500/15" />
        <StatCard icon={CheckSquare} label="Tasks Done" value={stats.done}
          color="text-emerald-400" bg="bg-emerald-500/15" />
        <StatCard icon={Clock} label="In Progress" value={stats.in_progress}
          color="text-amber-400" bg="bg-amber-500/15" />
        <StatCard icon={AlertTriangle} label="Overdue" value={stats.overdue}
          color="text-red-400" bg="bg-red-500/15" />
      </div>

      {/* Progress bar */}
      {stats.total > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-brand-400" />
              <span className="text-sm font-medium text-slate-300">Overall Progress</span>
            </div>
            <span className="text-sm font-bold text-brand-400">{donePercent}%</span>
          </div>
          <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all duration-700"
              style={{ width: `${donePercent}%` }}
            />
          </div>
          <div className="flex gap-6 mt-3">
            {[
              { label: 'To Do', val: stats.todo, color: 'bg-slate-500' },
              { label: 'In Progress', val: stats.in_progress, color: 'bg-amber-400' },
              { label: 'Done', val: stats.done, color: 'bg-emerald-400' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2 text-xs text-slate-400">
                <div className={`w-2 h-2 rounded-full ${s.color}`} />
                {s.label}: <span className="text-slate-200 font-medium">{s.val ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent tasks */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-white">Recent Tasks</h2>
          <Link to="/my-tasks" className="flex items-center gap-1 text-sm text-brand-400 hover:text-brand-300 transition-colors">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {data?.recentTasks?.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <CheckSquare size={40} className="mx-auto mb-3 opacity-30" />
            <p>No tasks yet. Create a project and add tasks!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data?.recentTasks?.map(task => {
              const sc = statusConfig[task.status] || statusConfig.todo;
              const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
              return (
                <div key={task.id} className="flex items-center gap-4 p-3 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors">
                  <Circle size={8} className={`flex-shrink-0 ${task.status === 'done' ? 'text-emerald-400' : task.status === 'in_progress' ? 'text-amber-400' : 'text-slate-500'}`} fill="currentColor" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${task.status === 'done' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {task.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{task.project_name}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={sc.cls}>{sc.label}</span>
                    {task.due_date && (
                      <span className={`text-xs ${isOverdue ? 'text-red-400' : 'text-slate-500'}`}>
                        {format(new Date(task.due_date), 'MMM d')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
