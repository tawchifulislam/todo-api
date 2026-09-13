const express = require('express');
const swaggerUi = require('swagger-ui-express');
const openapiDocument = require('./openapi.json');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));

// In-memory "database"
let tasks = [
  { id: 1, title: 'Buy groceries', done: false },
  { id: 2, title: 'Walk 1 km', done: true },
  { id: 3, title: 'Read a book', done: false },
];
let nextId = 4;

function findTaskOrFail(req, res) {
  const taskId = Number(req.params.id);
  const task = tasks.find(t => t.id === taskId);
  if (!task) {
    res.status(404).json({ error: `Task ${req.params.id} not found` });
    return null;
  }
  return task;
}

// Root & health
app.get('/', (req, res) => {
  res.json({
    name: 'Task API',
    version: '1.0',
    endpoints: ['/tasks', '/tasks/:id', '/health'],
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});


// Read
app.get('/tasks', (req, res) => {
  res.json(tasks);
});

app.get('/tasks/:id', (req, res) => {
  const task = findTaskOrFail(req, res);
  if (!task) return;
  res.json(task);
});

// Create
app.post('/tasks', (req, res) => {
  const { title } = req.body ?? {};

  if (typeof title !== 'string' || title.trim() === '') {
    return res
      .status(400)
      .json({ error: 'title is required and cannot be empty' });
  }

  const newTask = { id: nextId++, title: title.trim(), done: false };
  tasks.push(newTask);
  res.status(201).json(newTask);
});

// Update
app.put('/tasks/:id', (req, res) => {
  const task = findTaskOrFail(req, res);
  if (!task) return;

  const { title, done } = req.body ?? {};

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

  res.json(task);
});

// Delete
app.delete('/tasks/:id', (req, res) => {
  const taskId = Number(req.params.id);
  const index = tasks.findIndex(t => t.id === taskId);

  if (index === -1) {
    return res.status(404).json({ error: `Task ${req.params.id} not found` });
  }

  tasks.splice(index, 1);
  res.status(204).send();
});

// 404 fallback for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
