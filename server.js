const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
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

// Connect to SQLite database
const dbPath = path.resolve(__dirname, 'your_database.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Connected to the SQLite database');
  }
});

// Create a table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS your_table (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contentDate TEXT,
    contentTime TEXT,
    accessionNumber INTEGER,
    exposureMode TEXT,
    protocol TEXT,
    bodyPartExamined TEXT,
    patientOrientation TEXT
    -- Add other column names here (without a trailing comma)
  )
`, function (err) {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Table created or already exists');
  }
});

// Serve static files from the 'public' folder
app.use(express.static('public'));

// Handle file upload and database operations
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    // Perform database mapping logic here
    const data = req.body; // Assuming you also send some data along with the file

    // Split the data into individual fields
    const dataArray = data.split('\t');

    // Extract data fields
    const contentDate = dataArray[0];
    const contentTime = dataArray[1];
    const accessionNumber = dataArray[2];
    const exposureMode = dataArray[3];
    const protocol = dataArray[4];
    const bodyPartExamined = dataArray[5];
    const patientOrientation = dataArray[6];
    // ... continue extracting other fields

    // Insert data into the SQLite database
    db.run(`
      INSERT INTO your_table (
        contentDate, contentTime, accessionNumber, exposureMode, protocol,
        bodyPartExamined, patientOrientation
        -- Add other column names here
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [contentDate, contentTime, accessionNumber, exposureMode, protocol, bodyPartExamined, patientOrientation
    // ... continue adding other values
    ], function (err) {
      if (err) {
        console.error(err.message);
        res.status(500).send('Internal Server Error');
      } else {
        console.log(`Row inserted with ID: ${this.lastID}`);
        res.status(200).send('File uploaded and database updated successfully!');
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
