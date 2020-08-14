'use strict';

const express = require('express');


// Construct a router instance.
const router = express.Router();

const { check, validationResult } = require('express-validator');
const bcryptjs = require('bcryptjs');
const auth = require('basic-auth');
const { User } = require('./models/user');
const { Course } = require('./models/course');


//async handler function
function asyncHandler(cb){
    return async (req, res, next)=>{
        try {
        await cb(req,res, next);
        } catch(err){
        next(err);
        }
    };
}

//Authentication function
const authenticateUser = async (req, res, next) => {
    let message = null;
  
    // Parse the user's credentials from the Authorization header.
    const credentials = auth(req);
  
    // If the user's credentials are available...
    if (credentials) {
      // Attempt to retrieve the user from the data store
      // by their username (i.e. the user's "key"
      // from the Authorization header).
      const allUsers = await User.findAll();
      const user = allUsers.find(u => u.emailAddress === credentials.name);
  
      // If a user was successfully retrieved from the data store...
      if (user) {
        // Use the bcryptjs npm package to compare the user's password
        // (from the Authorization header) to the user's password
        // that was retrieved from the data store.
        const authenticated = bcryptjs
          .compareSync(credentials.pass, user.password);
  
        // If the passwords match...
        if (authenticated) {
          console.log(`Authentication successful for username: ${user.username}`);
  
          // Then store the retrieved user object on the request object
          // so any middleware functions that follow this middleware function
          // will have access to the user's information.
          req.currentUser = user;
        } else {
          message = `Authentication failure for username: ${user.username}`;
        }
      } else {
        message = `User not found for username: ${credentials.name}`;
      }
    } else {
      message = 'Auth header not found';
    }
  
    // If user authentication failed...
    if (message) {
      console.warn(message);
  
      // Return a response with a 401 Unauthorized HTTP status code.
      res.status(401).json({ message: 'Access Denied' });
    } else {
      // Or if user authentication succeeded...
      // Call the next() method.
      next();
    }
};


//*** USER ROUTES ***//


//GET route that returns the authenticated user.
router.get('/users', authenticateUser, asyncHandler( async (req, res) => {
    const authUser = req.currentUser;

    res.json({
        email: authUser.emailAddress
    });
}));

//POST route that creates a new user
// Route that creates a new user.
router.post('/users', [
  check('name')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a value for "name"'),
  check('username')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a value for "username"'),
  check('password')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a value for "password"'),
], asyncHandler(async (req, res) => {
  // Attempt to get the validation result from the Request object.
  const errors = validationResult(req);

  // If there are validation errors...
  if (!errors.isEmpty()) {
    // Use the Array `map()` method to get a list of error messages.
    const errorMessages = errors.array().map(error => error.msg);

    // Return the validation errors to the client.
    return res.status(400).json({ errors: errorMessages });
  }

  // check if the user already exists, and if it does do not proceed
  const newUser = req.body;
  const allUsers = await User.findAll();
  const existingUser = allUsers.find(u => u.emailAddress === newUser.emailAddress);
  if (existingUser) {
    errorMessage = "'Sorry, this user already exists'";
    return res.status(400).json({ errors: errorMessage });
  }

  // Get the user from the request body.
  const user = req.body;

  // Hash the new user's password.
  user.password = bcryptjs.hashSync(user.password);

  // Add the user to the `users` array.
  users.push(user);

  // Set the status to 201 Created and end the response.
  return res.status(201).end();
}));



//*** COURSE ROUTES ***//



//GET route that returns a list of courses (including the user that owns each course)
router.get('/courses', asyncHandler(async(req, res) => {
  const courses = await Course.findAll({
    include: [
      {
        model: User,
        as: 'user',
        attributes: ["id", "firstName", "lastName", "emailAddress"]
      },      
    ],
      attributes: ["id", "title", "description", "estimatedTime", "materialsNeeded", "userId"]
  });
    res.json(courses);
}));


module.exports = router;