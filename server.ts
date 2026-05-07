import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

// Database Initialization
const db = new Database('planexa.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    theme_preference TEXT DEFAULT 'light'
  );

  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    duration INTEGER DEFAULT 0,
    description TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    archived INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    due_date DATE NOT NULL,
    completed INTEGER DEFAULT 0,
    archived INTEGER DEFAULT 0,
    notify INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    streak INTEGER DEFAULT 0,
    last_completed DATE,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS custom_activity_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Migration: Ensure activities table has duration column
try {
  db.prepare('SELECT duration FROM activities LIMIT 1').get();
} catch (err) {
  console.log('Adding duration column to activities table...');
  db.exec('ALTER TABLE activities ADD COLUMN duration INTEGER DEFAULT 0');
}

// Migration: Ensure database schema is up-to-date
try { db.prepare('SELECT archived FROM activities LIMIT 1').get(); }
catch (err) { db.exec('ALTER TABLE activities ADD COLUMN archived INTEGER DEFAULT 0'); }

try { db.prepare('SELECT archived FROM reminders LIMIT 1').get(); }
catch (err) { db.exec('ALTER TABLE reminders ADD COLUMN archived INTEGER DEFAULT 0'); }

try { db.prepare('SELECT notify FROM reminders LIMIT 1').get(); }
catch (err) { db.exec('ALTER TABLE reminders ADD COLUMN notify INTEGER DEFAULT 0'); }

// Seed default habits for new users
const seedHabits = (userId: number) => {
  const habits = ['Exercise', 'Reading', 'Meditation', 'Drink Water'];
  const stmt = db.prepare('INSERT INTO habits (user_id, name) VALUES (?, ?)');
  habits.forEach(h => stmt.run(userId, h));
};

