const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bodyParser = require('body-parser');
const path = require('path');

// Initialize Express app
const app = express();

// Middleware
app.use(bodyParser.json());

// MongoDB Connection
const url = process.env.MONGODB_URI;  
const dbName = 'Todo';
let db;
let todosCollection;

// Connect to MongoDB
MongoClient.connect(url)
  .then(client => {
    db = client.db(dbName);
    todosCollection = db.collection('item');
    console.log('MongoDB connected successfully');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// API Routes
app.get('/api/todos', async (req, res) => {
  try {
    const todos = await todosCollection.find().sort({ _id: -1 }).toArray();
    res.json(todos);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching todos' });
  }
});
app.get('/', (req,res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.post('/api/todos', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Todo text is required' });
    }

    const todo = { text, completed: false };
    console.log('this is todo', todo);

    const result = await todosCollection.insertOne(todo);

    if (result.acknowledged) {
      // Retrieve the inserted document by its insertedId
      const insertedTodo = await todosCollection.findOne({ _id: result.insertedId });
      res.status(201).json(insertedTodo);
    } else {
      res.status(500).json({ message: 'Failed to insert todo' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error creating todo' });
  }
});



app.put('/api/todos/:id', async (req, res) => {
  try {
    const { completed } = req.body;
    const result = await todosCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { completed } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    const updatedTodo = await todosCollection.findOne({ _id: new ObjectId(req.params.id) });
    res.json(updatedTodo);
  } catch (error) {
    res.status(500).json({ message: 'Error updating todo' });
  }
});

app.delete('/api/todos/:id', async (req, res) => {
  try {
    const result = await todosCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting todo' });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
