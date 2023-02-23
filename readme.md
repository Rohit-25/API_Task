# About
This project contains a set of APIs that allow registered users to manage tasks. Users can log in using their email ID and password, and then create, update, delete, and retrieve tasks. The tasks include a date, a task description, and a status (completed or incomplete).

All APIs require a valid user session and authentication token, which is generated when the user logs in. The user session expires after 30 seconds of inactivity, and an error message is displayed if the user tries to access an API with an invalid session.

The APIs are implemented using Node.js and the Express.js framework. They use MongoDB as the backend database to store user information and tasks.

# API endpoints:
POST /register
Allows new user to register using Name, email and password

POST /login
Allows users to log in using their email ID and password
Returns an authentication token that should be included in subsequent requests as a bearer token in the Authorization header

POST /tasks
Allows logged-in users to create a new task
Requires the following fields: date, task (string), and status (Completed or Incomplete)

PATCH /tasks/:id
Allows logged-in users to update an existing task
Users can update one or more fields of the task object ( task, status)

DELETE /tasks/:id
Allows logged-in users to delete a task by ID

GET /api/tasks
Allows logged-in users to retrieve all tasks
Supports pagination using the query parameters 

POST /api/tasks/sort
Allows logged-in users to sort tasks by ID and update the order of the tasks
Users should post a sorted list of task IDs in the request body as an array
The order of the tasks will be updated accordingly

Invalid email or password
User session is not authorised
Invalid authentication token
Task not found
Invalid request parameters (e.g., missing required fields)
Internal server error (e.g., database error)
To run the project locally:

Clone the repository
Install dependencies: npm install
Create a .env file with the following variables:
MONGODB_URI: MongoDB connection string
JWT_SECRET: secret key used to generate authentication tokens
JWT_EXPIRATION: expiration time for authentication tokens (e.g., 30s)
Start the server: npm start
To test the project:

Run npm app to run unit tests
Use an HTTP client (e.g., Postman) to test the APIs



Regenerate response