# TaskMate AI — Simple Task Management System

TaskMate AI is a streamlined, full-stack task management web application designed for fast, focused personal productivity with an embedded AI assistant.

---

## 🚀 Key Features

1. **User Authentication**
   - User registration, login, and token-based session management using Laravel Sanctum.
   - Secure password hashing with BCrypt.
   - Protected routes and strict user task isolation.

2. **Task Management (Full CRUD)**
   - **Create**: Add new tasks with title, description, status, and due date.
   - **Read**: View tasks with live database persistence.
   - **Update**: Edit tasks and toggle status directly (`Pending`, `In Progress`, `Completed`).
   - **Delete**: Remove tasks with safety confirmation prompt.
   - **Search & Filter**: Real-time keyword search and status filtering.

3. **Productivity Dashboard**
   - Live metrics: Total, Pending, In-Progress, and Completed tasks.
   - Recent tasks overview.
   - Quick access to the AI Assistant.

4. **Real AI Assistant (Google Gemini)**
   - Context-aware chatbot connected to the user's actual database tasks.
   - Summarizes pending deadlines and recommends what task to tackle next.
   - Provides actionable productivity advice (Eisenhower Matrix, Pomodoro).
   - Strict advisory role (never modifies or deletes database records without user action).

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons.
- **Backend**: PHP Laravel 11/12, SQLite database, Laravel Sanctum authentication.
- **AI Service**: Google Gemini API (`gemini-2.0-flash` / `gemini-1.5-flash`).
- **Deployment**: Vercel (Frontend SPA) + Render / Railway (Backend).

---

## 🏃 Running Locally

### 1. Backend Setup:
```bash
cd backend
composer install
php artisan migrate
php artisan serve --port=8000
```
Backend will be available at `http://localhost:8000`.

### 2. Frontend Setup:
```bash
cd frontend
npm install
npm run dev
```
Frontend will be available at `http://localhost:5173`.

### 3. Configuring AI Assistant:
Get a free API key at [Google AI Studio](https://aistudio.google.com/app/apikey).
Add it to `backend/.env`:
```env
GEMINI_API_KEY=AIzaSy...
```

---

## 📦 Deployment

- **Frontend (Vercel)**: Import repository, choose `Vite` preset, root directory `frontend`, set `VITE_API_BASE_URL` to your backend URL.
- **Backend (Render/Railway)**: Use included `Dockerfile` and `render.yaml`.
