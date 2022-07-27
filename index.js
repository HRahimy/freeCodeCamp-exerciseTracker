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
  username: {
    type: String,
    required: true,
  },
});
const exerciseSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  userid: {
    type: mongoose.ObjectId,
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

app.route('/api/users')
  .get((req, res) => {
    UserModel.find()
      .select(['username', '_id'])
      .exec((err, data) => {
        if (err) {
          console.log(err);
          res.json({error: 'unexpected error getting users'});
          return;
        }
        const returnData = data.map((e) => {
          return {
            username: e.username,
            _id: e._id
          };
        });
        res.json(returnData);
    });
  })
  .post((req, res) => {
  if (!req.body.username) {
    res.json({error: 'username required'});
    return;
  }

  const newUser = new UserModel({username: req.body.username});
  newUser.save((err, data) => {
    if (err) {
      console.log(err);
      res.json({error: 'could not save user'});
      return;
    }
    res.json({
      username: data.username,
      _id: data._id
    });
  });
});

app.post('/api/users/:_id/exercises', (req, res) => {
  if (!req.params._id) {
    res.json({error: '_id is required'});
    return;
  }
  if (!req.body.description) {
    res.json({error: 'description is required'});
    return;
  }
  if (!req.body.duration) {
    res.json({error: 'duration is required'});
  }
  let date;
  if (!req.body.date) {
    date = new Date(Date.now());
  } else {
    // Solution to convert unix timestamp into Date object adapted from:
    // https://stackoverflow.com/a/847196/5472560
    date = new Date(isNaN(req.body.date) ?req.body.date : +req.body.date);
  
    // Solution to check if date is valid adapted from:
    // https://stackoverflow.com/a/10589791/5472560
    if (!(date instanceof Date && !isNaN(date.valueOf()))) {
      res.json({
        error: "Invalid Date"
      });
      return;
    }
  }

  UserModel.findById(req.params._id, (findUserErr, dbUser) => {
    if (findUserErr) {
      res.json({error: 'user not found'});
    } else {
      const exercise = new ExerciseModel({
        username: dbUser.username,
        userid: dbUser._id,
        description: req.body.description,
        durationMinutes: req.body.duration,
        date: date
      });
      exercise.save((err, data) => {
        if (err) {
          console.log(err);
          res.json({error: 'could not save exercise'});
        } else {
          const returnExercise = {
            username: data.username,
            _id: data.userid,
            description: data.description,
            duration: data.durationMinutes,
            date: data.date.toDateString(),
          };
          res.json(returnExercise);
        }
      });
    }
  });
});

app.get('/api/users/:_id/logs', (req, res) => {
  if(!req.params._id) {
    res.json({error: '_id is required'});
    return;
  }

  ExerciseModel.find({userid: req.params._id}, (err, data) => {
    if (err) {
      console.log(err);
      res.json({error: 'error getting logs'});
    } else {
      const dto = {
        username: data[0].username,
        _id: data[0].userid,
        count: data.length,
        log: data.map((ex) => {
          return {
            description: ex.description,
            duration: ex.durationMinutes,
            date: ex.date.toDateString()
          };
        })
      };
      console.log(dto);
      res.json(dto);
    }
  });
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
