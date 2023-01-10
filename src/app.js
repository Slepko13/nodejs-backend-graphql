const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');

const feedRoutes = require('./routes/feed');

const app = express();
const MONGODB_URI =
  'mongodb+srv://node-complete:nodecomplete@cluster0.etxrz.azure.mongodb.net/messages?retryWrites=true&w=majority';

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'src/images');
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toString() + '-' + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(bodyParser.json());
app.use(
  multer({
    storage: fileStorage,
    fileFilter,
  }).single('image')
);
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use('/src/images', express.static(path.join(__dirname, 'images')));
app.use('/feed', feedRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  const { statusCode: status = 500, message } = error;
  res.status(status).json({ message });
});

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((res) => {
    app.listen(8080, () => {
      console.log('Server is running');
    });
  })
  .catch((err) => {
    console.log(err);
  });
