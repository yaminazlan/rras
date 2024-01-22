const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const csvParser = require('csv-parser');
const { parse, format } = require('date-fns');
const { utcToZonedTime } = require('date-fns-tz');

const app = express();
const port = 3000;

// Set up EJS as the view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

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
    accessionNumber TEXT,
    exposureMode TEXT,
    protocol TEXT,
    bodyPartExamined TEXT,
    patientOrientation TEXT,
    viewPosition TEXT,
    operatorName TEXT,
    rejectDate TEXT,
    rejectTime TEXT,
    rejectReason TEXT,
    rejectOperatorName TEXT,
    dap TEXT,
    absorbedDose TEXT,
    airKerma TEXT,
    rex TEXT,
    ei TEXT,
    eit TEXT,
    di TEXT,
    kV TEXT,
    mA TEXT,
    ms TEXT,
    mAs TEXT,
    sid TEXT,
    sensorSN TEXT,
    workspace TEXT,
    sod TEXT
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
    const fileRows = [];
    let isFirstRow = true;

    fs.createReadStream(req.file.path)
      .pipe(csvParser({
        separator: ',',
        mapHeaders: ({ header, index }) => header.trim(), // Trim headers
      }))
      .on('data', (row) => {
        if (isFirstRow) {
          isFirstRow = false;
          return;
        }

        fileRows.push(row);
      })
      .on('end', () => {
        fileRows.forEach((data) => {
          const parsedDate = parse(data['Content date'], 'd/M/yyyy', new Date());
          const parsedTime = parse(data['Content time'], 'H:mm:ss', new Date());

          const zonedDate = utcToZonedTime(parsedDate, 'Asia/Kuala_Lumpur');
          const zonedTime = utcToZonedTime(parsedTime, 'Asia/Kuala_Lumpur');

          data.contentDate = format(zonedDate, 'yyyy-MM-dd');
          data.contentTime = format(zonedTime, 'HH:mm:ss');

          // Check for null or empty values in the CSV data and convert them to null
          Object.keys(data).forEach((columnName) => {
            data[columnName] = data[columnName] !== '' ? data[columnName] : null;
          });

          const placeholders = Object.keys(data).map(() => '?').join(', ');
          const columns = Object.keys(data);
          const values = Object.values(data);

          const query = `INSERT INTO your_table (${columns.join(', ')}) VALUES (${placeholders})`;

          db.run(query, values, function (err) {
            if (err) {
              console.error(err.message);
            } else {
              console.log(`Row inserted with ID: ${this.lastID}`);
            }
          });
        });

        res.status(200).send('File uploaded and database updated successfully!');
      });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});


app.get('/rras', (req, res) => {
  db.all('SELECT * FROM rrasMaster', [], (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Internal Server Error');
    } else {
      // Render the 'rras.ejs' file and pass the rows as data
      res.render('rras', { data: rows });
    }
  });
});
