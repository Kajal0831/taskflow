import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { CheckSquare, AlertTriangle, Circle, ArrowRight, Filter } from 'lucide-react';

const statusConfig = {
  todo: { label: 'To Do', cls: 'badge-todo', dot: 'text-slate-400' },
  in_progress: { label: 'In Progress', cls: 'badge-in_progress', dot: 'text-amber-400' },
  done: { label: 'Done', cls: 'badge-done', dot: 'text-emerald-400' },
};

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/tasks/my-tasks')
      .then(res => setTasks(res.data))
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (task, newStatus) => {
    try {
      await api.put(`/tasks/${task.id}`, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
      toast.success('Status updated');
    } catch { toast.error('Failed to update'); }
  };

  const filtered = filter === 'all' ? tasks
    : filter === 'overdue'
      ? tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done')
      : tasks.filter(t => t.status === filter);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const overdueCount = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length;

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">My Tasks</h1>
        <p className="text-slate-400 mt-1">{tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned to you</p>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={14} className="text-slate-500" />
        {[
          { val: 'all', label: 'All' },
          { val: 'todo', label: 'To Do' },
          { val: 'in_progress', label: 'In Progress' },
          { val: 'done', label: 'Done' },
          { val: 'overdue', label: `Overdue ${overdueCount > 0 ? `(${overdueCount})` : ''}` },
        ].map(f => (
          <button key={f.val} onClick={() => setFilter(f.val)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              filter === f.val
                ? f.val === 'overdue' ? 'bg-red-500/15 text-red-400 border border-red-500/30' : 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                : 'text-slate-400 hover:text-slate-200 bg-dark-700'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <CheckSquare size={48} className="mx-auto mb-4 text-slate-600" />
          <h3 className="font-semibold text-slate-300 mb-2">
            {filter === 'all' ? 'No tasks assigned' : `No ${filter} tasks`}
          </h3>
          <p className="text-slate-500 text-sm">
            {filter === 'all' ? 'Tasks assigned to you will appear here.' : 'Try a different filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(task => {
            const sc = statusConfig[task.status];
            const overdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
            return (
              <div key={task.id} className="card hover:border-dark-300 transition-all duration-200">
                <div className="flex items-start gap-3">
                  <Circle size={8} className={`mt-2 flex-shrink-0 ${sc.dot}`} fill="currentColor" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`font-medium text-sm ${task.status === 'done' ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                        {task.title}
                      </p>
                      <Link to={`/projects/${task.project_id}`}
                        className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors flex-shrink-0">
                        {task.project_name} <ArrowRight size={11} />
                      </Link>
                    </div>
                    {task.description && <p className="text-xs text-slate-500 mt-1">{task.description}</p>}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className={sc.cls}>{sc.label}</span>
                      {task.due_date && (
                        <span className={`text-xs px-2 py-1 rounded-full ${overdue ? 'bg-red-500/15 text-red-400' : 'bg-dark-600 text-slate-400'}`}>
                          {overdue && <AlertTriangle size={11} className="inline mr-1" />}
                          Due {format(new Date(task.due_date), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                    {/* Quick status */}
                    <div className="flex gap-1.5 mt-3">
                      {Object.entries(statusConfig).map(([s, cfg]) => (
                        <button key={s} onClick={() => handleStatusChange(task, s)}
                          className={`text-xs px-2 py-1 rounded-md transition-all duration-200 ${
                            task.status === s ? `${cfg.cls}` : 'bg-dark-600 text-slate-500 hover:text-slate-300'
                          }`}>
                          {cfg.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
