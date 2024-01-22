const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();
const port = 3000;

const storage = multer.diskStorage({
  destination: './uploads',
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

app.use(express.static('public'));

app.post('/upload', upload.single('file'), (req, res) => {
  // Perform database mapping logic here (not implemented in this example)
  res.send('File uploaded successfully!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
