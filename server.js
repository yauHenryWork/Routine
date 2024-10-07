const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const bodyParser = require("body-parser");
const { mongoURI } = require("./confidential");
const expressLayouts = require('express-ejs-layouts');

const app = express();
const port = 3000;

// Set up view engine
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');

// MongoDB client setup
const client = new MongoClient(mongoURI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('dashboard'));

// Middleware to log route calls
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Request Body:', req.body);
  next();
});

async function startServer() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");

    const db = client.db("routine");
    const tasksCollection = db.collection("tasks");

    // Home route
    app.get('/', async (req, res) => {
      try {
          const tasks = await tasksCollection.find({}).toArray();
          res.render('home', { title: 'Home Page', tasks: tasks });
      } catch (err) {
          console.error("Error fetching tasks:", err);
          res.render('home', { title: 'Home Page', tasks: [], error: 'Error fetching tasks' });
      }
  });

    // Add Task page route
    app.get('/addTask', (req, res) => {
      res.render('addTask', { title: 'Add Task' });
  });

    // Add Task POST route
    app.post('/addTask', async (req, res) => {
      try {
        console.log("Received data:", req.body);
        const { name, description, repeat } = req.body;
        
        if (!name || !description || !repeat) {
          return res.status(400).json({ message: "Missing required fields" });
        }
    
        const createdTime = new Date();
        const lastUpdateTime = createdTime;
        const status = 'pending'; // Default status for new tasks
    
        const newTask = {
          name,
          description,
          createdTime,
          lastUpdateTime,
          status,
          repeat
        };
    
        const result = await tasksCollection.insertOne(newTask);
    
        if (result.acknowledged) {
          res.json({ message: "Task added successfully" });
        } else {
          res.status(500).json({ message: "Failed to add task" });
        }
      } catch (err) {
        console.error("Error adding task:", err);
        res.status(500).json({ message: "Error adding task: " + err.message });
      }
    });

    // Get today's tasks route
    // app.get('/tasks/today', async (req, res) => {
    //   const today = new Date().toISOString().split('T')[0];
    //   const tasks = await tasksCollection.find({
    //     statuses: { $elemMatch: { date: today, status: "pending" } }
    //   }).toArray();
    //   res.json(tasks);
    // });

    // Update task status route
    app.post('/updateTaskStatus', async (req, res) => {
      try {
        const { taskId, status } = req.body;
        const result = await tasksCollection.updateOne(
          { _id: new ObjectId(taskId) },
          { $set: { status: status, lastUpdateTime: new Date() } }
        );

        if (result.modifiedCount === 1) {
          res.json({ message: "Task status updated successfully" });
        } else {
          res.status(404).json({ message: "Task not found" });
        }
      } catch (err) {
        console.error("Error updating task status:", err);
        res.status(500).json({ message: "Error updating task status" });
      }
    });

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
  }
}

startServer().catch(console.dir);