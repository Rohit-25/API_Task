const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Task = require('../eired/model/TaskModel');
const User = require('../eired/model/UserModel')
const mongoose = require('mongoose');
const app = express();
const session = require('express-session');
app.use(bodyParser.json());

app.get('/',(req,res)=>{
    res.send("hey");
})

//#region Register
app.post('/register', async (req,res)=>{
    try{
        const {name, email, password} =req.body;

        if(!name || !email || !password ){
            return res.send('please provide Name , email and Password');
        }

        const hashedpassword  = await bcrypt.hash(password,8);

        const user = await User.create({ name, email, password: hashedpassword });

        res.send(`User ${name} with email ${email} registered successfully`);
    }
    catch(err){
        res.send('Unable to register user');

    }
})
//#endregion

//#region Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    // Find the user with the specified email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
  
    // Compare the password with the hashed password in the database
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.json({ message: 'Invalid email or password' });
    }
  
    // Generate an OTP and send it to the user's email
    const otp = Math.floor(Math.random() * 1000000);
    user.otp = otp;
    await user.save();
  
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'kkvagh4321@gmail.com',
        pass: 'OTPverify@123'
      }
    });
  
    const mailOptions = {
      from: 'kkvagh4321@gmail.com',
      to: email,
      
      subject: 'OTP Verification sent by Rohit',
      text: `Your OTP is ${otp}`
    };
  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  
    // Set the user's isLoggedIn flag to true and save the user
    user.isLoggedIn = true;
    await user.save();
  
    // Return a JWT token that can be used to authenticate the user in future requests
    const token = jwt.sign({ email }, 'secret', { expiresIn: '300000s' });
  
    res.status(200).json({ token });
  });
  //#endregion

//#region  Logout
 
  app.post('/logout', async (req, res) => {
    const { email, otp } = req.body;
  
    // Find the user with the specified email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or OTP' });
    }
  
    // Verify that the OTP is correct
    if (user.otp !== otp) {
      return res.status(401).json({ message: 'Invalid d email or OTP' });
    }
  
    // Set the user's isLoggedIn flag to false and clear the OTP
    user.isLoggedIn = false;
    user.otp = null;
    await user.save();
  
    res.status(200).json({ message: 'User logged out successfully' });
  });
  
//#endregion


//#region  Authenticate
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  jwt.verify(token, 'secret', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    req.user = user;
    console.log("user from auth ")
    next();
  });
}
//#endregion
//#region task

  // app.post('/tasks', async (req, res) => {
  //   console.log(req.headers);
  //     const authHeader = req.headers['authorization'];
  //   const token = authHeader && authHeader.split(' ')[1];
  //   // console.log(token);
  //   if (!token) {
  //     return res.status(401).json({ message: 'Authorization token missing' });
  //   }
  
  //   try {
  //     const decoded = jwt.verify(token, 'secret');
      
  //     const user = await User.findOne({ email: decoded.email });
  //     console.log(user.email);
  //     if (!user) {
  //       return res.status(401).json({ message: 'Invalid authorization token' });
  //     }
  
  //     const { date, task, status } = req.body;
  
  //     // Create a new task and associate it with the logged in user
  //     const newTask = new Task({
  //       date,
  //       task,
  //       status,
  //       user: user.email
  //     });
  
  //     await newTask.save();
  
  //     res.status(200).json({ message: 'Task created successfully' });
  //   } catch (err) {
  //     console.log(err.message)
  //     return res.status(401).json({ message: 'Invalidffauthorization token' });
  //   }
  // });
  //#endregion

  //#region trying  task with authorization function
  app.post('/tasks', authenticateToken,async (req, res) => {
    try {
      const user = await User.findOne({ email: req.user.email });
      if (!user) {
        return res.status(401).json({ message: 'Invalid authorization token' });
      }
      const { date, task, status } = req.body;
  
      // Create a new task and associate it with the logged in user
      const newTask = new Task({
        date,
        task,
        status,
        userId: user.email
      });
  
      await newTask.save();
  
      res.status(200).json({ message: 'Task created successfully' });
    } catch (err) {
      console.log(err.message)
      return res.status(401).json({ message: 'Invalid authorization token' });
    }
  });
  //#endregion
 
//#region edit task

app.patch('/task/:id', authenticateToken, async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.email;

    // Find the task by id and user id
    const task = await Task.findOne({ _id: taskId});
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Update the task with the new values
    if (req.body.date) {
      task.date = req.body.date;
    }
    if (req.body.task) {
      task.task = req.body.task;
    }
    if (req.body.status) {
      task.status = req.body.status;
    }

    // Save the updated task to the database
    await task.save();

    res.status(200).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
//#endregion
 
//#region delete task
app.delete('/task/:id', authenticateToken, async (req, res) => {
  try {
    const taskId = req.params.id;
    // const userId = req.user.email;

    // Find the task by id and user id
    const task = await Task.findOne({ _id: taskId});
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    await task.remove();

    res.status(200).json({message: " task deleted Successfully"});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
//#endregion

//#region get all users

app.get('/tasks', authenticateToken,async (req, res) => {
   try {
    const user = await User.findOne({ email: req.user.email });
    // console.log(user.email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid afa authorization token' });
    }
    const { date, task, status } = req.body;
    // Create a new task and associate it with the logged in user
    const newTask = new Task({
      date,
      task,
      status,
      user: user.email
    });

    await newTask.save();

    res.status(200).json({ message: 'Task created successfully' });
  } catch (err) {
    console.log(err.message)
    return res.status(401).json({ message: 'Invalid authorization token' });
  }
});

//#endregion


  
  
  
  

mongoose.connect('mongodb://localhost:27017/elRED_Assign', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    app.listen(3000, () => console.log('Server started on port 3000'));
  })
  .catch(err => console.error(err));




