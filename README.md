# TaskFlow — Team Task Manager

A full-stack team task management web app built with **React + Node.js + Express + SQLite**.

---

## 🚀 Features

- **Authentication** — Signup / Login with JWT tokens
- **Role-Based Access** — Admin & Member roles
- **Projects** — Create, view, delete projects (Admin only can create)
- **Team Management** — Add/remove members to projects
- **Tasks** — Create, assign, edit, delete tasks with status & priority
- **Dashboard** — Stats overview with progress tracking
- **My Tasks** — View all tasks assigned to you, filter by status/overdue

---

## 🛠️ Tech Stack

| Layer      | Tech                          |
|-----------|-------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS  |
| Backend   | Node.js, Express.js           |
| Database  | SQLite (via better-sqlite3)   |
| Auth      | JWT + bcryptjs                |
| UI        | Lucide Icons, React Hot Toast |

---

## ⚙️ Setup Instructions

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on: `http://localhost:5000`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:3000`

> **Note:** Vite proxy is configured — frontend `/api` calls automatically forward to backend on port 5000.

---

## 📁 Project Structure

```
taskflow/
├── backend/
│   ├── db/
│   │   └── database.js       # SQLite setup & tables
│   ├── middleware/
│   │   └── auth.js           # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js           # /api/auth — signup, login, me
│   │   ├── projects.js       # /api/projects — CRUD + members
│   │   └── tasks.js          # /api/tasks — CRUD + dashboard
│   ├── .env
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── layout/Layout.jsx   # Sidebar layout
    │   ├── context/
    │   │   └── AuthContext.jsx     # Auth state management
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Signup.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Projects.jsx
    │   │   ├── ProjectDetail.jsx
    │   │   └── MyTasks.jsx
    │   ├── utils/
    │   │   └── api.js             # Axios instance
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── tailwind.config.js
```

---

## 🌐 Deployment (Railway)

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add two services: one for `backend/`, one for `frontend/`
4. Set environment variables in Railway dashboard:
   - Backend: `PORT=5000`, `JWT_SECRET=your_secret_here`
   - Frontend: Update `vite.config.js` proxy target to backend Railway URL
5. Deploy!

---

## 📋 API Endpoints

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/signup | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |

### Projects
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/projects | Get all projects for user |
| POST | /api/projects | Create project (Admin) |
| GET | /api/projects/:id | Get single project with members |
| PUT | /api/projects/:id | Update project |
| DELETE | /api/projects/:id | Delete project |
| POST | /api/projects/:id/members | Add member |
| DELETE | /api/projects/:id/members/:userId | Remove member |

### Tasks
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/tasks/dashboard | Dashboard stats |
| GET | /api/tasks/my-tasks | Tasks assigned to me |
| GET | /api/tasks/project/:id | Tasks for a project |
| POST | /api/tasks | Create task |
| PUT | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task |

---

## 👤 Roles

| Feature | Admin | Member |
|---------|-------|--------|
| Create projects | ✅ | ❌ |
| Add/remove members | ✅ | ❌ |
| Create tasks | ✅ | ✅ |
| Assign tasks | ✅ | ✅ |
| Update task status | ✅ | ✅ |
| Delete any task | ✅ | Own only |

---

Made with ❤️ — TaskFlow
