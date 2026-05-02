import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, FolderKanban, Users, CheckSquare, Trash2, ArrowRight, X } from 'lucide-react';

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-dark-800 border border-dark-400 rounded-2xl w-full max-w-md fade-in">
      <div className="flex items-center justify-between px-6 py-4 border-b border-dark-400">
        <h3 className="font-semibold text-white">{title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchProjects = () => {
    api.get('/projects')
      .then(res => setProjects(res.data))
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/projects', form);
      toast.success('Project created!');
      setShowModal(false);
      setForm({ name: '', description: '' });
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project and all its tasks?')) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted');
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch {
      toast.error('Failed to delete project');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-slate-400 mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="card text-center py-16">
          <FolderKanban size={48} className="mx-auto mb-4 text-slate-600" />
          <h3 className="font-semibold text-slate-300 mb-2">No projects yet</h3>
          <p className="text-slate-500 text-sm mb-5">
            {user?.role === 'admin' ? 'Create your first project to get started.' : 'You haven\'t been added to any projects yet.'}
          </p>
          {user?.role === 'admin' && (
            <button onClick={() => setShowModal(true)} className="btn-primary mx-auto">
              <Plus size={16} /> Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map(project => (
            <div key={project.id} className="card group hover:border-dark-300 transition-all duration-200">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-brand-500/15 rounded-xl flex items-center justify-center">
                  <FolderKanban size={18} className="text-brand-400" />
                </div>
                {user?.role === 'admin' && project.created_by === user.id && (
                  <button onClick={() => handleDelete(project.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all duration-200">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <h3 className="font-semibold text-white mb-1 truncate">{project.name}</h3>
              {project.description && (
                <p className="text-slate-500 text-sm mb-4 line-clamp-2">{project.description}</p>
              )}

              <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                <span className="flex items-center gap-1.5">
                  <CheckSquare size={13} /> {project.task_count} tasks
                </span>
                <span className="flex items-center gap-1.5">
                  <Users size={13} /> {project.member_count} members
                </span>
              </div>

              <Link to={`/projects/${project.id}`}
                className="flex items-center gap-1 text-sm text-brand-400 hover:text-brand-300 font-medium transition-colors">
                Open project <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="Create New Project" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="label">Project Name *</label>
              <input type="text" className="input" placeholder="e.g. Website Redesign"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input resize-none" rows={3} placeholder="Brief description of the project..."
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
                {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating...</> : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
