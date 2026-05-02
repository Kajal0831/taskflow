import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  ArrowLeft, Plus, Trash2, Edit2, X, Users,
  CheckSquare, Clock, AlertTriangle, Circle, UserPlus
} from 'lucide-react';

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-dark-800 border border-dark-400 rounded-2xl w-full max-w-lg fade-in">
      <div className="flex items-center justify-between px-6 py-4 border-b border-dark-400">
        <h3 className="font-semibold text-white">{title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

const statusConfig = {
  todo: { label: 'To Do', cls: 'badge-todo', dot: 'text-slate-400' },
  in_progress: { label: 'In Progress', cls: 'badge-in_progress', dot: 'text-amber-400' },
  done: { label: 'Done', cls: 'badge-done', dot: 'text-emerald-400' },
};
const priorityConfig = {
  low: { cls: 'badge-low' },
  medium: { cls: 'badge-medium' },
  high: { cls: 'badge-high' },
};

const defaultTaskForm = { title: '', description: '', assigned_to: '', status: 'todo', priority: 'medium', due_date: '' };

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState(defaultTaskForm);
  const [memberEmail, setMemberEmail] = useState('');
  const [filter, setFilter] = useState('all');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [projRes, taskRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks/project/${id}`)
      ]);
      setProject(projRes.data);
      setTasks(taskRes.data);
    } catch { toast.error('Failed to load project'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [id]);

  const openCreate = () => { setEditingTask(null); setTaskForm(defaultTaskForm); setShowTaskModal(true); };
  const openEdit = (t) => {
    setEditingTask(t);
    setTaskForm({ title: t.title, description: t.description || '', assigned_to: t.assigned_to || '', status: t.status, priority: t.priority, due_date: t.due_date || '' });
    setShowTaskModal(true);
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = { ...taskForm, project_id: id, assigned_to: taskForm.assigned_to || null };
    try {
      if (editingTask) {
        await api.put(`/tasks/${editingTask.id}`, payload);
        toast.success('Task updated!');
      } else {
        await api.post('/tasks', payload);
        toast.success('Task created!');
      }
      setShowTaskModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save task');
    } finally { setSubmitting(false); }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success('Task deleted');
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch { toast.error('Failed to delete task'); }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      await api.put(`/tasks/${task.id}`, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    } catch { toast.error('Failed to update status'); }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail });
      toast.success('Member added!');
      setMemberEmail('');
      setShowMemberModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add member');
    } finally { setSubmitting(false); }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      toast.success('Member removed');
      fetchData();
    } catch { toast.error('Failed to remove member'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!project) return <div className="text-slate-400">Project not found.</div>;

  const filteredTasks = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
  const isAdmin = user?.role === 'admin';
  const isOverdue = (t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done';

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link to="/projects" className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm mb-3 transition-colors">
            <ArrowLeft size={15} /> Back to Projects
          </Link>
          <h1 className="text-2xl font-bold text-white">{project.name}</h1>
          {project.description && <p className="text-slate-400 mt-1">{project.description}</p>}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {isAdmin && (
            <button onClick={() => setShowMemberModal(true)} className="btn-secondary">
              <UserPlus size={16} /> Add Member
            </button>
          )}
          <button onClick={openCreate} className="btn-primary">
            <Plus size={16} /> Add Task
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'To Do', val: tasks.filter(t => t.status === 'todo').length, icon: Circle, color: 'text-slate-400' },
          { label: 'In Progress', val: tasks.filter(t => t.status === 'in_progress').length, icon: Clock, color: 'text-amber-400' },
          { label: 'Done', val: tasks.filter(t => t.status === 'done').length, icon: CheckSquare, color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="card flex items-center gap-3 py-3">
            <s.icon size={18} className={s.color} />
            <div>
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="text-xl font-bold text-white">{s.val}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Tasks */}
        <div className="xl:col-span-3 space-y-4">
          {/* Filter tabs */}
          <div className="flex gap-2">
            {['all', 'todo', 'in_progress', 'done'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === f ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30' : 'text-slate-400 hover:text-slate-200 bg-dark-700'
                }`}>
                {f === 'all' ? 'All' : f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {filteredTasks.length === 0 ? (
            <div className="card text-center py-12">
              <CheckSquare size={40} className="mx-auto mb-3 text-slate-600" />
              <p className="text-slate-400 text-sm">No tasks{filter !== 'all' ? ` with status "${filter}"` : ''}.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map(task => {
                const sc = statusConfig[task.status];
                const pc = priorityConfig[task.priority];
                const overdue = isOverdue(task);
                return (
                  <div key={task.id} className="card hover:border-dark-300 transition-all duration-200 group">
                    <div className="flex items-start gap-3">
                      <Circle size={8} className={`mt-2 flex-shrink-0 ${sc.dot}`} fill="currentColor" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`font-medium text-sm ${task.status === 'done' ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button onClick={() => openEdit(task)} className="text-slate-400 hover:text-brand-400 transition-colors p-1">
                              <Edit2 size={14} />
                            </button>
                            {(isAdmin || task.created_by === user?.id) && (
                              <button onClick={() => handleDeleteTask(task.id)} className="text-slate-400 hover:text-red-400 transition-colors p-1">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                        {task.description && <p className="text-xs text-slate-500 mt-1">{task.description}</p>}
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <span className={sc.cls}>{sc.label}</span>
                          <span className={pc.cls}>{task.priority}</span>
                          {task.assigned_to_name && (
                            <span className="text-xs text-slate-500 bg-dark-600 px-2 py-1 rounded-full">
                              👤 {task.assigned_to_name}
                            </span>
                          )}
                          {task.due_date && (
                            <span className={`text-xs px-2 py-1 rounded-full ${overdue ? 'bg-red-500/15 text-red-400' : 'bg-dark-600 text-slate-400'}`}>
                              {overdue && <AlertTriangle size={11} className="inline mr-1" />}
                              {format(new Date(task.due_date), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                        {/* Quick status change */}
                        <div className="flex gap-1.5 mt-3">
                          {Object.entries(statusConfig).map(([s, cfg]) => (
                            <button key={s} onClick={() => handleStatusChange(task, s)}
                              className={`text-xs px-2 py-1 rounded-md transition-all duration-200 ${
                                task.status === s ? `${cfg.cls} opacity-100` : 'bg-dark-600 text-slate-500 hover:text-slate-300'
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

        {/* Members sidebar */}
        <div className="card h-fit">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Users size={16} className="text-brand-400" /> Members
            <span className="text-xs text-slate-500 ml-auto">{project.members?.length || 0}</span>
          </h3>
          <div className="space-y-3">
            {project.members?.map(m => (
              <div key={m.id} className="flex items-center gap-2 group">
                <div className="w-7 h-7 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-xs font-bold text-brand-400 flex-shrink-0">
                  {m.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-200 truncate">{m.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{m.project_role}</p>
                </div>
                {isAdmin && m.id !== user?.id && (
                  <button onClick={() => handleRemoveMember(m.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all">
                    <X size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <Modal title={editingTask ? 'Edit Task' : 'Create Task'} onClose={() => setShowTaskModal(false)}>
          <form onSubmit={handleTaskSubmit} className="space-y-4">
            <div>
              <label className="label">Title *</label>
              <input type="text" className="input" placeholder="Task title"
                value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input resize-none" rows={2} placeholder="Optional description"
                value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Status</label>
                <select className="input" value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div>
                <label className="label">Priority</label>
                <select className="input" value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Assign To</label>
              <select className="input" value={taskForm.assigned_to} onChange={e => setTaskForm({ ...taskForm, assigned_to: e.target.value })}>
                <option value="">Unassigned</option>
                {project.members?.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Due Date</label>
              <input type="date" className="input" value={taskForm.due_date}
                onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowTaskModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
                {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : editingTask ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <Modal title="Add Team Member" onClose={() => setShowMemberModal(false)}>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div>
              <label className="label">Member Email</label>
              <input type="email" className="input" placeholder="member@example.com"
                value={memberEmail} onChange={e => setMemberEmail(e.target.value)} required />
              <p className="text-xs text-slate-500 mt-1.5">User must already have a TaskFlow account</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowMemberModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
                {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Add Member'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
