const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');

// GET tasks for a project
router.get('/project/:projectId', authenticate, (req, res) => {
  const tasks = db.prepare(`
    SELECT t.*, 
      u1.name as assigned_to_name, u1.email as assigned_to_email,
      u2.name as created_by_name
    FROM tasks t
    LEFT JOIN users u1 ON t.assigned_to = u1.id
    LEFT JOIN users u2 ON t.created_by = u2.id
    WHERE t.project_id = ?
    ORDER BY t.created_at DESC
  `).all(req.params.projectId);
  res.json(tasks);
});

// GET all tasks for current user
router.get('/my-tasks', authenticate, (req, res) => {
  const tasks = db.prepare(`
    SELECT t.*, p.name as project_name,
      u1.name as assigned_to_name,
      u2.name as created_by_name
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    LEFT JOIN users u1 ON t.assigned_to = u1.id
    LEFT JOIN users u2 ON t.created_by = u2.id
    WHERE t.assigned_to = ?
    ORDER BY t.due_date ASC, t.created_at DESC
  `).all(req.user.id);
  res.json(tasks);
});

// GET dashboard stats
router.get('/dashboard', authenticate, (req, res) => {
  const totalProjects = db.prepare(`
    SELECT COUNT(*) as count FROM projects
    WHERE created_by = ? OR id IN (SELECT project_id FROM project_members WHERE user_id = ?)
  `).get(req.user.id, req.user.id);

  const taskStats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done,
      SUM(CASE WHEN due_date < date('now') AND status != 'done' THEN 1 ELSE 0 END) as overdue
    FROM tasks
    WHERE assigned_to = ? OR created_by = ?
  `).get(req.user.id, req.user.id);

  const recentTasks = db.prepare(`
    SELECT t.*, p.name as project_name, u.name as assigned_to_name
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    LEFT JOIN users u ON t.assigned_to = u.id
    WHERE t.assigned_to = ? OR t.created_by = ?
    ORDER BY t.updated_at DESC LIMIT 5
  `).all(req.user.id, req.user.id);

  res.json({
    totalProjects: totalProjects.count,
    taskStats,
    recentTasks
  });
});

// POST create task
router.post('/', authenticate, (req, res) => {
  const { title, description, project_id, assigned_to, status, priority, due_date } = req.body;
  if (!title || !project_id) return res.status(400).json({ error: 'Title and project are required' });

  const result = db.prepare(`
    INSERT INTO tasks (title, description, project_id, assigned_to, created_by, status, priority, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, description || '', project_id, assigned_to || null, req.user.id,
    status || 'todo', priority || 'medium', due_date || null);

  const task = db.prepare(`
    SELECT t.*, u1.name as assigned_to_name, u2.name as created_by_name
    FROM tasks t
    LEFT JOIN users u1 ON t.assigned_to = u1.id
    LEFT JOIN users u2 ON t.created_by = u2.id
    WHERE t.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(task);
});

// PUT update task
router.put('/:id', authenticate, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const { title, description, assigned_to, status, priority, due_date } = req.body;
  db.prepare(`
    UPDATE tasks SET title=?, description=?, assigned_to=?, status=?, priority=?, due_date=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(
    title || task.title,
    description ?? task.description,
    assigned_to !== undefined ? assigned_to : task.assigned_to,
    status || task.status,
    priority || task.priority,
    due_date !== undefined ? due_date : task.due_date,
    req.params.id
  );

  const updated = db.prepare(`
    SELECT t.*, u1.name as assigned_to_name, u2.name as created_by_name
    FROM tasks t
    LEFT JOIN users u1 ON t.assigned_to = u1.id
    LEFT JOIN users u2 ON t.created_by = u2.id
    WHERE t.id = ?
  `).get(req.params.id);

  res.json(updated);
});

// DELETE task
router.delete('/:id', authenticate, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.created_by !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Not authorized' });

  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ message: 'Task deleted' });
});

module.exports = router;
