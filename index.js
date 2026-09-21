const express = require('express');
const app = express();
const swaggerUi = require('swagger-ui-express');
const openapiDocument = require('./openapi.json');
const PORT = process.env.PORT || 3001;
require('dotenv').config();
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function setupDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      done BOOLEAN NOT NULL DEFAULT false
    )
  `);

  const result = await pool.query('SELECT COUNT(*) FROM tasks');
  const count = Number(result.rows[0].count);

  if (count === 0) {
    await pool.query('INSERT INTO tasks (title, done) VALUES ($1, $2)', [
      'Buy groceries',
      false,
    ]);
    await pool.query('INSERT INTO tasks (title, done) VALUES ($1, $2)', [
      'Walk 1 km',
      true,
    ]);
    await pool.query('INSERT INTO tasks (title, done) VALUES ($1, $2)', [
      'Read a book',
      false,
    ]);
  }
}

setupDatabase();

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));
app.use(express.json());

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const token = authHeader.split(' ')[1];

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = data.user;
  req.token = token;
  next();
}

// Stage 1- root and health check endpoints

app.get('/', (req, res) => {
  res.json({ name: 'Task API', version: '1.0', endpoints: ['/tasks'] });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Stage 1 - Auth: Signup & Login

app.post('/auth/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json(data.user);
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return res.status(401).json({ error: 'Invalid login credentials' });
  }

  res.status(200).json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });
});

app.post('/auth/logout', requireAuth, async (req, res) => {
  const { error } = await supabase.auth.signOut(req.token);

  if (error) {
    return res.status(400).json({ error: 'Failed to logout' });
  }

  res.status(204).send();
});

// Stage 2 - Public & Protected Gates

app.get('/public/info', (req, res) => {
  res.json({ message: 'Welcome stranger! This info is public.' });
});

app.get('/protected/profile', requireAuth, async (req, res) => {
  res.status(200).json({
    id: req.user.id,
    email: req.user.email,
    created_at: req.user.created_at,
  });
});

app.get('/protected/dashboard', requireAuth, (req, res) => {
  res.json({ message: `Welcome to your dashboard, ${req.user.email}` });
});

// Stage 2- Read: List and Single Task

app.get('/tasks', async (req, res) => {
  const result = await pool.query('SELECT * FROM tasks ORDER BY id');
  res.json(result.rows);
});

app.get('/tasks/:id', async (req, res) => {
  const taskId = parseInt(req.params.id);
  const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [
    taskId,
  ]);
  const task = result.rows[0];
  if (!task) {
    return res.status(404).json({ error: `Task ${taskId} not found` });
  }
  res.json({ ...task, done: !!task.done });
});

// Stage 3- Create: Add a new task

app.post('/tasks', async (req, res) => {
  const { title } = req.body;

  if (!title || title.trim() === '') {
    return res
      .status(400)
      .json({ error: 'title is required and cannot be empty' });
  }

  const result = await pool.query(
    'INSERT INTO tasks (title, done) VALUES ($1, $2) RETURNING *',
    [title.trim(), false],
  );

  res.status(201).json(result.rows[0]);
});

// Stage 4- Update & Delete

app.put('/tasks/:id', async (req, res) => {
  const taskId = parseInt(req.params.id);
  const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [
    taskId,
  ]);
  const task = result.rows[0];

  if (!task) {
    return res.status(404).json({ error: `Task ${taskId} not found` });
  }

  const { title, done } = req.body;

  if (title === undefined && done === undefined) {
    return res
      .status(400)
      .json({ error: 'request body must include title and/or done' });
  }

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'title cannot be empty' });
    }
    task.title = title.trim();
  }

  if (done !== undefined) {
    if (typeof done !== 'boolean') {
      return res.status(400).json({ error: 'done must be a boolean' });
    }
    task.done = done;
  }

  await pool.query('UPDATE tasks SET title = $1, done = $2 WHERE id = $3', [
    task.title,
    task.done,
    taskId,
  ]);

  res.json({ ...task, done: !!task.done });
});

app.delete('/tasks/:id', async (req, res) => {
  const taskId = parseInt(req.params.id);
  const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [
    taskId,
  ]);
  const task = result.rows[0];

  if (!task) {
    return res.status(404).json({ error: `Task ${taskId} not found` });
  }

  await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
