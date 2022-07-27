const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require("mongoose")
require('dotenv').config()

// Connect to mongoDb
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(bodyParser.urlencoded({ extended: false }));
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${req.ip}`);
  next();
});
app.use(cors())
app.use(express.static('public'))

/* MongoDb schema and model definitions */
const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
  },
});
const exerciseSchema = new mongoose.Schema({
  user: userSchema,
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  durationMinutes: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: false,
    default: new Date(Date.now())
  }
});
const UserModel = mongoose.model('User', userSchema);
const ExerciseModel = mongoose.model('Exercise', exerciseSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
