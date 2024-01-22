const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();
const port = 3000;

// Configure Multer storage
const storage = multer.diskStorage({
  destination: './uploads',
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

// Connect to your database (example: using Mongoose)
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/your_database', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', function () {
  console.log('Connected to the database');
});

// Define a schema and model for your data
const YourModel = mongoose.model('YourModel', {
  // Define your schema fields here
  // Example: name: String, age: Number, etc.
});

// Express middleware to parse JSON data
app.use(express.json());

// Handle file upload and database operations
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    // Perform database mapping logic here
    const data = req.body; // Assuming you also send some data along with the file

    // Create a new document in the database
    const newRecord = new YourModel({
      // Map your data fields to the model
      // Example: name: data.name, age: data.age, etc.
    });

    // Save the document to the database
    await newRecord.save();

    res.status(200).send('File uploaded and database updated successfully!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