async function startServer() {
  const app = express();
  app.use(express.json());

  // --- API Routes ---

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // Signup
  app.post('/api/auth/signup', async (req, res) => {
    const { email, password, role, full_name } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const stmt = db.prepare('INSERT INTO users (email, password, role, full_name) VALUES (?, ?, ?, ?)');
      const info = stmt.run(email, hashedPassword, role || 'user', full_name || null);
      seedHabits(Number(info.lastInsertRowid));
      res.status(201).json({ id: info.lastInsertRowid });
    } catch (error) {
      res.status(400).json({ error: 'Email already exists or invalid data' });
    }
  });

  app.get('/api/auth/me', authenticateToken, (req: any, res) => {
    const user = db.prepare('SELECT id, email, role, full_name FROM users WHERE id = ?').get(req.user.id);
    res.json(user);
  });

  // Profile Update
  app.patch('/api/auth/profile', authenticateToken, (req: any, res) => {
    const { full_name, role } = req.body;
    try {
      db.prepare('UPDATE users SET full_name = ?, role = ? WHERE id = ?').run(full_name, role, req.user.id);
      const user = db.prepare('SELECT id, email, role, full_name FROM users WHERE id = ?').get(req.user.id);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: 'Failed to update profile' });
    }
  });

  // Habits
  app.get('/api/habits', authenticateToken, (req: any, res) => {
    const habits = db.prepare('SELECT * FROM habits WHERE user_id = ?').all(req.user.id);
    res.json(habits);
  });

  // Goals
  app.get('/api/goals', authenticateToken, (req: any, res) => {
    const goals = db.prepare('SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json(goals);
  });

  app.post('/api/goals', authenticateToken, (req: any, res) => {
    const { title, description, target_date } = req.body;
    try {
      const stmt = db.prepare('INSERT INTO goals (user_id, title, description, target_date) VALUES (?, ?, ?, ?)');
      const info = stmt.run(req.user.id, title, description, target_date);
      const newGoal = db.prepare('SELECT * FROM goals WHERE id = ?').get(info.lastInsertRowid);
      res.status(201).json(newGoal);
    } catch (error) {
      res.status(400).json({ error: 'Failed to create goal' });
    }
  });

  app.patch('/api/goals/:id', authenticateToken, (req: any, res) => {
    const { completed } = req.body;
    try {
      db.prepare('UPDATE goals SET completed = ? WHERE id = ? AND user_id = ?').run(completed ? 1 : 0, req.params.id, req.user.id);
      const updatedGoal = db.prepare('SELECT * FROM goals WHERE id = ?').get(req.params.id);
      res.json(updatedGoal);
    } catch (error) {
      res.status(400).json({ error: 'Failed to update goal' });
    }
  });

  app.delete('/api/goals/:id', authenticateToken, (req: any, res) => {
    try {
      db.prepare('DELETE FROM goals WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: 'Failed to delete goal' });
    }
  });

  app.patch('/api/habits/:id/toggle', authenticateToken, (req: any, res) => {
    const today = new Date().toISOString().split('T')[0];
    const habit: any = db.prepare('SELECT last_completed FROM habits WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    
    if (!habit) return res.status(404).json({ error: 'Habit not found' });

    let newStatus = today;
    let streakChange = 1;
    
    if (habit.last_completed === today) {
      newStatus = null;
      streakChange = -1;
    }
    
    db.prepare('UPDATE habits SET last_completed = ?, streak = MAX(0, streak + ?) WHERE id = ? AND user_id = ?').run(newStatus, streakChange, req.params.id, req.user.id);
    res.json({ success: true, last_completed: newStatus });
  });

  // Login
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name } });
  });

  app.post('/api/habits', authenticateToken, (req: any, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Habit name is required' });
    const stmt = db.prepare('INSERT INTO habits (user_id, name) VALUES (?, ?)');
    const info = stmt.run(req.user.id, name);
    res.status(201).json({ id: info.lastInsertRowid, name, completed: 0 });
  });

  app.delete('/api/habits/:id', authenticateToken, (req: any, res) => {
    const stmt = db.prepare('DELETE FROM habits WHERE id = ? AND user_id = ?');
    const info = stmt.run(req.params.id, req.user.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Habit not found' });
    res.json({ success: true });
  });

  // Custom Activity Types
  app.get('/api/custom_activities', authenticateToken, (req: any, res) => {
    const types = db.prepare('SELECT * FROM custom_activity_types WHERE user_id = ?').all(req.user.id);
    res.json(types);
  });

  app.post('/api/custom_activities', authenticateToken, (req: any, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const stmt = db.prepare('INSERT INTO custom_activity_types (user_id, name) VALUES (?, ?)');
    const info = stmt.run(req.user.id, name);
    res.status(201).json({ id: info.lastInsertRowid, name });
  });

  app.delete('/api/custom_activities/:id', authenticateToken, (req: any, res) => {
    db.prepare('DELETE FROM custom_activity_types WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.sendStatus(204);
  });

  // Activities
  app.get('/api/activities', authenticateToken, (req: any, res) => {
    const archived = req.query.archived === 'true' ? 1 : 0;
    const activities = db.prepare('SELECT * FROM activities WHERE user_id = ? AND archived = ? ORDER BY timestamp DESC').all(req.user.id, archived);
    res.json(activities);
  });

  app.post('/api/activities', authenticateToken, (req: any, res) => {
    const { type, duration, description } = req.body;
    const stmt = db.prepare('INSERT INTO activities (user_id, type, duration, description) VALUES (?, ?, ?, ?)');
    const info = stmt.run(req.user.id, type, duration || 0, description || '');
    res.status(201).json({ id: info.lastInsertRowid });
  });

  app.patch('/api/activities/:id/archive', authenticateToken, (req: any, res) => {
    db.prepare('UPDATE activities SET archived = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.sendStatus(200);
  });

  // Reminders
  app.get('/api/reminders', authenticateToken, (req: any, res) => {
    const archived = req.query.archived === 'true' ? 1 : 0;
    const reminders = db.prepare('SELECT * FROM reminders WHERE user_id = ? AND archived = ?').all(req.user.id, archived);
    res.json(reminders);
  });

  app.post('/api/reminders', authenticateToken, (req: any, res) => {
    const { title, due_date, notify } = req.body;
    const stmt = db.prepare('INSERT INTO reminders (user_id, title, due_date, notify) VALUES (?, ?, ?, ?)');
    const info = stmt.run(req.user.id, title, due_date, notify ? 1 : 0);
    res.status(201).json({ id: info.lastInsertRowid });
  });

  app.patch('/api/reminders/:id/archive', authenticateToken, (req: any, res) => {
    db.prepare('UPDATE reminders SET archived = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.sendStatus(200);
  });

  app.patch('/api/reminders/:id/notify', authenticateToken, (req: any, res) => {
    const { notify } = req.body;
    db.prepare('UPDATE reminders SET notify = ? WHERE id = ? AND user_id = ?').run(notify ? 1 : 0, req.params.id, req.user.id);
    res.sendStatus(200);
  });

  app.delete('/api/reminders/:id', authenticateToken, (req: any, res) => {
    db.prepare('DELETE FROM reminders WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.sendStatus(204);
  });

  app.patch('/api/reminders/:id/toggle', authenticateToken, (req: any, res) => {
    db.prepare('UPDATE reminders SET completed = 1 - completed WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.sendStatus(200);
  });

  // Statistics
  app.get('/api/stats', authenticateToken, (req: any, res) => {
    try {
      const stats = db.prepare(`
        SELECT type as name, SUM(duration) as value 
        FROM activities 
        WHERE user_id = ? 
        GROUP BY type
      `).all(req.user.id);
      
      console.log(`Stats for user ${req.user.id}:`, stats);
      res.json(stats || []);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  });

  // --- Vite / Frontend Setup ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PLANEXA Server running on http://localhost:${PORT}`);
  });
}

startServer();
