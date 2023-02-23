const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Task = require('./model/TaskModel');
const User = require("./model/UserModel")
const mongoose = require('mongoose');
const app = express();
const session = require('express-session');
app.use(bodyParser.json());
let env = require(`dotenv`);
let mongo = require(`mongodb`);
let port=process.env.PORT || 9800;
let mongoUrl = "mongodb+srv://Admin:pass123@cluster0.jcbz5t0.mongodb.net/elRED_Assign?retryWrites=true&w=majority"

app.get('/', (req, res) => {
    res.send("hey");
})

//#region Register
app.post('/register', async (req, res) => {
    try {
        const {
            name,
            email,
            password
        } = req.body;

        if (!name || !email || !password) {
            return res.send('please provide Name , email and Password');
        }

        const hashedpassword = await bcrypt.hash(password, 8);

        const user = await User.create({
            name,
            email,
            password: hashedpassword
        });

        res.send(`User ${name} with email ${email} registered successfully`);
    } catch (err) {
    
        res.send('User Already Exists!');

    }
})
//#endregion

//#region Login
app.post('/login', async (req, res) => {
    const {
        email,
        password
    } = req.body;

    // Find the user with the specified email
    const user = await User.findOne({
        email
    });
    if (!user) {
        return res.status(401).json({
            message: 'Invalid email or password'
        });
    }

    // Compare the password with the hashed password in the database
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
        return res.json({
            message: 'Invalid email or password'
        });
    }

    // Generate an OTP and send it to the user's email
    const otp = Math.floor(Math.random() * 1000000);
    user.otp = otp;
    await user.save();


    const transporter = nodemailer.createTransport({
      host: 'smtp.mail.yahoo.com',
      port: 465,
      secure: true, // use SSL
      auth: {
          user: '',
          pass: ''
      }
  });
  
  // send mail with defined transport object
  const mailOptions = {
      from: 'otpfromrohit123@yahoo.com',
      to: 'rohitgadekar6@gmail.com',
      subject: 'Test Email',
      text: 'This is a test email sent from Node.js using Nodemailer and Yahoo Mail'
  };
  
  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          console.log('Error occurred:', error.message);
          return;
      }
      console.log('Message sent successfully!');
      console.log('Server responded with:', info.response);
  });
  
    // Set the user's isLoggedIn flag to true and save the user
    user.isLoggedIn = true;
    await user.save();

    // Return a JWT token that can be used to authenticate the user in future requests
    const token = jwt.sign({
        email
    }, 'secret', {
        expiresIn: '30s'
    });

    res.status(200).json({
        token
    });
});
//#endregion

//#region  Logout
app.post('/logout', async (req, res) => {
    const {
        email,
        password
    } = req.body;

    // Find the user with the specified email
    const user = await User.findOne({
        email
    });
    if (!user) {
      return res.status(401).json({
          message: 'Invalid email or password'
      });
  }

  // Compare the password with the hashed password in the database
  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
      return res.json({
          message: 'Invalid email or password'
      });
  }

    // Set the user's isLoggedIn flag to false and clear the OTP
    user.isLoggedIn = false;
   
    await user.save();

    res.status(200).json({
        message: 'User logged out successfully'
    });
});

//#endregion


//#region  Authenticate
function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            message: 'Unauthorized'
        });
    }

    jwt.verify(token, 'secret', (err, user) => {
        if (err) {
            console.log(err.message);
            return res.status(403).json({
                message: 'Forbidden'
            });
        }
        req.user = user;

        next();
    });
}
//#endregion


//#region create task
app.post('/tasks', authenticateToken, async (req, res) => {


    try {
        const user = await User.findOne({
            email: req.user.email
        });
        if (!user) {
            return res.status(401).json({
                message: 'Please login first to create task'
            });
        }

        const {
            date,
            task,
            status
        } = req.body;
        // Create a new task and associate it with the logged in user
        const newTask = new Task({
            date,
            task,
            status,
            userId: user.email,
        });
        await newTask.save();
        res.status(200).json({
          message: `Task created successfully with id : ${newTask._id}`
          
      })
       
    } catch (err) {
        console.log(err.message)
        return res.status(401).json({
            message: 'Invalid authorization token'
        });
    }
});
//#endregion

//#region edit task
app.patch('/task/:id', authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.id;
        const userId = req.user.email;

        // Find the task by id and user id
        const task = await Task.findOne({
            _id: taskId
        });
        if (!task) {
            return res.status(404).json({
                message: 'Task not found'
            });
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
        res.status(500).json({
            message: 'Internal server error'
        });
    }
});
//#endregion

//#region delete task
app.delete('/task/:id', authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.id;
        // const userId = req.user.email;

        // Find the task by id and user id
        const task = await Task.findOne({
            _id: taskId
        });
        if (!task) {
            return res.status(404).json({
                message: 'Task not found'
            });
        }
        await task.remove();

        res.status(200).json({
            message: " task deleted Successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Internal server error'
        });
    }
});
//#endregion


//#region get all tasks
app.get('/tasks', authenticateToken, async (req, res) => {

    try {
        const {
            page,
            pageSize
        } = req.body;
        const email = req.user.email;
        const totalTasks = await Task.countDocuments({
            userId: email
        });
        const totalPages = Math.ceil(totalTasks / pageSize);
        const tasksToSkip = (page - 1) * pageSize;

        const AllTask = await Task.find({
                email: req.user.email
            }, {
                _id: 0,
                userId: 1,
                date: 1,
                task: 1,
                status: 1
            })
            .skip(tasksToSkip)
            .limit(pageSize);

        console.log(AllTask)

        res.send(AllTask);
    } catch (err) {
        console.log(err.message)
        return res.status(401).json({
            message: 'Invalid authorization token'
        });
    }
});

//#endregion

//#region Sort Task

// Sort task function based on the provided field
function sortTasks(tasks, sortField) {
    if (sortField === 'date') {
        // Sort the tasks based on the timestamp field
        tasks.sort((a, b) => a.date - b.date);
    } else if (sortField === 'task') {
        // Sort the tasks based on the task field
        tasks.sort((a, b) => a.task.localeCompare(b.task));
    }
    return tasks;
}


app.post('/sort/data', authenticateToken, async (req, res) => {
    try {
        // Get the data from the request body
        const {
            sortField
        } = req.body;
        const Alltask = await Task.find({
            userId: req.user.email
        });

        // Sort the data by timestamp and task
        const sortedData = sortTasks(Alltask, sortField);

        // Delete all previous records
        await Task.deleteMany({
            userId: req.user.email
        });

        // Insert the sorted data into the database
        await Task.insertMany(sortedData);

        // Send a success response
        res.status(200).send({
            message: 'Data sorted and inserted successfully.'
        });
    } catch (err) {
        // Send an error response
        res.status(500).send({
            error: err.message
        });
    }
});

//#region  db connection
// Mongodb connectiom
mongoose.connect(mongoUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => {
        app.listen(port, () => console.log(`Server started on ${port}`));
    })
    .catch(err => console.error(err));

//#endregion

