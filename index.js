const express = require('express');
const app = express();
const PORT = 3000;

const tasks = [
  { id: 1, title: 'Buy groceries', done: false },
  { id: 2, title: 'Walk 1 km', done: true },
  { id: 3, title: 'Read a book', done: false },
];

app.use(express.json());

// Stage 1- root and health check endpoints

app.get('/', (req, res) => {
  res.json({ name: 'Task API', version: '1.0', endpoints: ['/tasks'] });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Stage 2- Read: List and Single Task

app.get('/tasks', (req, res) => {
  res.json(tasks);
});

app.get('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const task = tasks.find(t => t.id === taskId);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(task);
});

// Stage 3- Create: Add a new task
app.post('/tasks', (req, res) => {
  const { title } = req.body;

  if (!title || title.trim() === '') {
    return res
      .status(400)
      .json({ error: 'title is required and cannot be empty' });
  }

  const newTask = {
    id: tasks.length === 0 ? 1 : Math.max(...tasks.map(t => t.id)) + 1,
    title: title.trim(),
    done: false,
  };
  tasks.push(newTask);
  res.status(201).json(newTask);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
